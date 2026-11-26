'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  normalizeEgyptianPhone,
  normalizePinDigits,
  hashPhone,
  hashIpAddress,
  verifyDailyPin,
  signLoyaltySession,
  verifyLoyaltySession,
  generateVoucherCode,
} from '@/lib/loyalty-crypto';
import {
  LoyaltyMember,
  LoyaltyProgram,
  LoyaltyVoucher,
  PublicLoyaltyMember,
  PublicLoyaltyProgram,
} from '@/types/loyalty';

const PUBLIC_PROGRAM_COLUMNS =
  'id, slug, business_name, logo_url, primary_color, stamps_required, min_bill_egp, reward_title, reward_terms, cooldown_hours, is_active, v2_scratch_enabled, v2_double_stamp_active, created_at';

export interface LoyaltyActionResult {
  success: boolean;
  error?: string;
  status?: 'stamped' | 'voucher_unlocked' | 'cooldown' | 'active_voucher' | 'redeemed' | 'ready';
  remainingHours?: number;
  remainingMinutes?: number;
  member?: PublicLoyaltyMember | null;
  program?: PublicLoyaltyProgram;
  activeVoucher?: LoyaltyVoucher | null;
}

function toPublicMember(member: LoyaltyMember): PublicLoyaltyMember {
  const { phone_hash: _omit, ...safeMember } = member;
  void _omit;
  return safeMember;
}

function toPublicProgram(program: LoyaltyProgram | PublicLoyaltyProgram): PublicLoyaltyProgram {
  return {
    id: program.id,
    slug: program.slug,
    business_name: program.business_name,
    logo_url: program.logo_url,
    primary_color: program.primary_color,
    stamps_required: program.stamps_required,
    min_bill_egp: program.min_bill_egp,
    reward_title: program.reward_title,
    reward_terms: program.reward_terms,
    cooldown_hours: program.cooldown_hours,
    is_active: program.is_active,
    v2_scratch_enabled: program.v2_scratch_enabled,
    v2_double_stamp_active: program.v2_double_stamp_active,
    created_at: program.created_at,
  };
}

async function getHashedClientIp(): Promise<string> {
  const hdrs = await headers();
  const rawIp =
    hdrs.get('x-forwarded-for') ||
    hdrs.get('x-real-ip') ||
    'unknown';
  return hashIpAddress(rawIp);
}

function sanitizeTableCode(tableCode?: string | null): string | null {
  if (!tableCode) return null;
  const cleaned = tableCode.trim().replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 16);
  return cleaned || null;
}

function calculateCooldown(lastVisitAt: string | null, cooldownHours: number) {
  if (!lastVisitAt) {
    return { inCooldown: false, remainingHours: 0, remainingMinutes: 0 };
  }
  const nowMs = Date.now();
  const lastMs = new Date(lastVisitAt).getTime();
  const cooldownMs = cooldownHours * 3600 * 1000;
  const elapsedMs = nowMs - lastMs;

  if (elapsedMs < cooldownMs) {
    const remainingMs = Math.max(cooldownMs - elapsedMs, 60 * 1000);
    const remainingHours = Math.floor(remainingMs / (3600 * 1000));
    const remainingMinutes = Math.ceil((remainingMs % (3600 * 1000)) / (60 * 1000));
    return {
      inCooldown: true,
      remainingHours: remainingMinutes === 60 ? remainingHours + 1 : remainingHours,
      remainingMinutes: remainingMinutes === 60 ? 0 : remainingMinutes,
    };
  }

  return { inCooldown: false, remainingHours: 0, remainingMinutes: 0 };
}

/**
 * Checks 5-attempts-per-15-minutes rate limit and verifies the 4-digit Cashier PIN.
 */
async function checkRateLimitAndVerifyPin(
  program: LoyaltyProgram,
  actorKey: string,
  rawPin: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedPin = normalizePinDigits(rawPin);
  if (!normalizedPin) {
    return { ok: false, error: 'يرجى إدخال كود الكاشير المكون من 4 أرقام.' };
  }

  const admin = getSupabaseAdmin();
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { count: failedCount } = await admin
    .from('loyalty_pin_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', program.id)
    .eq('actor_key', actorKey)
    .gte('attempted_at', fifteenMinsAgo);

  if ((failedCount || 0) >= 5) {
    return {
      ok: false,
      error: 'محاولات كتير غلط، استنى 15 دقيقة وجرب تاني أو راجع الكاشير.',
    };
  }

  const isValid = verifyDailyPin(normalizedPin, program.id, program.daily_pin_hash);
  if (!isValid) {
    await admin.from('loyalty_pin_attempts').insert({
      program_id: program.id,
      actor_key: actorKey,
    });
    return {
      ok: false,
      error: 'الكود غير صحيح، راجع الكاشير وجرب تاني',
    };
  }

  // Opportunistically clean up failed attempts for this actor on valid PIN
  await admin
    .from('loyalty_pin_attempts')
    .delete()
    .eq('program_id', program.id)
    .eq('actor_key', actorKey);

  return { ok: true };
}

/**
 * Shared visit stamping & 6th-visit voucher issuance logic for both new and returning customers.
 */
async function applyStampOrReturnState(
  program: LoyaltyProgram,
  member: LoyaltyMember,
  slug: string,
  tableCode?: string,
  ipHash?: string
): Promise<LoyaltyActionResult> {
  const admin = getSupabaseAdmin();

  // 1. Check active unredeemed voucher first (S07)
  const { data: existingVoucher } = await admin
    .from('loyalty_vouchers')
    .select('*')
    .eq('member_id', member.id)
    .eq('program_id', program.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingVoucher) {
    await setSessionCookie(slug, member.id, program.id);
    return {
      success: true,
      status: 'active_voucher',
      member: toPublicMember(member),
      program: toPublicProgram(program),
      activeVoucher: existingVoucher,
    };
  }

  // 2. Check server-side cooldown window (S05)
  const cooldown = calculateCooldown(member.last_visit_at, program.cooldown_hours);
  if (cooldown.inCooldown) {
    await setSessionCookie(slug, member.id, program.id);
    return {
      success: true,
      status: 'cooldown',
      remainingHours: cooldown.remainingHours,
      remainingMinutes: cooldown.remainingMinutes,
      member: toPublicMember(member),
      program: toPublicProgram(program),
      activeVoucher: null,
    };
  }

  // 3. Award stamp & record immutable visit log
  const nextStamps = Math.min(member.current_stamps + 1, program.stamps_required);
  const safeTable = sanitizeTableCode(tableCode);
  const nowIso = new Date().toISOString();

  const { error: visitError } = await admin.from('loyalty_visits').insert({
    program_id: program.id,
    member_id: member.id,
    table_code: safeTable,
    stamps_awarded: 1,
    stamp_number_after: nextStamps,
    ip_hash: ipHash || null,
  });

  if (visitError) {
    console.error('loyalty_visits insert error:', visitError);
    return { success: false, error: 'تعذر تسجيل الزيارة حالياً، يرجى المحاولة مرة أخرى.' };
  }

  const { data: updatedMember, error: memberUpdateError } = await admin
    .from('loyalty_members')
    .update({
      current_stamps: nextStamps,
      total_visits: member.total_visits + 1,
      last_visit_at: nowIso,
    })
    .eq('id', member.id)
    .select('*')
    .single();

  if (memberUpdateError || !updatedMember) {
    console.error('loyalty_members update error:', memberUpdateError);
    return { success: false, error: 'تعذر تحديث بطاقة الأختام، يرجى المحاولة مرة أخرى.' };
  }

  // 4. Issue Golden Voucher atomically if stamps_required reached
  let issuedVoucher: LoyaltyVoucher | null = null;
  if (updatedMember.current_stamps >= program.stamps_required) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateVoucherCode();
      const { data: newVoucher, error: voucherError } = await admin
        .from('loyalty_vouchers')
        .insert({
          program_id: program.id,
          member_id: updatedMember.id,
          voucher_code: code,
          reward_title: program.reward_title,
          status: 'active',
        })
        .select('*')
        .single();

      if (!voucherError && newVoucher) {
        issuedVoucher = newVoucher;
        break;
      }
    }
  }

  await setSessionCookie(slug, updatedMember.id, program.id);
  revalidatePath(`/l/${slug}`);

  return {
    success: true,
    status: issuedVoucher ? 'voucher_unlocked' : 'stamped',
    member: toPublicMember(updatedMember),
    program: toPublicProgram(program),
    activeVoucher: issuedVoucher,
  };
}

/**
 * 1. First-visit registration OR returning phone recovery + stamp (S02 -> S03 -> S04/S05/S07).
 */
export async function lookupOrRegisterAndStamp(
  slug: string,
  firstName: string,
  rawPhone: string,
  pin: string,
  tableCode?: string,
  consentAccepted?: boolean
): Promise<LoyaltyActionResult> {
  try {
    if (!slug) {
      return { success: false, error: 'رابط المطعم غير صالح.' };
    }

    const canonicalPhone = normalizeEgyptianPhone(rawPhone);
    if (!canonicalPhone) {
      return {
        success: false,
        error: 'رقم الموبايل غير صحيح، تأكد من إدخال رقم مصري مكون من 11 رقم (مثال: 01012345678).',
      };
    }

    const admin = getSupabaseAdmin();
    const { data: program, error: progError } = await admin
      .from('loyalty_programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (progError || !program) {
      return { success: false, error: 'المطعم غير متاح حالياً.' };
    }

    const phoneHash = hashPhone(canonicalPhone);
    const phoneLast4 = canonicalPhone.slice(-4);
    const ipHash = await getHashedClientIp();
    const actorKey = `${ipHash}:${phoneHash.slice(0, 24)}`;

    // Verify PIN with server-side rate limit
    const pinCheck = await checkRateLimitAndVerifyPin(program, actorKey, pin);
    if (!pinCheck.ok) {
      return { success: false, error: pinCheck.error };
    }

    const cleanName = firstName ? firstName.trim().slice(0, 30) : '';

    // Lookup existing member by (program_id, phone_hash)
    let { data: member } = await admin
      .from('loyalty_members')
      .select('*')
      .eq('program_id', program.id)
      .eq('phone_hash', phoneHash)
      .maybeSingle();

    if (!member) {
      if (consentAccepted === false) {
        return {
          success: false,
          error: 'يرجى الموافقة على حفظ الرقم مشفراً لتسجيل زياراتك في برنامج الولاء.',
        };
      }

      const { data: createdMember, error: insertError } = await admin
        .from('loyalty_members')
        .insert({
          program_id: program.id,
          first_name: cleanName || 'ضيفنا العزيز',
          phone_hash: phoneHash,
          phone_last4: phoneLast4,
          phone: canonicalPhone,
          current_stamps: 0,
          total_visits: 0,
          consent_accepted_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError || !createdMember) {
        console.error('loyalty_members insert error:', insertError);
        return { success: false, error: 'حدث خطأ أثناء إنشاء بطاقتك، يرجى المحاولة مرة أخرى.' };
      }
      member = createdMember;
    } else {
      // Update phone or first_name if changed
      const updates: { first_name?: string; phone?: string } = {};
      if (cleanName && cleanName !== member.first_name) updates.first_name = cleanName;
      if (!member.phone || member.phone !== canonicalPhone) updates.phone = canonicalPhone;

      if (Object.keys(updates).length > 0) {
        const { data: updatedRec } = await admin
          .from('loyalty_members')
          .update(updates)
          .eq('id', member.id)
          .select('*')
          .single();
        if (updatedRec) member = updatedRec;
      }
    }

    return await applyStampOrReturnState(program, member, slug, tableCode, ipHash);
  } catch (err) {
    console.error('lookupOrRegisterAndStamp error:', err);
    return { success: false, error: 'المطعم غير متاح حالياً أو الاتصال ضعيف، حاول مرة أخرى.' };
  }
}

/**
 * 2. Returning customer 1-tap stamp using verified HttpOnly signed cookie (< 4s UX).
 */
export async function stampReturningMemberAction(
  slug: string,
  pin: string,
  tableCode?: string
): Promise<LoyaltyActionResult> {
  try {
    if (!slug) {
      return { success: false, error: 'رابط المطعم غير صالح.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(`loyalty_sess_${slug}`)?.value;
    if (!token) {
      return {
        success: false,
        error: 'انتهت الجلسة، يرجى إدخال رقم موبايلك مرة واحدة لاسترجاع أختامك.',
      };
    }

    const session = verifyLoyaltySession(token);
    if (!session) {
      cookieStore.delete(`loyalty_sess_${slug}`);
      return {
        success: false,
        error: 'جلسة غير صالحة، يرجى إدخال رقم موبايلك لاسترجاع بطاقتك.',
      };
    }

    const admin = getSupabaseAdmin();
    const { data: program, error: progError } = await admin
      .from('loyalty_programs')
      .select('*')
      .eq('id', session.programId)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (progError || !program) {
      return { success: false, error: 'المطعم غير متاح حالياً.' };
    }

    const { data: member } = await admin
      .from('loyalty_members')
      .select('*')
      .eq('id', session.memberId)
      .eq('program_id', program.id)
      .maybeSingle();

    if (!member) {
      cookieStore.delete(`loyalty_sess_${slug}`);
      return {
        success: false,
        error: 'لم نتمكن من العثور على البطاقة، يرجى التسجيل برقم الموبايل.',
      };
    }

    const ipHash = await getHashedClientIp();
    const actorKey = `${ipHash}:m:${member.id}`;

    const pinCheck = await checkRateLimitAndVerifyPin(program, actorKey, pin);
    if (!pinCheck.ok) {
      return { success: false, error: pinCheck.error };
    }

    return await applyStampOrReturnState(program, member, slug, tableCode, ipHash);
  } catch (err) {
    console.error('stampReturningMemberAction error:', err);
    return { success: false, error: 'حدث خطأ مؤقت، يرجى المحاولة مرة أخرى.' };
  }
}

/**
 * 3. Read member card state on initial SSR load of /l/[slug].
 */
export async function getMemberCardState(slug: string): Promise<LoyaltyActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(`loyalty_sess_${slug}`)?.value;
    if (!token) {
      return { success: false };
    }

    const payload = verifyLoyaltySession(token);
    if (!payload) {
      return { success: false };
    }

    const admin = getSupabaseAdmin();
    const { data: rawProgram } = await admin
      .from('loyalty_programs')
      .select(PUBLIC_PROGRAM_COLUMNS)
      .eq('id', payload.programId)
      .eq('slug', slug)
      .maybeSingle();

    if (!rawProgram || !rawProgram.is_active) {
      return { success: false };
    }

    const { data: member } = await admin
      .from('loyalty_members')
      .select('*')
      .eq('id', payload.memberId)
      .eq('program_id', rawProgram.id)
      .maybeSingle();

    if (!member) {
      return { success: false };
    }

    const { data: activeVoucher } = await admin
      .from('loyalty_vouchers')
      .select('*')
      .eq('member_id', member.id)
      .eq('program_id', rawProgram.id)
      .eq('status', 'active')
      .maybeSingle();

    const cooldown = calculateCooldown(member.last_visit_at, rawProgram.cooldown_hours);

    return {
      success: true,
      status: activeVoucher
        ? 'active_voucher'
        : cooldown.inCooldown
        ? 'cooldown'
        : 'ready',
      remainingHours: cooldown.remainingHours,
      remainingMinutes: cooldown.remainingMinutes,
      member: toPublicMember(member),
      program: toPublicProgram(rawProgram as PublicLoyaltyProgram),
      activeVoucher: activeVoucher || null,
    };
  } catch (err) {
    console.error('getMemberCardState error:', err);
    return { success: false };
  }
}

/**
 * 4. Atomic Cashier Redemption for 6th-Visit Golden Voucher (S07).
 */
export async function redeemVoucherAction(
  slug: string,
  voucherId: string,
  pin: string,
  tableCode?: string
): Promise<LoyaltyActionResult> {
  try {
    if (!slug || !voucherId) {
      return { success: false, error: 'بيانات القسيمة غير مكتملة.' };
    }

    const admin = getSupabaseAdmin();
    const { data: program } = await admin
      .from('loyalty_programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!program) {
      return { success: false, error: 'المطعم غير متاح حالياً.' };
    }

    const ipHash = await getHashedClientIp();
    const actorKey = `${ipHash}:v:${voucherId}`;

    // Rate-limited Cashier PIN verification
    const pinCheck = await checkRateLimitAndVerifyPin(program, actorKey, pin);
    if (!pinCheck.ok) {
      return { success: false, error: pinCheck.error };
    }

    // Confirm voucher belongs to this program
    const { data: voucherRow } = await admin
      .from('loyalty_vouchers')
      .select('id, program_id, member_id, status')
      .eq('id', voucherId)
      .eq('program_id', program.id)
      .maybeSingle();

    if (!voucherRow || voucherRow.status !== 'active') {
      return { success: false, error: 'القسيمة تم صرفها مسبقاً أو غير صالحة.' };
    }

    const { data: rpcResult, error: rpcError } = await admin.rpc('redeem_loyalty_voucher', {
      p_voucher_id: voucherId,
      p_table_code: sanitizeTableCode(tableCode),
    });

    if (rpcError) {
      console.error('redeem_loyalty_voucher RPC error:', rpcError);
      return { success: false, error: 'تعذر تأكيد الصرف حالياً، يرجى المحاولة مرة أخرى.' };
    }

    const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    if (!result || !result.success) {
      return {
        success: false,
        error: result?.message || 'القسيمة مستخدمة مسبقاً أو غير صالحة.',
      };
    }

    revalidatePath(`/l/${slug}`);

    const updatedState = await getMemberCardState(slug);
    return {
      ...updatedState,
      success: true,
      status: 'redeemed',
      activeVoucher: null,
    };
  } catch (err) {
    console.error('redeemVoucherAction error:', err);
    return { success: false, error: 'حدث خطأ أثناء صرف القسيمة.' };
  }
}

/**
 * 5. Instant Card Recovery by Phone Number (when customer clears cookies or switches phones).
 * Restores the 365-day HttpOnly signed cookie & displays existing stamps/vouchers
 * WITHOUT awarding a stamp or burning a voucher (Cashier PIN still required for stamping/redemption).
 */
export async function recoverMemberCardByPhoneAction(
  slug: string,
  rawPhone: string
): Promise<LoyaltyActionResult & { notFoundInProgram?: boolean }> {
  try {
    if (!slug) {
      return { success: false, error: 'رابط المطعم غير صالح.' };
    }

    const canonicalPhone = normalizeEgyptianPhone(rawPhone);
    if (!canonicalPhone) {
      return {
        success: false,
        error: 'رقم الموبايل غير صحيح، تأكد من إدخال رقم مصري مكون من 11 رقم (مثال: 01012345678).',
      };
    }

    const admin = getSupabaseAdmin();
    const { data: rawProgram } = await admin
      .from('loyalty_programs')
      .select(PUBLIC_PROGRAM_COLUMNS)
      .eq('slug', slug)
      .maybeSingle();

    if (!rawProgram || !rawProgram.is_active) {
      return { success: false, error: 'المطعم غير متاح حالياً.' };
    }

    // Rate-limit failed phone lookups per IP (max 8 misses per 15 mins) to prevent enumeration
    const ipHash = await getHashedClientIp();
    const lookupActorKey = `${ipHash}:recover`;
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { count: recentMisses } = await admin
      .from('loyalty_pin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', rawProgram.id)
      .eq('actor_key', lookupActorKey)
      .gte('attempted_at', fifteenMinsAgo);

    if ((recentMisses || 0) >= 8) {
      return {
        success: false,
        error: 'محاولات بحث كثيرة، يرجى الانتظار دقائق قليلة والمحاولة مرة أخرى.',
      };
    }

    const phoneHash = hashPhone(canonicalPhone);
    const { data: member } = await admin
      .from('loyalty_members')
      .select('*')
      .eq('program_id', rawProgram.id)
      .eq('phone_hash', phoneHash)
      .maybeSingle();

    if (!member) {
      await admin.from('loyalty_pin_attempts').insert({
        program_id: rawProgram.id,
        actor_key: lookupActorKey,
      });
      return {
        success: false,
        notFoundInProgram: true,
        error: 'لم نجد أختاماً سابقة بهذا الرقم في هذا المطعم. يمكنك البدء كعضو جديد وختم زيارتك الأولى!',
      };
    }

    const { data: activeVoucher } = await admin
      .from('loyalty_vouchers')
      .select('*')
      .eq('member_id', member.id)
      .eq('program_id', rawProgram.id)
      .eq('status', 'active')
      .maybeSingle();

    const cooldown = calculateCooldown(member.last_visit_at, rawProgram.cooldown_hours);

    await setSessionCookie(slug, member.id, rawProgram.id);
    revalidatePath(`/l/${slug}`);

    return {
      success: true,
      status: activeVoucher
        ? 'active_voucher'
        : cooldown.inCooldown
        ? 'cooldown'
        : 'ready',
      remainingHours: cooldown.remainingHours,
      remainingMinutes: cooldown.remainingMinutes,
      member: toPublicMember(member),
      program: toPublicProgram(rawProgram as PublicLoyaltyProgram),
      activeVoucher: activeVoucher || null,
    };
  } catch (err) {
    console.error('recoverMemberCardByPhoneAction error:', err);
    return { success: false, error: 'تعذر استرجاع البطاقة حالياً، يرجى المحاولة مرة أخرى.' };
  }
}

/**
 * 6. Safely clear customer session cookie ("تبديل الرقم / مش أنا؟").
 */
export async function switchAccountAction(slug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`loyalty_sess_${slug}`);
  revalidatePath(`/l/${slug}`);
}

async function setSessionCookie(slug: string, memberId: string, programId: string): Promise<void> {
  const token = signLoyaltySession({ memberId, programId });
  const cookieStore = await cookies();
  cookieStore.set({
    name: `loyalty_sess_${slug}`,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}
