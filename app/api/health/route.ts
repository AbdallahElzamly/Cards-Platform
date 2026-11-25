import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Task P27 — Lightweight Keep-Alive & Readiness Health Endpoint (/api/health)
 * Prevents Supabase Free 7-day auto-pause without exposing internal secrets.
 */
export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };

  try {
    const env = getServerSupabaseEnv();
    if (!env.isAdminConfigured || !env.isAuthConfigured) {
      return NextResponse.json(
        {
          status: 'misconfigured',
          timestamp: new Date().toISOString(),
        },
        { status: 503, headers }
      );
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('loyalty_programs')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: error.code === '42501' ? 'db_grants_needed' : 'degraded',
          timestamp: new Date().toISOString(),
        },
        { status: 503, headers }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
