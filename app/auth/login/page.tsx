import { redirect } from 'next/navigation';
import { getServerSupabaseEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import MerchantLoginForm from '@/components/auth/MerchantLoginForm';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function MerchantLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawRedirect = params.redirect || '/dashboard/loyalty';
  const safeRedirect = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard/loyalty';
  const env = getServerSupabaseEnv();

  if (env.isAuthConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        redirect(safeRedirect);
      }
    } catch {
      // Allow login screen to render cleanly
    }
  }

  return (
    <MerchantLoginForm
      redirectTo={safeRedirect}
      isServerConfigured={env.isAuthConfigured}
      missingVars={env.missingVars}
      callbackError={params.error === 'callback'}
    />
  );
}
