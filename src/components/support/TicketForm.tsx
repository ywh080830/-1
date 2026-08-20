/**
 * TicketForm · 工单表单（Glassmorphism 表单）
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface TicketFormProps {
  onSubmit: (subject: string, description: string) => Promise<void>;
}

export function TicketForm({ onSubmit }: TicketFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(subject.trim(), description.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Input label="标题" name="subject" placeholder="简要描述问题" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="mb-1.5 block text-caption font-medium text-text-secondary" htmlFor="desc">
          详细描述
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="请描述遇到的问题、发生时间与操作步骤"
          className="glass-sm w-full rounded-2xl border border-white/10 p-4 text-body text-text outline-none placeholder:text-muted/50 transition-all duration-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10"
        />
      </div>
      <Button block loading={submitting} onClick={submit} disabled={!subject.trim() || !description.trim()}>
        提交工单
      </Button>
      <p className="text-center text-caption text-muted/50">工单将在 48 小时内处理</p>
    </div>
  );
}