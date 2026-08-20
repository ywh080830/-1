/**
 * RatingStars · 满意度评价（Glassmorphism 星级评价）
 */
import { Star } from 'lucide-react';
import { useState } from 'react';

interface RatingStarsProps {
  onSubmit: (score: number, comment?: string) => Promise<void>;
}

export function RatingStars({ onSubmit }: RatingStarsProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(score, comment.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-sm flex flex-col items-center gap-4 rounded-2xl p-6 shadow-lg">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            aria-label={`${n} 星`}
            className="touch-target rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={`transition-all duration-200 ${
                n <= score
                  ? 'fill-cta text-cta drop-shadow-lg'
                  : 'text-white/20 hover:text-white/30'
              }`}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="评价（可选）"
        className="glass-sm min-h-[44px] w-full rounded-xl border border-white/10 px-4 text-body text-text outline-none placeholder:text-muted/50 transition-all duration-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10"
        aria-label="评价内容"
      />
      <button
        type="button"
        onClick={submit}
        disabled={score === 0 || submitting}
        className="min-h-[48px] w-full rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-body font-medium text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40 active:scale-98 disabled:is-disabled"
      >
        提交评价
      </button>
    </div>
  );
}