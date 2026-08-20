import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthFrame } from '@/components/layout/AuthFrame';
import { AppSkeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

/* ---------- 独立页（无需登录） ---------- */
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));

/* ---------- 受保护页（33 路由） ---------- */
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Stats = lazy(() => import('@/pages/Stats'));
const Record = lazy(() => import('@/pages/Record'));
const CalendarPage = lazy(() => import('@/pages/Calendar'));
const Me = lazy(() => import('@/pages/Me'));
const Ledgers = lazy(() => import('@/pages/Ledgers'));
const LedgerMembers = lazy(() => import('@/pages/LedgerMembers'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const AccountForm = lazy(() => import('@/pages/AccountForm'));
const Categories = lazy(() => import('@/pages/Categories'));
const Budgets = lazy(() => import('@/pages/Budgets'));
const Assets = lazy(() => import('@/pages/Assets'));
const Loans = lazy(() => import('@/pages/Loans'));
const Templates = lazy(() => import('@/pages/Templates'));
const Goals = lazy(() => import('@/pages/Goals'));
const Ocr = lazy(() => import('@/pages/Ocr'));
const OcrConfirm = lazy(() => import('@/pages/OcrConfirm'));
const Merchants = lazy(() => import('@/pages/Merchants'));
const Membership = lazy(() => import('@/pages/Membership'));
const Support = lazy(() => import('@/pages/Support'));
const SupportSession = lazy(() => import('@/pages/SupportSession'));
const SupportTickets = lazy(() => import('@/pages/SupportTickets'));
const SupportTicketNew = lazy(() => import('@/pages/SupportTicketNew'));
const Settings = lazy(() => import('@/pages/Settings'));
const SettingsSecurity = lazy(() => import('@/pages/SettingsSecurity'));
const SettingsData = lazy(() => import('@/pages/SettingsData'));
const SettingsImport = lazy(() => import('@/pages/SettingsImport'));
const SettingsNotifications = lazy(() => import('@/pages/SettingsNotifications'));
const Search = lazy(() => import('@/pages/Search'));
const RecycleBin = lazy(() => import('@/pages/RecycleBin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/** 受保护路由：session 恢复前骨架屏，未登录跳 /login
 *  关键修复：已登录用户具备「会话粘性」——当 user 因令牌刷新竞态 /
 *  SIGNED_OUT 抖动而瞬时空值时，先复核一次真实会话，确认真失效才跳登录，
 *  避免浏览中（尤其点「统计」触发后端请求后）被误踢回登录页。
 *  这与体验版（本地会话永不过期）行为一致，消除「体验版/登录版不一样」。
 */
function Protected() {
  const { initialized, user, revalidateSession } = useAuth();
  const isDemo = useAuthStore((s) => s.isDemo);
  const everAuthed = useRef(false);
  const [confirmedLogout, setConfirmedLogout] = useState(false);

  useEffect(() => {
    if (user) everAuthed.current = true;
  }, [user]);

  useEffect(() => {
    // 曾登录过、现在 user 为空、非体验模式 → 可能是令牌刷新竞态导致的瞬时空值，
    // 复核一次真实会话；确认真的没了才跳登录（避免误踢）。
    if (everAuthed.current && !user && !isDemo && initialized) {
      let cancelled = false;
      void revalidateSession().then((ok) => {
        if (!cancelled && !ok) setConfirmedLogout(true);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [user, isDemo, initialized, revalidateSession]);

  const skeleton = (
    <div className="app-backdrop">
      <div className="app-frame">
        <div className="app-screen">
          <AppSkeleton />
        </div>
      </div>
    </div>
  );

  if (!initialized) return skeleton;
  // 体验模式（本地合成会话）或已有用户 → 进入 App
  if (user || isDemo) return <AppShell />;
  // 从未登录过 → 直接跳登录
  if (!everAuthed.current) return <Navigate to="/login" replace />;
  // 登录过但 user 暂空 → 复核中（骨架），确认真登出才跳
  if (confirmedLogout) return <Navigate to="/login" replace />;
  return skeleton;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppSkeleton />}>
        <Routes>
          <Route path="/login" element={<AuthFrame><Login /></AuthFrame>} />
          <Route path="/register" element={<AuthFrame><Register /></AuthFrame>} />
          <Route path="/forgot-password" element={<AuthFrame><ForgotPassword /></AuthFrame>} />

          <Route element={<Protected />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/record" element={<Record />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/me" element={<Me />} />
            <Route path="/ledgers" element={<Ledgers />} />
            <Route path="/ledgers/:id/members" element={<LedgerMembers />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/new" element={<AccountForm />} />
            <Route path="/accounts/:id" element={<AccountForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/ocr" element={<Ocr />} />
            <Route path="/ocr/confirm" element={<OcrConfirm />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/support" element={<Support />} />
            <Route path="/support/session/:id" element={<SupportSession />} />
            <Route path="/support/tickets" element={<SupportTickets />} />
            <Route path="/support/tickets/new" element={<SupportTicketNew />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/security" element={<SettingsSecurity />} />
            <Route path="/settings/data" element={<SettingsData />} />
            <Route path="/settings/import" element={<SettingsImport />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recycle-bin" element={<RecycleBin />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
