import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServerSupabaseEnv } from '@/lib/env';

/**
 * Next.js 16 Proxy convention (replaces deprecated middleware.ts).
 * Refreshes Supabase SSR auth cookies across dashboards, admin, company portals,
 * activation, and auth routes without adding latency to public NFC scans (/q/*, /c/*, /l/*).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/activate/:path*',
    '/org/:path*',
    '/auth/:path*',
  ],
};
