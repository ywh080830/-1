/**
 * NotFound · 404
 */
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted">
        <FileQuestion size={32} aria-hidden />
      </span>
      <div>
        <h1 className="font-display text-h1">404</h1>
        <p className="mt-1 text-caption text-muted">页面不存在或已被移除</p>
      </div>
      <Link to="/">
        <Button>返回首页</Button>
      </Link>
    </div>
  );
}
