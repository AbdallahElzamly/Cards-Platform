import { redirect } from 'next/navigation';
import { getServerSupabaseEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import MerchantLoginForm from '@/components/auth/MerchantLoginForm';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string; mode?: string }>;
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
      // Allow login screen to render cleanly
    }
  }

  if (authenticatedUser) {
    redirect(safeRedirect);
  }

  const initialMode = params.mode === 'signup' ? 'signup' : 'signin';

  return (
    <MerchantLoginForm
      redirectTo={safeRedirect}
      isServerConfigured={env.isAuthConfigured}
      missingVars={env.missingVars}
      callbackError={params.error === 'callback'}
      initialMode={initialMode}
    />
  );
}
