import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * Task P22 — Dynamic QR / NFC Gateway (/q/[code]?t=[table])
 * Always uses HTTP 307 Temporary Redirect with strict zero-caching headers.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const cleanCode = (code || '').trim();
  const tableCode = request.nextUrl.searchParams.get('t');
  const origin = request.nextUrl.origin;

  if (!cleanCode) {
    return NextResponse.redirect(`${origin}/`, {
      status: 307,
      headers: NO_CACHE_HEADERS,
    });
  }

  try {
    const admin = getSupabaseAdmin();

    // 1. Check isolated loyalty_programs by slug
    const { data: loyaltyProg } = await admin
      .from('loyalty_programs')
      .select('slug, is_active')
      .eq('slug', cleanCode.toLowerCase())
      .maybeSingle();

    if (loyaltyProg && loyaltyProg.is_active) {
      const target = new URL(`/l/${loyaltyProg.slug}`, origin);
      if (tableCode) target.searchParams.set('t', tableCode.slice(0, 16));
      return NextResponse.redirect(target.toString(), {
        status: 307,
        headers: NO_CACHE_HEADERS,
      });
    }

    // 2. Non-destructive compatibility: check qr_links table if present on platform
    const { data: qrLink } = await admin
      .from('qr_links')
      .select('default_url, is_active')
      .eq('slug', cleanCode)
      .maybeSingle();

    if (qrLink && qrLink.is_active && qrLink.default_url) {
      return NextResponse.redirect(qrLink.default_url, {
        status: 307,
        headers: NO_CACHE_HEADERS,
      });
    }
  } catch (err) {
    console.error('/q/[code] gateway lookup error:', err);
  }

  // Fallback directly to /l/[code] (which renders S10 NotFound cleanly if invalid)
  const fallbackTarget = new URL(`/l/${encodeURIComponent(cleanCode)}`, origin);
  if (tableCode) fallbackTarget.searchParams.set('t', tableCode.slice(0, 16));

  return NextResponse.redirect(fallbackTarget.toString(), {
    status: 307,
    headers: NO_CACHE_HEADERS,
  });
}
