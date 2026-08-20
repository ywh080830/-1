// 共享 CORS + JWT 鉴权工具（全部 Edge Functions 复用）
import { createClient, SupabaseClient, User } from 'npm:@supabase/supabase-js@2';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/** 统一 JSON 响应（附 CORS 头） */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** OPTIONS 预检处理；非预检返回 null */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

/** 以当前用户 JWT 构造客户端（RLS 生效） */
export function clientWithToken(token: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

/** 服务端特权客户端（绕过行级安全策略，仅服务端内部使用） */
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * 统一鉴权：校验 Authorization: Bearer <JWT>
 * 返回 { user, client } 或一个 401 Response
 */
export async function withAuth(
  req: Request,
): Promise<{ user: User; client: SupabaseClient } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ code: 40100, message: '未登录或缺少凭证' }, 401);
  }
  const token = authHeader.slice(7);
  const client = clientWithToken(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return json({ code: 40100, message: '凭证无效或已过期' }, 401);
  }
  return { user: data.user, client };
}
