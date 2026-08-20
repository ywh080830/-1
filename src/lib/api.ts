/**
 * 统一 API 封装 · 06-系统设计 §7.3
 * - 所有后端调用走本模块：api.rpc / api.from / 业务方法
 * - 统一错误码映射 + 401 跳登录 + toast
 * - 页面/Store 禁止直接散写后端客户端（lib/supabase.ts 仅导出 client）
 */
import { supabase } from './supabase';
import { ErrorCode } from '@/types/api';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import type {
  AccountRow,
  BudgetRow,
  CategoryRow,
  GoalRow,
  LedgerMemberRow,
  LedgerRow,
  LoanRow,
  MembershipPlanRow,
  MerchantRow,
  MerchantAliasRow,
  OcrJobRow,
  ProfileRow,
  SupportMessageRow,
  SupportSessionRow,
  SupportTicketRow,
  TemplateRow,
  TransactionRow,
} from '@/types/database';
import type {
  CalendarDay,
  Entitlements,
  ExportResult,
  FaqResult,
  ImportResult,
  MembershipResult,
  OcrResponse,
  SearchHit,
  StatsSummary,
  TrendPoint,
} from '@/types/api';

export class ApiError extends Error {
  code: number;
  requestId?: string;

  constructor(code: number, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
  }
}

/** 从服务端异常消息中提取业务错误码（RPC RAISE EXCEPTION '40300' 等） */
function extractCode(message: string): number | null {
  const m = /(40100|40101|40300|40400|40900|40901|42200|42900|50000)/.exec(message ?? '');
  return m ? Number(m[0]) : null;
}

const CODE_MESSAGES: Record<number, string> = {
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.OAUTH_FAILED]: '第三方登录失败',
  [ErrorCode.FORBIDDEN]: '无权限访问该账本，如需协助请联系客服',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.CONFLICT]: '同步冲突，已自动重拉远端数据',
  [ErrorCode.DUPLICATE]: '内容重复，请勿重复提交',
  [ErrorCode.VALIDATION]: '参数校验失败，请检查表单',
  [ErrorCode.RATE_LIMIT]: '操作过于频繁，请稍后再试',
  [ErrorCode.SERVER]: '服务器开小差了，请稍后重试',
};

export function toApiError(error: unknown, fallback = '网络异常，请检查连接'): ApiError {
  const raw = error as { message?: string; code?: string; status?: number } | null;
  const message = raw?.message ?? fallback;
  let code = extractCode(message);
  if (code === null && typeof raw?.status === 'number') {
    if (raw.status === 401) code = ErrorCode.UNAUTHORIZED;
    else if (raw.status === 403) code = ErrorCode.FORBIDDEN;
    else if (raw.status === 404) code = ErrorCode.NOT_FOUND;
    else if (raw.status === 422) code = ErrorCode.VALIDATION;
    else if (raw.status === 429) code = ErrorCode.RATE_LIMIT;
    else if (raw.status >= 500) code = ErrorCode.SERVER;
  }
  const finalCode = code ?? ErrorCode.SERVER;
  return new ApiError(finalCode, CODE_MESSAGES[finalCode] ?? message);
}

/** 统一错误处理：toast + 401 跳登录
 *  @param silent 后台数据加载失败时不弹 toast（避免后端不可用时反复弹窗）
 *  体验模式（isDemo）：无真实后端会话，所有后端请求 401 属正常现象，
 *  一律静默抛出，交由各层离线兜底，绝不弹窗、绝不强制跳登录，保证无缝使用。
 */
export function handleApiError(error: unknown, fallback?: string, silent = false): never {
  const e = error instanceof ApiError ? error : toApiError(error, fallback);
  // 体验模式：静默抛出（不弹 toast、不跳登录），由调用方走本地兜底
  if (useAuthStore.getState().isDemo) {
    throw e;
  }
  // 401 未授权处理分两种情形：
  // 1) 后台静默加载（silent，如切到「统计」页拉取 summary/trend/calendar）失败 →
  //    不清会话、不跳登录，直接抛出交由页面 catch 兜底展示空态。
  //    否则会在浏览过程中被「闪回」到登录页（本 bug 的根因）。
  //    真正的会话失效由后端会话状态监听统一处理（置 user=null → Protected 跳登录）。
  // 2) 显式操作（非 silent，如保存/删除）失败 → 会话可能已失效，清理会话即可；
  //    不再用 window.location.href 硬刷新整页（那本身就是一次「跳登录」观感），
  //    改由 Protected 守卫在复核真实会话后统一、平滑地处理跳转。
  if (e.code === ErrorCode.UNAUTHORIZED) {
    if (silent) throw e;
    useAuthStore.getState().clearSession();
    throw e;
  }
  if (!silent) useUiStore.getState().showToast('error', e.message);
  throw e;
}

interface EdgeResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

/** 调用 Edge Function（内部解析统一响应壳） */
async function invokeEdge<T>(fn: string, options: { body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, {
    body: options.body as Record<string, unknown> | FormData | string | Blob | ArrayBuffer | undefined,
    headers: options.headers,
  });
  if (error) {
    const edgeErr = error as {
      context?: { status?: number; json?: () => Promise<{ code?: number; message?: string }> };
      message?: string;
    };
    const status = edgeErr.context?.status;
    // 尝试解析 Edge Function 响应体中的业务错误码与消息
    let serverCode: number | undefined;
    let serverMessage: string | undefined;
    if (edgeErr.context?.json) {
      try {
        const body = await edgeErr.context.json();
        serverCode = body?.code;
        serverMessage = body?.message;
      } catch {
        /* 响应体非 JSON 时忽略 */
      }
    }
    if (status === 401) throw new ApiError(ErrorCode.UNAUTHORIZED, serverMessage ?? CODE_MESSAGES[ErrorCode.UNAUTHORIZED]);
    if (status === 403) throw new ApiError(serverCode ?? ErrorCode.FORBIDDEN, serverMessage ?? CODE_MESSAGES[ErrorCode.FORBIDDEN]);
    if (status === 422) throw new ApiError(serverCode ?? ErrorCode.VALIDATION, serverMessage ?? CODE_MESSAGES[ErrorCode.VALIDATION]);
    if (status === 429) throw new ApiError(ErrorCode.RATE_LIMIT, serverMessage ?? CODE_MESSAGES[ErrorCode.RATE_LIMIT]);
    throw new ApiError(serverCode ?? ErrorCode.SERVER, serverMessage ?? edgeErr.message ?? '服务调用失败');
  }
  const res = data as EdgeResponse<T>;
  if (res && typeof res.code === 'number' && res.code !== 0) {
    throw new ApiError(res.code, res.message ?? CODE_MESSAGES[res.code] ?? '服务调用失败');
  }
  return (res?.data ?? data) as T;
}

export const api = {
  /* ---------- 底层 ---------- */
  rpc: async <T>(name: string, args?: Record<string, unknown>, silent = false): Promise<T> => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) handleApiError(error, undefined, silent);
    return data as T;
  },

  from: (table: string) => supabase.from(table),

  invokeEdge,

  /* ---------- Auth ---------- */
  auth: {
    /** 服务端校验 Cloudflare Turnstile token（登录/注册/重置密码前置） */
    async verifyTurnstile(token: string, action?: 'login' | 'register' | 'reset_password') {
      await invokeEdge<{ hostname?: string | null }>('turnstile-verify', { body: { token, action } });
    },
    async signIn(identifier: string, password: string, turnstileToken?: string) {
      if (turnstileToken) {
        await this.verifyTurnstile(turnstileToken, 'login');
      }
      const isEmail = identifier.includes('@');
      const { data, error } = isEmail
        ? await supabase.auth.signInWithPassword({ email: identifier, password })
        : await supabase.auth.signInWithPassword({ phone: identifier, password });
      if (error) throw new ApiError(ErrorCode.UNAUTHORIZED, error.message);
      return data;
    },
    async signUp(email: string, password: string, nickname?: string, turnstileToken?: string) {
      if (turnstileToken) {
        await this.verifyTurnstile(turnstileToken, 'register');
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      });
      if (error) throw new ApiError(ErrorCode.VALIDATION, error.message);
      return data;
    },
    async resetPassword(email: string, turnstileToken?: string) {
      if (turnstileToken) {
        await this.verifyTurnstile(turnstileToken, 'reset_password');
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL ?? window.location.origin}/login`,
      });
      if (error) throw new ApiError(ErrorCode.VALIDATION, error.message);
    },
    async updatePassword(newPassword: string) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new ApiError(ErrorCode.VALIDATION, error.message);
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new ApiError(ErrorCode.SERVER, error.message);
    },
  },

  /* ---------- Profile ---------- */
  async getProfile(): Promise<ProfileRow | null> {
    const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
    if (error) handleApiError(error, undefined, true);
    return data;
  },
  async updateProfile(updates: Partial<Pick<ProfileRow, 'nickname' | 'avatar_url'>>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(ErrorCode.UNAUTHORIZED, CODE_MESSAGES[ErrorCode.UNAUTHORIZED]);
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) handleApiError(error);
  },

  /* ---------- Ledger ---------- */
  async listLedgers(): Promise<LedgerRow[]> {
    const { data, error } = await supabase.from('ledgers').select('*').order('created_at', { ascending: false });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as LedgerRow[];
  },
  async createLedger(name: string, type = 'family', currency = 'CNY'): Promise<{ id: string; name: string }> {
    return this.rpc('create_ledger', { p_name: name, p_type: type, p_currency: currency }, true);
  },
  async updateLedger(id: string, updates: Partial<Pick<LedgerRow, 'name' | 'scenario' | 'is_archived'>>): Promise<void> {
    const { error } = await supabase.from('ledgers').update(updates).eq('id', id);
    if (error) handleApiError(error);
  },
  async listMembers(ledgerId: string): Promise<LedgerMemberRow[]> {
    const { data, error } = await supabase.from('ledger_members').select('*').eq('ledger_id', ledgerId);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as LedgerMemberRow[];
  },
  async addMember(ledgerId: string, userId: string, role: 'editor' | 'viewer'): Promise<void> {
    const { error } = await supabase.from('ledger_members').insert({ ledger_id: ledgerId, user_id: userId, role });
    if (error) handleApiError(error);
  },
  async updateMemberRole(ledgerId: string, userId: string, role: 'editor' | 'viewer'): Promise<void> {
    const { error } = await supabase
      .from('ledger_members')
      .update({ role })
      .eq('ledger_id', ledgerId)
      .eq('user_id', userId);
    if (error) handleApiError(error);
  },
  async removeMember(ledgerId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('ledger_members').delete().eq('ledger_id', ledgerId).eq('user_id', userId);
    if (error) handleApiError(error);
  },

  /* ---------- Account ---------- */
  async listAccounts(ledgerId: string): Promise<AccountRow[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('ledger_id', ledgerId)
      .order('sort', { ascending: true });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as AccountRow[];
  },
  async saveAccount(row: Partial<AccountRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('accounts').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('accounts').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) handleApiError(error);
  },

  /* ---------- Category ---------- */
  async listCategories(ledgerId: string): Promise<CategoryRow[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`ledger_id.is.null,ledger_id.eq.${ledgerId}`)
      .order('sort', { ascending: true });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as CategoryRow[];
  },
  async saveCategory(row: Partial<CategoryRow> & { id?: string; ledger_id: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('categories').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('categories').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) handleApiError(error);
  },

  /* ---------- Transaction（直查服务端，离线走 syncEngine） ---------- */
  async listTransactions(ledgerId: string, opts: { start?: string; end?: string; limit?: number } = {}): Promise<TransactionRow[]> {
    let q = supabase
      .from('transactions')
      .select('*')
      .eq('ledger_id', ledgerId)
      .is('deleted_at', null)
      .order('txn_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(opts.limit ?? 200);
    if (opts.start) q = q.gte('txn_date', opts.start);
    if (opts.end) q = q.lte('txn_date', opts.end);
    const { data, error } = await q;
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as TransactionRow[];
  },
  async listDeleted(ledgerId: string): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('ledger_id', ledgerId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(100);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as TransactionRow[];
  },
  async restoreTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').update({ deleted_at: null }).eq('id', id);
    if (error) handleApiError(error);
  },

  /* ---------- Budget / Loan / Template / Goal ---------- */
  async listBudgets(ledgerId: string): Promise<BudgetRow[]> {
    const { data, error } = await supabase.from('budgets').select('*').eq('ledger_id', ledgerId);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as BudgetRow[];
  },
  async saveBudget(row: Partial<BudgetRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('budgets').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('budgets').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) handleApiError(error);
  },
  async listLoans(ledgerId: string): Promise<LoanRow[]> {
    const { data, error } = await supabase.from('loans').select('*').eq('ledger_id', ledgerId).order('created_at', { ascending: false });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as LoanRow[];
  },
  async saveLoan(row: Partial<LoanRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('loans').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('loans').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteLoan(id: string): Promise<void> {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) handleApiError(error);
  },
  async listTemplates(ledgerId: string): Promise<TemplateRow[]> {
    const { data, error } = await supabase.from('templates').select('*').eq('ledger_id', ledgerId);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as TemplateRow[];
  },
  async saveTemplate(row: Partial<TemplateRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('templates').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('templates').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) handleApiError(error);
  },
  async listGoals(ledgerId: string): Promise<GoalRow[]> {
    const { data, error } = await supabase.from('goals').select('*').eq('ledger_id', ledgerId);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as GoalRow[];
  },
  async saveGoal(row: Partial<GoalRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('goals').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('goals').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) handleApiError(error);
  },

  /* ---------- Merchant ---------- */
  async listMerchants(q?: string): Promise<MerchantRow[]> {
    const uid = supabase.auth.getUser();
    const myId = (await uid).data.user?.id;
    let query = supabase.from('merchants').select('*').or(`owner_id.is.null${myId ? `,owner_id.eq.${myId}` : ''}`);
    if (q) query = query.ilike('name', `%${q}%`);
    const { data, error } = await query.order('hit_count', { ascending: false }).limit(100);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as MerchantRow[];
  },
  async saveMerchant(row: Partial<MerchantRow> & { id?: string }): Promise<void> {
    if (row.id) {
      const { error } = await supabase.from('merchants').update(row).eq('id', row.id);
      if (error) handleApiError(error);
    } else {
      const { error } = await supabase.from('merchants').insert(row);
      if (error) handleApiError(error);
    }
  },
  async deleteMerchant(id: string): Promise<void> {
    const { error } = await supabase.from('merchants').delete().eq('id', id);
    if (error) handleApiError(error);
  },
  async listAliases(merchantId: string): Promise<MerchantAliasRow[]> {
    const { data, error } = await supabase.from('merchant_aliases').select('*').eq('merchant_id', merchantId);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as MerchantAliasRow[];
  },

  /* ---------- Stats RPC ---------- */
  statsSummary(ledgerId: string, month: string) {
    return this.rpc<StatsSummary>('stats_summary', { p_ledger: ledgerId, p_month: month }, true);
  },
  statsTrend(ledgerId: string, range: '3m' | '6m' | '12m') {
    return this.rpc<TrendPoint[]>('stats_trend', { p_ledger: ledgerId, p_range: range }, true);
  },
  statsCalendar(ledgerId: string, month: string) {
    return this.rpc<CalendarDay[]>('stats_calendar', { p_ledger: ledgerId, p_month: month }, true);
  },
  search(ledgerId: string, q: string) {
    return this.rpc<SearchHit[]>('search_transactions', { p_ledger: ledgerId, p_q: q });
  },

  /* ---------- OCR ---------- */
  recognize(formData: FormData): Promise<OcrResponse> {
    return invokeEdge<OcrResponse>('ocr-recognize', { body: formData });
  },
  async listOcrJobs(): Promise<OcrJobRow[]> {
    const { data, error } = await supabase.from('ocr_jobs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as OcrJobRow[];
  },
  async getOcrJob(id: string): Promise<OcrJobRow | null> {
    const { data, error } = await supabase.from('ocr_jobs').select('*').eq('id', id).maybeSingle();
    if (error) handleApiError(error, undefined, true);
    return data;
  },
  ocrConfirm(args: {
    job: string;
    ledger: string;
    category: string;
    account: string;
    amount: number;
    merchant: string | null;
    happenedAt: string;
    note: string | null;
    addToLibrary: boolean;
  }) {
    return this.rpc<{ transaction: TransactionRow; version: number }>('ocr_confirm', {
      p_job: args.job,
      p_ledger: args.ledger,
      p_category_id: args.category,
      p_account_id: args.account,
      p_amount: args.amount,
      p_merchant_id: args.merchant,
      p_happened_at: args.happenedAt,
      p_note: args.note,
      p_add_to_library: args.addToLibrary,
    });
  },

  /* ---------- Membership ---------- */
  getEntitlements(): Promise<Entitlements> {
    return this.rpc<Entitlements>('get_entitlements', undefined, true);
  },
  async listPlans(): Promise<MembershipPlanRow[]> {
    const { data, error } = await supabase.from('membership_plans').select('*').eq('is_active', true).order('price', { ascending: true });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as MembershipPlanRow[];
  },
  verifyMembership(args: { plan_id: string; provider?: string; txn?: string; action?: string }): Promise<MembershipResult> {
    return invokeEdge<MembershipResult>('membership-verify', { body: args });
  },

  /* ---------- Export / Import ---------- */
  exportExcel(args: { ledger_id: string; start?: string; end?: string; format?: 'xlsx' | 'csv' }): Promise<ExportResult> {
    return invokeEdge<ExportResult>('export-excel', { body: args });
  },
  importCsv(formData: FormData): Promise<ImportResult> {
    return invokeEdge<ImportResult>('import-csv', { body: formData });
  },

  /* ---------- Support ---------- */
  faq(q: string): Promise<FaqResult> {
    return invokeEdge<FaqResult>('support-faq', { body: { q } });
  },
  async listSessions(): Promise<SupportSessionRow[]> {
    const { data, error } = await supabase.from('support_sessions').select('*').order('started_at', { ascending: false });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as SupportSessionRow[];
  },
  async createSession(channel = 'bot', context?: Record<string, unknown>): Promise<SupportSessionRow> {
    const { data, error } = await supabase.from('support_sessions').insert({ channel, context }).select('*').single();
    if (error) handleApiError(error);
    return data;
  },
  async listMessages(sessionId: string): Promise<SupportMessageRow[]> {
    const { data, error } = await supabase.from('support_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as SupportMessageRow[];
  },
  async sendMessage(sessionId: string, content: string, clientMsgId: string): Promise<void> {
    const { error } = await supabase.from('support_messages').insert({
      session_id: sessionId,
      sender: 'user',
      msg_type: 'text',
      content,
      client_msg_id: clientMsgId,
    });
    if (error) {
      const e = toApiError(error);
      if (e.code === ErrorCode.DUPLICATE) return; // 幂等：重复消息忽略
      handleApiError(error);
    }
  },
  async rateSession(sessionId: string, score: number, comment?: string): Promise<void> {
    const { error } = await supabase.from('support_sessions').update({ rating: score, rating_comment: comment }).eq('id', sessionId);
    if (error) handleApiError(error);
  },
  async listTickets(): Promise<SupportTicketRow[]> {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) handleApiError(error, undefined, true);
    return (data ?? []) as SupportTicketRow[];
  },
  async createTicket(subject: string, description: string): Promise<void> {
    const { error } = await supabase.from('support_tickets').insert({ subject, description, status: 'pending' });
    if (error) handleApiError(error);
  },
};
