import 'server-only';
import { headers } from 'next/headers';
import { hashIpAddress } from '@/lib/loyalty-crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

interface RateLimitOptions {
  scope: string;
  targetId: string;
  maxRequests: number;
  windowSeconds: number;
}

const memoryBuckets = new Map<string, number[]>();
let warnedMissingRateLimitTable = false;

export async function getClientIpHash(): Promise<string> {
  const hdrs = await headers();
  const rawIp =
    hdrs.get('cf-connecting-ip') ||
    hdrs.get('x-forwarded-for') ||
    hdrs.get('x-real-ip') ||
    'unknown';
  return hashIpAddress(rawIp);
}

function consumeMemoryRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const recent = (memoryBuckets.get(key) || []).filter((ts) => ts >= cutoff);

  if (recent.length >= maxRequests) {
    memoryBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  memoryBuckets.set(key, recent);
  return true;
}

export async function consumeRateLimit({
  scope,
  targetId,
  maxRequests,
  windowSeconds,
}: RateLimitOptions): Promise<{ allowed: boolean }> {
  const ipHash = await getClientIpHash();
  const actorKey = `${ipHash}:${targetId}`;
  const windowStartIso = new Date(Date.now() - windowSeconds * 1000).toISOString();

  try {
    const admin = getSupabaseAdmin();
    const { count, error: countErr } = await admin
      .from('rate_limit_events')
      .select('*', { count: 'exact', head: true })
      .eq('scope', scope)
      .eq('actor_key', actorKey)
      .gte('created_at', windowStartIso);

    if (countErr) {
      const code = (countErr as { code?: string }).code || '';
      const msg = countErr.message || '';
      if (code === '42P01' || code === 'PGRST205' || msg.includes('rate_limit_events')) {
        if (!warnedMissingRateLimitTable) {
          warnedMissingRateLimitTable = true;
          console.warn(
            'rate_limit_events table missing; falling back to in-memory rate limit until migration 20261128_security_rls_and_rate_limits.sql is applied.'
          );
        }
        return { allowed: consumeMemoryRateLimit(`${scope}:${actorKey}`, maxRequests, windowSeconds) };
      }
      console.error('Rate limit count error:', countErr);
      return { allowed: consumeMemoryRateLimit(`${scope}:${actorKey}`, maxRequests, windowSeconds) };
    }

    if ((count || 0) >= maxRequests) {
      return { allowed: false };
    }

    const { error: insertErr } = await admin.from('rate_limit_events').insert({
      scope,
      actor_key: actorKey,
    });

    if (insertErr) {
      console.error('Rate limit insert error:', insertErr);
      return { allowed: consumeMemoryRateLimit(`${scope}:${actorKey}`, maxRequests, windowSeconds) };
    }

    // Opportunistically prune old events (> 24h) on ~2% of requests
    if (Math.random() < 0.02) {
      const oneDayAgoIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      void admin
        .from('rate_limit_events')
        .delete()
        .lt('created_at', oneDayAgoIso)
        .then(({ error }) => {
          if (error) console.warn('Rate limit cleanup skipped:', error.message);
        });
    }

    return { allowed: true };
  } catch (err) {
    console.error('consumeRateLimit unexpected error:', err);
    return { allowed: consumeMemoryRateLimit(`${scope}:${actorKey}`, maxRequests, windowSeconds) };
  }
}
