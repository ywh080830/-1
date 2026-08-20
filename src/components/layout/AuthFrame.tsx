/**
 * AuthFrame · 认证页设备外框（与 AppShell 同款 app 端手机框）
 * 登录 / 注册 / 找回密码 等独立页统一套用，保证桌面端也是「手机 App」观感。
 */
import type { ReactNode } from 'react';

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-backdrop">
      <div className="app-frame">
        <div className="app-screen">{children}</div>
      </div>
    </div>
  );
}
