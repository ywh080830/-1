import { createClient } from '@supabase/supabase-js';

/**
 * 全局唯一的后端客户端实例。
 * 页面 / Store 禁止直接散写后端调用，统一走 src/lib/api.ts。
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // 开发期友好提示，生产构建由 .env 保证
  console.warn('[smart_bookkeeping] 缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，请检查 .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
