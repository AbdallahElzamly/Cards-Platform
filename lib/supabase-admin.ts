import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseEnv } from '@/lib/env';

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const env = getServerSupabaseEnv();
  if (!env.isAdminConfigured) {
    throw new Error(
      `MISSING_SUPABASE_ADMIN_ENV:${env.missingVars.join(',')}`
    );
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(env.url, env.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}

// Backward-compatible proxy so existing imports (`supabaseAdmin.from(...)`) evaluate lazily at runtime
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
