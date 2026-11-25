import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServerSupabaseEnv } from '@/lib/env';

export async function createSupabaseServerClient() {
  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    throw new Error(`MISSING_SUPABASE_AUTH_ENV:${env.missingVars.join(',')}`);
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called inside a Server Component; session refresh is handled by proxy.ts / Server Actions
        }
      },
    },
  });
}
