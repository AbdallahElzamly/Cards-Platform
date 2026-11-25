/**
 * Unified environment configuration helper.
 * IMPORTANT: Next.js only inlines NEXT_PUBLIC_* variables on the client when accessed via
 * literal dot-notation (e.g., process.env.NEXT_PUBLIC_SUPABASE_URL).
 */

export interface PublicSupabaseEnv {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
  missingVars: string[];
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const rawKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const urlValid =
    Boolean(rawUrl) &&
    rawUrl.startsWith('https://') &&
    !rawUrl.includes('placeholder') &&
    !rawUrl.includes('your-project');

  const keyValid =
    Boolean(rawKey) &&
    !rawKey.includes('placeholder') &&
    !rawKey.includes('your-supabase');

  const missingVars: string[] = [];
  if (!urlValid) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!keyValid) missingVars.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  return {
    url: rawUrl,
    publishableKey: rawKey,
    isConfigured: urlValid && keyValid,
    missingVars,
  };
}

export function getServerSupabaseEnv() {
  const pub = getPublicSupabaseEnv();
  const serverUrl = (process.env.SUPABASE_URL || pub.url).trim();
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim();

  const urlValid =
    Boolean(serverUrl) &&
    serverUrl.startsWith('https://') &&
    !serverUrl.includes('placeholder') &&
    !serverUrl.includes('your-project');

  const serviceValid =
    Boolean(serviceKey) &&
    !serviceKey.includes('placeholder') &&
    !serviceKey.includes('your-supabase');

  const missingVars: string[] = [];
  if (!urlValid) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!pub.publishableKey || pub.missingVars.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  if (!serviceValid) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

  return {
    url: serverUrl,
    publishableKey: pub.publishableKey,
    serviceKey,
    isAuthConfigured: urlValid && Boolean(pub.publishableKey) && !pub.missingVars.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    isAdminConfigured: urlValid && serviceValid,
    missingVars,
  };
}
