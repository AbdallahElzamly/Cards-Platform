import { redirect } from 'next/navigation';
import { getServerSupabaseEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import MerchantLoginForm from '@/components/auth/MerchantLoginForm';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string; mode?: string; kind?: string }>;
}

export default async function MerchantLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawRedirect = params.redirect || '/dashboard';
  const safeRedirect = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';
  const env = getServerSupabaseEnv();

  let authenticatedUser = null;
  if (env.isAuthConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {
      // Allow login screen to render cleanly if session lookup fails
    }
  }

  // IMPORTANT: Keep redirect() outside try/catch so NEXT_REDIRECT is never swallowed
  if (authenticatedUser) {
    redirect(safeRedirect);
  }

  const initialMode = params.mode === 'signup' ? 'signup' : 'signin';
  const initialKind =
    params.kind === 'company' || params.kind === 'merchant' ? params.kind : 'individual';

  return (
    <MerchantLoginForm
      redirectTo={safeRedirect}
      isServerConfigured={env.isAuthConfigured}
      missingVars={env.missingVars}
      callbackError={params.error === 'callback'}
      initialMode={initialMode}
      initialKind={initialKind}
    />
  );
}
