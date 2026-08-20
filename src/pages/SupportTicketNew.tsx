/**
 * SupportTicketNew · 新建工单
 * Premium Glassmorphism + Minimalism 风格
 */
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketForm } from '@/components/support/TicketForm';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';

export default function SupportTicketNew() {
  const navigate = useNavigate();

  const submit = async (subject: string, description: string) => {
    try {
      await api.createTicket(subject, description);
      useUiStore.getState().showToast('success', '工单已提交，48 小时内处理');
      navigate('/support/tickets');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '提交失败');
    }
  };

  return (
    <div className="page">
      <PageHeader title="提交工单" />
      <div className="glass animate-[slideUp_0.35s_ease-out] p-5">
        <TicketForm onSubmit={submit} />
      </div>
    </div>
  );
}