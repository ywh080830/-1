// ============================================================
// support-faq · FAQ 智能客服 Edge Function
// 关键词 + 意图路由（会员/导出/同步/OCR/商户/隐私/分类/其他）
// ============================================================
import { corsHeaders, handleCors, json, withAuth } from '../_shared/cors.ts';
import faqData from '../_shared/faq.json' with { type: 'json' };

interface FaqIntent {
  id: string;
  keywords: string[];
  answer: string;
  suggest_human: boolean;
}

const FAQ: FaqIntent[] = (faqData as { intents: FaqIntent[] }).intents;

function routeIntent(q: string): { intent: FaqIntent; score: number } {
  let best: FaqIntent = FAQ[FAQ.length - 1]; // 默认 other
  let bestScore = 0;
  for (const intent of FAQ) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  return { intent: best, score: bestScore };
}

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const authed = await withAuth(req);
  if (authed instanceof Response) return authed;

  const body = (await req.json().catch(() => null)) as { q?: string } | null;
  const q = (body?.q ?? '').trim();
  if (!q) {
    return json({ code: 42200, message: '缺少问题 q' }, 422);
  }

  const { intent, score } = routeIntent(q);
  const related = FAQ
    .filter((i) => i.id !== intent.id)
    .slice(0, 3)
    .map((i) => ({ intent: i.id, keywords: i.keywords.slice(0, 3) }));

  return json({
    code: 0,
    data: {
      intent: intent.id,
      answer: intent.answer,
      suggest_human: intent.suggest_human || score === 0,
      matched: score > 0,
      related,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('support-faq error', err);
    return json({ code: 50000, message: '客服服务异常，请稍后重试' }, 500);
  }
});
