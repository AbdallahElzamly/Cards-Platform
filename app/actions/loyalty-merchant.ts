'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRandomPin, hashDailyPin } from '@/lib/loyalty-crypto';
import { LoyaltyProgram } from '@/types/loyalty';

/**
 * Helper to get authenticated merchant user using @supabase/ssr
 */
async function getAuthenticatedMerchant() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export interface MerchantDashboardData {
  program: LoyaltyProgram | null;
  metrics: {
    totalMembers: number;
    visitsLast30Days: number;
    activeVouchers: number;
    redeemedVouchers: number;
  };
  recentVisits: Array<{
    id: string;
    member_name: string;
    phone_last4: string;
    stamps_awarded: number;
    stamp_number_after: number;
    table_code: string | null;
    created_at: string;
  }>;
}

/**
 * Get or initialize merchant loyalty program and dashboard metrics.
 */
export async function getMerchantLoyaltyDashboard(): Promise<{
  success: boolean;
  error?: string;
  data?: MerchantDashboardData;
}> {
  try {
    const user = await getAuthenticatedMerchant();
    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول كتاجر للوصول إلى لوحة التحكم' };
    }

    // 1. Fetch program owned by user
    let { data: program } = await supabaseAdmin
      .from('loyalty_programs')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    // If no program exists yet, create a default one for this merchant
    if (!program) {
      const defaultPin = '1234';
      const slug = `cafe-${user.id.slice(0, 6)}`;

      const { data: newProg, error: createError } = await supabaseAdmin
        .from('loyalty_programs')
        .insert({
          owner_id: user.id,
          slug,
          business_name: 'متجري الجديد',
          primary_color: '#1E3A8A',
          stamps_required: 6,
          min_bill_egp: 100,
          reward_title: 'وجبتك السادسة مجاناً',
          reward_terms: 'بحد أقصى متوسط طلباتك أو من قائمة المكافآت المختارة',
          cooldown_hours: 18,
          daily_pin_hash: '', // temporary
          daily_pin_display: defaultPin,
          is_active: true,
        })
        .select()
        .single();

      if (createError || !newProg) {
        return { success: false, error: 'فشل إنشاء برنامج الولاء التلقائي' };
      }

      // Proper hash with correct program ID
      const realHash = hashDailyPin(defaultPin, newProg.id);
      await supabaseAdmin
        .from('loyalty_programs')
        .update({ daily_pin_hash: realHash })
        .eq('id', newProg.id);

      newProg.daily_pin_hash = realHash;
      program = newProg;
    }

    // 2. Fetch Metrics
    // Total members
    const { count: totalMembers } = await supabaseAdmin
      .from('loyalty_members')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id);

    // Visits last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: visitsLast30Days } = await supabaseAdmin
      .from('loyalty_visits')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .gte('created_at', thirtyDaysAgo);

    // Active vouchers
    const { count: activeVouchers } = await supabaseAdmin
      .from('loyalty_vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('status', 'active');

    // Redeemed vouchers
    const { count: redeemedVouchers } = await supabaseAdmin
      .from('loyalty_vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('status', 'redeemed');

    // 3. Recent visits feed (last 20)
    const { data: rawVisits } = await supabaseAdmin
      .from('loyalty_visits')
      .select(`
        id,
        stamps_awarded,
        stamp_number_after,
        table_code,
        created_at,
        loyalty_members (
          first_name,
          phone_last4
        )
      `)
      .eq('program_id', program.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const recentVisits = (rawVisits || []).map((v: any) => ({
      id: v.id,
      member_name: v.loyalty_members?.first_name || 'عميل',
      phone_last4: v.loyalty_members?.phone_last4 || '0000',
      stamps_awarded: v.stamps_awarded,
      stamp_number_after: v.stamp_number_after,
      table_code: v.table_code,
      created_at: v.created_at,
    }));

    return {
      success: true,
      data: {
        program,
        metrics: {
          totalMembers: totalMembers || 0,
          visitsLast30Days: visitsLast30Days || 0,
          activeVouchers: activeVouchers || 0,
          redeemedVouchers: redeemedVouchers || 0,
        },
        recentVisits,
      },
    };
  } catch (err) {
    console.error('getMerchantLoyaltyDashboard error:', err);
    return { success: false, error: 'حدث خطأ أثناء تحميل لوحة التحكم' };
  }
}

/**
 * Update loyalty program settings.
 */
export async function updateLoyaltyProgramSettings(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedMerchant();
    if (!user) {
      return { success: false, error: 'غير مسموح' };
    }

    const businessName = formData.get('business_name')?.toString() || '';
    const rewardTitle = formData.get('reward_title')?.toString() || '';
    const rewardTerms = formData.get('reward_terms')?.toString() || '';
    const stampsRequired = parseInt(formData.get('stamps_required')?.toString() || '6', 10);
    const minBillEgp = parseInt(formData.get('min_bill_egp')?.toString() || '100', 10);
    const cooldownHours = parseInt(formData.get('cooldown_hours')?.toString() || '18', 10);
    const isActive = formData.get('is_active') === 'true';

    if (!businessName || !rewardTitle) {
      return { success: false, error: 'اسم المتجر وعنوان المكافأة مطلوبان' };
    }

    const { data: program } = await supabaseAdmin
      .from('loyalty_programs')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single();

    if (!program) {
      return { success: false, error: 'البرنامج غير موجود' };
    }

    const { error: updateError } = await supabaseAdmin
      .from('loyalty_programs')
      .update({
        business_name: businessName.trim(),
        reward_title: rewardTitle.trim(),
        reward_terms: rewardTerms.trim(),
        stamps_required: Math.min(Math.max(stampsRequired, 3), 12),
        min_bill_egp: Math.max(minBillEgp, 0),
        cooldown_hours: Math.min(Math.max(cooldownHours, 1), 72),
        is_active: isActive,
      })
      .eq('id', program.id);

    if (updateError) {
      return { success: false, error: 'فشل تحديث الإعدادات' };
    }

    revalidatePath(`/dashboard/loyalty`);
    revalidatePath(`/l/${program.slug}`);

    return { success: true };
  } catch (err) {
    console.error('updateLoyaltyProgramSettings error:', err);
    return { success: false, error: 'حدث خطأ أثناء التحديث' };
  }
}

/**
 * Rotate daily Cashier PIN.
 */
export async function rotateDailyPinAction(): Promise<{
  success: boolean;
  error?: string;
  newPin?: string;
}> {
  try {
    const user = await getAuthenticatedMerchant();
    if (!user) {
      return { success: false, error: 'غير مسموح' };
    }

    const { data: program } = await supabaseAdmin
      .from('loyalty_programs')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!program) {
      return { success: false, error: 'البرنامج غير موجود' };
    }

    const newPin = generateRandomPin();
    const newHash = hashDailyPin(newPin, program.id);

    const { error: updateError } = await supabaseAdmin
      .from('loyalty_programs')
      .update({
        daily_pin_hash: newHash,
        daily_pin_display: newPin,
        pin_rotated_at: new Date().toISOString(),
      })
      .eq('id', program.id);

    if (updateError) {
      return { success: false, error: 'فشل تغيير كود الكاشير' };
    }

    revalidatePath(`/dashboard/loyalty`);

    return { success: true, newPin };
  } catch (err) {
    console.error('rotateDailyPinAction error:', err);
    return { success: false, error: 'حدث خطأ أثناء تغيير الكود' };
  }
}
