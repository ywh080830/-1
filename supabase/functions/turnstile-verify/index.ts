// ============================================================
// turnstile-verify · Cloudflare Turnstile 人机验证 Edge Function
// 前端登录/注册/忘记密码前调用：用服务端 secret key 校验 token，
// 校验通过才放行认证动作（防机器人批量注册/撞库/发垃圾邮件）。
// 注意：本函数在登录前调用，无 JWT，config.toml 中 verify_jwt = false
// ============================================================
import { corsHeaders, handleCors, json } from '../_shared/cors.ts';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface VerifyBody {
  token?: string;
  action?: string;
}

interface SiteverifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY 未配置');
    return json({ code: 50000, message: '服务端未配置人机验证密钥' }, 500);
  }

  const body = (await req.json().catch(() => null)) as VerifyBody | null;
  const token = body?.token?.trim();
  if (!token) {
    return json({ code: 42200, message: '缺少人机验证凭证' }, 422);
  }
  if (token.length > 2048) {
    return json({ code: 42200, message: '验证凭证格式非法' }, 422);
  }

  // 构造 siteverify 请求（application/x-www-form-urlencoded）
  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  // remoteip：取真实客户端 IP（可选，但推荐，防止中间人重放）
  const remoteip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (remoteip) params.set('remoteip', remoteip);
  if (body.action) params.set('action', body.action);

  let upstream: Response;
  try {
    upstream = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (err) {
    console.error('siteverify 网络错误', err);
    return json({ code: 50000, message: '人机验证服务暂不可用，请稍后重试' }, 500);
  }

  const data = (await upstream.json().catch(() => null)) as SiteverifyResponse | null;
  if (!data || typeof data.success !== 'boolean') {
    console.error('siteverify 响应异常', upstream.status);
    return json({ code: 50000, message: '人机验证服务异常，请稍后重试' }, 500);
  }

  if (!data.success) {
    const codes = data['error-codes'] ?? [];
    const msg = codes.includes('timeout-or-duplicate')
      ? '验证已过期，请重新完成人机验证'
      : codes.includes('invalid-input-response')
        ? '验证未通过，请重试'
        : '人机验证未通过，请重试';
    return json({ code: 40300, message: msg, data: { errorCodes: codes } }, 403);
  }

  // hostname 白名单（可选）：只放行期望域名下签发的 token
  const allowed = (Deno.env.get('TURNSTILE_ALLOWED_HOSTNAMES') ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0 && data.hostname && !allowed.includes(data.hostname.toLowerCase())) {
    console.warn('turnstile hostname 不在白名单', data.hostname);
    return json({ code: 40300, message: '验证来源不合法' }, 403);
  }

  // action 校验（可选）：若前端声明了 action，校验一致性
  if (body.action && data.action && data.action !== body.action) {
    return json({ code: 40300, message: '验证场景不匹配' }, 403);
  }

  return json({
    code: 0,
    data: {
      hostname: data.hostname ?? null,
      challenge_ts: data.challenge_ts ?? null,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('turnstile-verify error', err);
    return json({ code: 50000, message: '人机验证服务异常，请稍后重试' }, 500);
  }
});
