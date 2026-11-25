import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServerSupabaseEnv } from '@/lib/env';

/**
 * Next.js 16 Proxy convention (replaces deprecated middleware.ts).
 * Refreshes Supabase SSR auth cookies on merchant dashboard & auth routes
 * without adding any latency to customer-facing NFC/QR routes (/l/*, /q/*).
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
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
