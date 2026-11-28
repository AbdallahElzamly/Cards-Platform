import 'server-only';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { consumeRateLimit } from '@/lib/rate-limit';

const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|preview|curl|wget|headless|lighthouse/i;

function detectDeviceType(userAgent: string): string {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  if (/windows nt|macintosh|linux x86_64/i.test(userAgent)) return 'desktop';
  return 'mobile';
}

export async function recordCardScan(cardId: string): Promise<void> {
  if (!cardId) return;

  try {
    const hdrs = await headers();
    const userAgent = hdrs.get('user-agent') || '';

    if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
      return;
    }

    const perCardLimit = await consumeRateLimit({
      scope: 'scan_card',
      targetId: cardId,
      maxRequests: 1,
      windowSeconds: 60,
    });

    if (!perCardLimit.allowed) {
      return;
    }

    const globalIpLimit = await consumeRateLimit({
      scope: 'scan_ip',
      targetId: 'global',
      maxRequests: 30,
      windowSeconds: 600,
    });

    if (!globalIpLimit.allowed) {
      return;
    }

    const rawCity = hdrs.get('cf-ipcity') || hdrs.get('x-vercel-ip-city') || null;
    const rawCountry = hdrs.get('cf-ipcountry') || hdrs.get('x-vercel-ip-country') || null;

    let city: string | null = rawCity;
    if (rawCity) {
      try {
        city = decodeURIComponent(rawCity);
      } catch {
        city = rawCity;
      }
    }

    const admin = getSupabaseAdmin();
    await admin.from('scans').insert({
      card_id: cardId,
      device_type: detectDeviceType(userAgent),
      city,
      country: rawCountry,
    });
  } catch (err) {
    console.error('recordCardScan error:', err);
  }
}
