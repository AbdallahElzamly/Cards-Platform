'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';
import { generateRandomPin, hashDailyPin } from '@/lib/loyalty-crypto';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import { LoyaltyProgram } from '@/types/loyalty';

export type DashboardFailureReason =
  | 'UNAUTHENTICATED'
  | 'NO_LOYALTY_PROGRAM'
  | 'ENV_MISSING'
  | 'DB_PERMISSION_DENIED'
  | 'DB_ERROR';

export interface RecentActivityItem {
  id: string;
  type: 'visit' | 'redemption';
  member_name: string;
  phone_last4: string;
  phone?: string | null;
  stamp_number_after?: number;
  voucher_code?: string;
  table_code: string | null;
  created_at: string;
}

export interface MerchantDashboardData {
  merchantEmail: string;
  program: LoyaltyProgram;
  metrics: {
    todayVisits: number;
    totalMembers: number;
    nearRewardMembers: number;
    redeemedVouchers: number;
    activeVouchers: number;
  };
  recentActivity: RecentActivityItem[];
}

export interface MerchantDashboardResult {
  success: boolean;
  reason?: DashboardFailureReason;
  error?: string;
  data?: MerchantDashboardData;
}

function sanitizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function getAuthenticatedMerchantUser() {
  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    return { user: null, envMissing: env.missingVars };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, envMissing: null };
  }

  return { user, envMissing: null };
}

export async function getMerchantLoyaltyDashboard(
  businessIdOrSlug?: string
): Promise<MerchantDashboardResult> {
  try {
    const serverEnv = getServerSupabaseEnv();
    if (!serverEnv.isAuthConfigured || !serverEnv.isAdminConfigured) {
      return {
        success: false,
        reason: 'ENV_MISSING',
        error: `متغيرات البيئة الناقصة: ${serverEnv.missingVars.join(', ')}`,
      };
    }

    const { user } = await getAuthenticatedMerchantUser();
    if (!user) {
      return {
        success: false,
        reason: 'UNAUTHENTICATED',
        error: 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم.',
      };
    }

    const admin = getSupabaseAdmin();

    // 1. Fetch merchant's loyalty program
    let query = admin.from('loyalty_programs').select('*').eq('owner_id', user.id);
    if (businessIdOrSlug) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        businessIdOrSlug
      );
      query = isUuid
        ? query.eq('id', businessIdOrSlug)
        : query.eq('slug', businessIdOrSlug);
    }

    const { data: existingPrograms, error: fetchError } = await query
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('loyalty_programs fetchError:', fetchError);
      if (fetchError.code === '42501') {
        return {
          success: false,
          reason: 'DB_PERMISSION_DENIED',
          error:
            'قاعدة بيانات Supabase تحتاج تفعيل صلاحيات الجداول (GRANT). شغّل ملف supabase/FIX_SUPABASE_PERMISSIONS.sql في Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        reason: 'DB_ERROR',
        error: `خطأ من قاعدة البيانات: ${fetchError.message}`,
      };
    }

    let program: LoyaltyProgram | null = existingPrograms?.[0] || null;

    // Security Gate (Team 3 & Team 4 Audit): Only Super Admin auto-creates a demo loyalty program.
    // Individual business-card accounts without an assigned loyalty_programs row are denied auto-minting.
    if (!program) {
      if (!isSuperAdminEmail(user.email)) {
        return {
          success: false,
          reason: 'NO_LOYALTY_PROGRAM',
          error: 'هذا الحساب مخصص لكروت الأعمال الذكية وليس مرتبطاً ببرنامج ولاء مطاعم.',
        };
      }

      const { data: testCafeExists } = await admin
        .from('loyalty_programs')
        .select('id')
        .eq('slug', 'test-cafe')
        .maybeSingle();

      const initialSlug = testCafeExists ? `cafe-${user.id.slice(0, 6)}` : 'test-cafe';
      const defaultPin = generateRandomPin();
      const metaBusinessName =
        (typeof user.user_metadata?.business_name === 'string' &&
          user.user_metadata.business_name.trim()) ||
        'كافيه ومطعم النخبة';

      const { data: createdProg, error: createError } = await admin
        .from('loyalty_programs')
        .insert({
          owner_id: user.id,
          slug: initialSlug,
          business_name: metaBusinessName,
          primary_color: '#1E3A8A',
          stamps_required: 6,
          min_bill_egp: 100,
          reward_title: 'وجبتك السادسة مجاناً',
          reward_terms: 'بحد أقصى متوسط طلباتك أو من قائمة المكافآت المختارة',
          cooldown_hours: 18,
          daily_pin_hash: 'pending',
          daily_pin_display: defaultPin,
          is_active: true,
        })
        .select('*')
        .single();

      if (createError || !createdProg) {
        console.error('Auto-create loyalty_program error:', createError);
        if (createError?.code === '42501') {
          return {
            success: false,
            reason: 'DB_PERMISSION_DENIED',
            error:
              'قاعدة بيانات Supabase ترفض الكتابة (42501). شغّل ملف supabase/FIX_SUPABASE_PERMISSIONS.sql في SQL Editor.',
          };
        }
        return {
          success: false,
          reason: 'DB_ERROR',
          error: 'تعذر تهيئة برنامج الولاء التلقائي لحسابك.',
        };
      }

      const realHash = hashDailyPin(defaultPin, createdProg.id);
      await admin
        .from('loyalty_programs')
        .update({ daily_pin_hash: realHash })
        .eq('id', createdProg.id);

      const initializedProgram: LoyaltyProgram = {
        ...(createdProg as LoyaltyProgram),
        daily_pin_hash: realHash,
      };
      program = initializedProgram;
    }

    const activeProgram: LoyaltyProgram = program;

    // 2. Compute the 4 Spec KPIs (S09) + active vouchers count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const nearMin = Math.max(1, activeProgram.stamps_required - 2);
    const nearMax = Math.max(1, activeProgram.stamps_required - 1);

    const [
      { count: todayVisits },
      { count: totalMembers },
      { count: nearRewardMembers },
      { count: redeemedVouchers },
      { count: activeVouchers },
      { data: rawVisits },
      { data: rawRedemptions },
    ] = await Promise.all([
      admin
        .from('loyalty_visits')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id)
        .gte('created_at', startOfToday.toISOString()),
      admin
        .from('loyalty_members')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id),
      admin
        .from('loyalty_members')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id)
        .gte('current_stamps', nearMin)
        .lte('current_stamps', nearMax),
      admin
        .from('loyalty_vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id)
        .eq('status', 'redeemed'),
      admin
        .from('loyalty_vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id)
        .eq('status', 'active'),
      admin
        .from('loyalty_visits')
        .select(
          `
          id,
          stamp_number_after,
          table_code,
          created_at,
          loyalty_members (
            first_name,
            phone_last4,
            phone
          )
        `
        )
        .eq('program_id', activeProgram.id)
        .order('created_at', { ascending: false })
        .limit(15),
      admin
        .from('loyalty_vouchers')
        .select(
          `
          id,
          voucher_code,
          redeemed_at,
          redeemed_by_table,
          loyalty_members (
            first_name,
            phone_last4,
            phone
          )
        `
        )
        .eq('program_id', activeProgram.id)
        .eq('status', 'redeemed')
        .not('redeemed_at', 'is', null)
        .order('redeemed_at', { ascending: false })
        .limit(10),
    ]);

    type JoinedMemberRef =
      | { first_name?: string; phone_last4?: string; phone?: string | null }
      | Array<{ first_name?: string; phone_last4?: string; phone?: string | null }>
      | null;

    interface RawVisitRow {
      id: string;
      stamp_number_after: number;
      table_code: string | null;
      created_at: string;
      loyalty_members: JoinedMemberRef;
    }

    interface RawRedemptionRow {
      id: string;
      voucher_code: string;
      redeemed_at: string;
      redeemed_by_table: string | null;
      loyalty_members: JoinedMemberRef;
    }

    const visitItems: RecentActivityItem[] = ((rawVisits || []) as RawVisitRow[]).map((v) => {
      const m = Array.isArray(v.loyalty_members) ? v.loyalty_members[0] : v.loyalty_members;
      return {
        id: `visit-${v.id}`,
        type: 'visit',
        member_name: m?.first_name || 'عميل',
        phone_last4: m?.phone_last4 || '0000',
        phone: m?.phone || null,
        stamp_number_after: v.stamp_number_after,
        table_code: v.table_code,
        created_at: v.created_at,
      };
    });

    const redemptionItems: RecentActivityItem[] = (
      (rawRedemptions || []) as RawRedemptionRow[]
    ).map((r) => {
      const m = Array.isArray(r.loyalty_members) ? r.loyalty_members[0] : r.loyalty_members;
      return {
        id: `redeem-${r.id}`,
        type: 'redemption',
        member_name: m?.first_name || 'عميل',
        phone_last4: m?.phone_last4 || '0000',
        phone: m?.phone || null,
        voucher_code: r.voucher_code,
        table_code: r.redeemed_by_table,
        created_at: r.redeemed_at,
      };
    });

    const recentActivity = [...visitItems, ...redemptionItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    return {
      success: true,
      data: {
        merchantEmail: user.email || '',
        program: activeProgram,
        metrics: {
          todayVisits: todayVisits || 0,
          totalMembers: totalMembers || 0,
          nearRewardMembers: nearRewardMembers || 0,
          redeemedVouchers: redeemedVouchers || 0,
          activeVouchers: activeVouchers || 0,
        },
        recentActivity,
      },
    };
  } catch (err) {
    console.error('getMerchantLoyaltyDashboard unexpected error:', err);
    return {
      success: false,
      reason: 'DB_ERROR',
      error: 'حدث خطأ غير متوقع أثناء تحميل لوحة التحكم.',
    };
  }
}

export async function updateLoyaltyProgramSettings(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  updatedProgram?: LoyaltyProgram;
}> {
  try {
    const { user } = await getAuthenticatedMerchantUser();
    if (!user) {
      return { success: false, error: 'انتهت جلسة الدخول، يرجى تسجيل الدخول مجدداً.' };
    }

    const programId = formData.get('program_id')?.toString() || '';
    const businessName = formData.get('business_name')?.toString()?.trim() || '';
    const rawSlug = formData.get('slug')?.toString() || '';
    const primaryColor = formData.get('primary_color')?.toString()?.trim() || '#1E3A8A';
    const rewardTitle = formData.get('reward_title')?.toString()?.trim() || '';
    const rewardTerms = formData.get('reward_terms')?.toString()?.trim() || '';
    const stampsRequired = parseInt(formData.get('stamps_required')?.toString() || '6', 10);
    const minBillEgp = parseInt(formData.get('min_bill_egp')?.toString() || '100', 10);
    const cooldownHours = parseInt(formData.get('cooldown_hours')?.toString() || '18', 10);
    const isActive = formData.get('is_active') === 'true';

    if (!businessName || !rewardTitle) {
      return { success: false, error: 'اسم المطعم وعنوان المكافأة مطلوبان.' };
    }

    const admin = getSupabaseAdmin();
    let lookup = admin.from('loyalty_programs').select('id, slug').eq('owner_id', user.id);
    if (programId) lookup = lookup.eq('id', programId);
    const { data: currentProg } = await lookup.limit(1).maybeSingle();

    if (!currentProg) {
      return { success: false, error: 'لم يتم العثور على البرنامج.' };
    }

    const cleanSlug = sanitizeSlug(rawSlug) || currentProg.slug;
    const validHex = /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : '#1E3A8A';

    const { data: updated, error: updateError } = await admin
      .from('loyalty_programs')
      .update({
        business_name: businessName.slice(0, 60),
        slug: cleanSlug,
        primary_color: validHex,
        reward_title: rewardTitle.slice(0, 80),
        reward_terms: rewardTerms.slice(0, 200),
        stamps_required: Math.min(Math.max(stampsRequired || 6, 3), 12),
        min_bill_egp: Math.max(minBillEgp || 0, 0),
        cooldown_hours: Math.min(Math.max(cooldownHours || 18, 1), 72),
        is_active: isActive,
      })
      .eq('id', currentProg.id)
      .eq('owner_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      if (updateError?.code === '23505') {
        return { success: false, error: 'الرابط المختصر (Slug) مستخدم بالفعل، اختر اسماً آخر.' };
      }
      return { success: false, error: 'تعذر حفظ الإعدادات، حاول مرة أخرى.' };
    }

    revalidatePath('/dashboard/loyalty');
    revalidatePath(`/l/${currentProg.slug}`);
    revalidatePath(`/l/${updated.slug}`);

    return { success: true, updatedProgram: updated };
  } catch (err) {
    console.error('updateLoyaltyProgramSettings error:', err);
    return { success: false, error: 'حدث خطأ أثناء حفظ الإعدادات.' };
  }
}

export async function rotateDailyPinAction(programId?: string): Promise<{
  success: boolean;
  error?: string;
  newPin?: string;
  rotatedAt?: string;
}> {
  try {
    const { user } = await getAuthenticatedMerchantUser();
    if (!user) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً.' };
    }

    const admin = getSupabaseAdmin();
    let query = admin.from('loyalty_programs').select('id').eq('owner_id', user.id);
    if (programId) query = query.eq('id', programId);

    const { data: program } = await query.limit(1).maybeSingle();
    if (!program) {
      return { success: false, error: 'البرنامج غير موجود.' };
    }

    const newPin = generateRandomPin();
    const newHash = hashDailyPin(newPin, program.id);
    const rotatedAt = new Date().toISOString();

    const { error: updateError } = await admin
      .from('loyalty_programs')
      .update({
        daily_pin_hash: newHash,
        daily_pin_display: newPin,
        pin_rotated_at: rotatedAt,
      })
      .eq('id', program.id)
      .eq('owner_id', user.id);

    if (updateError) {
      return { success: false, error: 'فشل تغيير كود الكاشير.' };
    }

    revalidatePath('/dashboard/loyalty');

    return { success: true, newPin, rotatedAt };
  } catch (err) {
    console.error('rotateDailyPinAction error:', err);
    return { success: false, error: 'حدث خطأ أثناء تدوير الكود.' };
  }
}
