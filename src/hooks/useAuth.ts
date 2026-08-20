/**
 * useAuth · 认证状态 + 初始化
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { initialized, user, profile, loading, revalidateSession } = useAuthStore();

  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return {
    initialized,
    user,
    profile,
    loading,
    revalidateSession,
    isAuthed: Boolean(user),
    isMember: profile?.tier === 'member',
  };
}
