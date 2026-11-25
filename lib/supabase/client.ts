'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  const env = getPublicSupabaseEnv();
  if (!env.isConfigured) {
    return null;
  }
  return createBrowserClient(env.url, env.publishableKey);
}
