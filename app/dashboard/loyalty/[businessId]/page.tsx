import MerchantDashboardView from '@/components/loyalty/MerchantDashboardView';

export const dynamic = 'force-dynamic';

interface BusinessDashboardProps {
  params: Promise<{ businessId: string }>;
}

export default async function MerchantBusinessLoyaltyPage({
  params,
}: BusinessDashboardProps) {
  const { businessId } = await params;
  return <MerchantDashboardView businessId={businessId} />;
}
