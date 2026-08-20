/**
 * authStore · 会话/用户/资料（06-系统设计 §4.5）
 * JWT 由 supabase-js 管理；profile 本地缓存
 */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { ProfileRow } from '@/types/database';
import type { User } from '@supabase/supabase-js';

/** 全局仅注册一次 onAuthStateChange 的订阅句柄（避免重复注册竞态） */
let authSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
  initialized: boolean;
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
  isDemo: boolean;

  init: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** 复核真实会话：用于 SIGNED_OUT 竞态/瞬时空值时，确认真的是否已登出 */
  revalidateSession: () => Promise<boolean>;
  signIn: (identifier: string, password: string, turnstileToken?: string) => Promise<void>;
  signUp: (email: string, password: string, nickname?: string, turnstileToken?: string) => Promise<void>;
  resetPassword: (email: string, turnstileToken?: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<ProfileRow, 'nickname' | 'avatar_url'>>) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
  enterDemo: () => Promise<void>;
  exitDemo: () => void;
  }

/** 体验模式（Guest）本地合成会话 —— 绕过注册/登录，仅用于演示 */
function buildDemoUser(): User {
  return {
    id: 'demo-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: '体验用户',
    app_metadata: {},
    user_metadata: { nickname: '体验用户' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
}

const DEMO_PROFILE: ProfileRow = {
  id: 'demo-user',
  phone: null,
  nickname: '体验用户',
  avatar_url: null,
  tier: 'free',
  plan_id: null,
  member_expires_at: null,
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  user: null,
  profile: null,
  loading: false,
  isDemo: false,

  async init() {
    // 若处于体验模式则直接使用本地会话，不再请求后端
    if (get().isDemo) return;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    set({ user, initialized: true });
    if (user) await get().refreshProfile();

    // 仅注册一次全局监听：避免每次 useAuth 挂载都重复注册，
    // 否则多个监听器在令牌刷新竞态下可能并发把 user 置空，导致「浏览中闪回登录页」。
    if (!authSubscription) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // 真正登出：先复核真实会话，避免刷新令牌竞态、第三方回调抖动等
        // 误触发 SIGNED_OUT 把仍在登录态的用户踢出。
        if (_event === 'SIGNED_OUT') {
          const { data: recheck } = await supabase.auth.getSession();
          if (recheck.session) {
            set({ user: recheck.session.user });
            return;
          }
          set({ user: null, profile: null });
          return;
        }
        const nextUser = session?.user ?? null;
        set({ user: nextUser });
        if (nextUser) void get().refreshProfile();
        else set({ profile: null });
      });
      authSubscription = sub.subscription;
    }
  },

  async refreshProfile() {
    const profile = await api.getProfile();
    set({ profile });
  },

  /**
   * 复核真实会话。返回 true 表示仍有有效会话（顺手恢复 user）。
   * 用于：令牌刷新竞态 / SIGNED_OUT 抖动导致 user 瞬时空值时，
   * 避免把仍在登录态的用户「误踢」回登录页（与体验版一致的粘性）。
   */
  async revalidateSession(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      set({ user: data.session.user, initialized: true });
      return true;
    }
    return false;
  },

  async signIn(identifier, password, turnstileToken) {
    set({ loading: true });
    try {
      await api.auth.signIn(identifier, password, turnstileToken);
      const profile = await api.getProfile();
      set({ profile });
    } finally {
      set({ loading: false });
    }
  },

  async signUp(email, password, nickname, turnstileToken) {
    set({ loading: true });
    try {
      await api.auth.signUp(email, password, nickname, turnstileToken);
      // 注册后自动登录（若邮箱无需验证）；若需验证则提示
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const profile = await api.getProfile();
        set({ profile });
      }
    } finally {
      set({ loading: false });
    }
  },

  async resetPassword(email, turnstileToken) {
    await api.auth.resetPassword(email, turnstileToken);
  },

  async updateProfile(updates) {
    await api.updateProfile(updates);
    await get().refreshProfile();
  },

  async signOut() {
    // 体验模式退出不调用后端
    if (get().isDemo) {
      set({ isDemo: false });
      return;
    }
    await api.auth.signOut();
    set({ user: null, profile: null });
  },

  clearSession() {
    set({ user: null, profile: null, isDemo: false });
  },

  async enterDemo() {
    set({
      isDemo: true,
      initialized: true,
      user: buildDemoUser(),
      profile: { ...DEMO_PROFILE },
    });
  },

  exitDemo() {
    set({ isDemo: false, user: null, profile: null });
  },

  }));
