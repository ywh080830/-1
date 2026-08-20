/**
 * SettingsNotifications · 提醒设置（浏览器通知 + 预算/借贷/周期开关）
 */
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/common/Switch';
import { useUiStore } from '@/stores/uiStore';

const STORAGE_KEY = 'sb-notification-settings';

interface NotifSettings {
  budget: boolean;
  loan: boolean;
  period: boolean;
  browser: boolean;
}

function loadSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { budget: true, loan: true, period: true, browser: true, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { budget: true, loan: true, period: true, browser: true };
}

export default function SettingsNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(loadSettings);

  const update = (patch: Partial<NotifSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const enableBrowser = async () => {
    if (!('Notification' in window)) {
      useUiStore.getState().showToast('warning', '当前浏览器不支持通知');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      update({ browser: true });
      useUiStore.getState().showToast('success', '通知已开启');
    } else {
      update({ browser: false });
      useUiStore.getState().showToast('warning', '通知权限被拒绝');
    }
  };

  return (
    <div className="page">
      <PageHeader title="提醒设置" />

      <section className="glass overflow-hidden card-gradient">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-4 transition-colors hover:bg-primary/5">
          <Bell size={20} className="text-primary" aria-hidden />
          <div className="flex-1">
            <div className="text-body font-medium">浏览器通知</div>
            <div className="mt-0.5 text-caption text-muted">预算超支 / 借贷到期 / 周期记账提醒</div>
          </div>
          <Switch checked={settings.browser} onChange={(v) => (v ? enableBrowser() : update({ browser: false }))} label="浏览器通知" />
        </div>
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-4 transition-colors hover:bg-primary/5">
          <div className="flex-1">
            <div className="text-body">预算超支提醒</div>
            <div className="mt-0.5 text-caption text-muted">使用超过 80% 与 100% 时提醒</div>
          </div>
          <Switch checked={settings.budget} onChange={(v) => update({ budget: v })} label="预算超支提醒" />
        </div>
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-4 transition-colors hover:bg-primary/5">
          <div className="flex-1">
            <div className="text-body">借贷到期提醒</div>
            <div className="mt-0.5 text-caption text-muted">应收/应付到期时提醒</div>
          </div>
          <Switch checked={settings.loan} onChange={(v) => update({ loan: v })} label="借贷到期提醒" />
        </div>
        <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-primary/5">
          <div className="flex-1">
            <div className="text-body">周期记账提醒</div>
            <div className="mt-0.5 text-caption text-muted">模板周期到达时提醒</div>
          </div>
          <Switch checked={settings.period} onChange={(v) => update({ period: v })} label="周期记账提醒" />
        </div>
      </section>

      <p className="mt-3 px-1 text-caption text-muted">注：Web Push 深度推送将于后续版本上线（S2），当前使用浏览器通知 API。</p>
    </div>
  );
}