import { redirect } from 'next/navigation';
import { getMerchantLoyaltyDashboard } from '@/app/actions/loyalty-merchant';
import MerchantLoyaltyDashboard from '@/components/loyalty/MerchantLoyaltyDashboard';

export const dynamic = 'force-dynamic';

export default async function MerchantLoyaltyPage() {
  const result = await getMerchantLoyaltyDashboard();

  if (!result.success || !result.data || !result.data.program) {
    // If not authenticated or error, redirect or show login notice
    // For MVP, redirect to login or root if not authenticated
    redirect('/auth/login?redirect=/dashboard/loyalty');
  }

  return <MerchantLoyaltyDashboard initialData={result.data} />;
}
