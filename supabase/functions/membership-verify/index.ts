// ============================================================
// membership-verify · 会员开通 Edge Function
// 模拟支付校验 → 创建 user_memberships → 更新 profiles
// → 返回 entitlements（服务端为准，防本地绕过）
// ============================================================
import { corsHeaders, handleCors, json, withAuth, serviceClient } from '../_shared/cors.ts';

interface MembershipBody {
  plan_id: string;
  provider?: 'mock' | 'appstore' | 'alipay' | 'wechat';
  txn?: string;
  action?: 'subscribe' | 'renew' | 'cancel';
}

const PERIOD_MONTHS: Record<string, number> = {
  month: 1,
  quarter: 3,
  year: 12,
  lifetime: 1200, // 终身按 100 年计
};

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const authed = await withAuth(req);
  if (authed instanceof Response) return authed;
  const { user } = authed;

  const body = (await req.json().catch(() => null)) as MembershipBody | null;
  if (!body?.plan_id) {
    return json({ code: 42200, message: '缺少 plan_id' }, 422);
  }
  const action = body.action ?? 'subscribe';
  const provider = body.provider ?? 'mock';

  if (provider === 'mock') {
    // 模拟支付：任何非空 txn 视为支付成功
    if (!body.txn) {
      return json({ code: 42200, message: '模拟支付缺少 txn 回执' }, 422);
    }
  }

  const service = serviceClient();

  // 校验套餐
  const { data: plan } = await service
    .from('membership_plans')
    .select('id, name, price, period, benefits')
    .eq('id', body.plan_id)
    .eq('is_active', true)
    .maybeSingle();
  if (!plan) {
    return json({ code: 40400, message: '套餐不存在或已下架' }, 404);
  }

  if (action === 'cancel') {
    // 取消：标记 cancelled，权益保留至到期日（对齐自动续费惯例）
    const { error: upErr } = await service
      .from('user_memberships')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (upErr) {
      return json({ code: 50000, message: `取消失败: ${upErr.message}` }, 500);
    }
  } else {
    // subscribe / renew：计算到期时间
    const now = new Date();
    const months = PERIOD_MONTHS[plan.period] ?? 1;
    const expires = new Date(now);
    if (plan.period === 'lifetime') {
      expires.setFullYear(now.getFullYear() + 100);
    } else {
      expires.setMonth(now.getMonth() + months);
    }

    const { error: umErr } = await service.from('user_memberships').insert({
      user_id: user.id,
      plan_id: plan.id,
      status: 'active',
      provider,
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      original_txn: body.txn ?? null,
    });
    if (umErr) {
      return json({ code: 50000, message: `写入会员记录失败: ${umErr.message}` }, 500);
    }

    const { error: profErr } = await service
      .from('profiles')
      .update({
        tier: 'member',
        plan_id: plan.id,
        member_expires_at: expires.toISOString(),
      })
      .eq('id', user.id);
    if (profErr) {
      return json({ code: 50000, message: `更新用户资料失败: ${profErr.message}` }, 500);
    }
  }

  // 返回 entitlements（服务端计算）
  const { data: entitlements } = await service.rpc('get_entitlements');

  return json({
    code: 0,
    data: {
      status: action === 'cancel' ? 'cancelled' : 'active',
      plan: { id: plan.id, name: plan.name, period: plan.period },
      expires_at: action === 'cancel' ? null : entitlements?.expires_at ?? null,
      entitlements: entitlements?.entitlements ?? [],
      tier: entitlements?.tier ?? (action === 'cancel' ? 'free' : 'member'),
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('membership-verify error', err);
    return json({ code: 50000, message: '会员操作失败，请稍后重试' }, 500);
  }
});
