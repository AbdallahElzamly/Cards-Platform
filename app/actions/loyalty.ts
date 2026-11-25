'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  normalizeEgyptianPhone,
  hashPhone,
  verifyDailyPin,
  signLoyaltySession,
  verifyLoyaltySession,
  generateVoucherCode,
} from '@/lib/loyalty-crypto';
import { LoyaltyMember, LoyaltyProgram, LoyaltyVoucher } from '@/types/loyalty';

interface ActionResult {
  success: boolean;
  error?: string;
  status?: 'success' | 'cooldown' | 'error';
  remainingHours?: number;
  remainingMinutes?: number;
  member?: LoyaltyMember;
  program?: LoyaltyProgram;
  activeVoucher?: LoyaltyVoucher | null;
}

/**
 * 1. Register or lookup member, verify PIN, check cooldown, record visit, issue voucher if 6th visit.
 */
export async function lookupOrRegisterAndStamp(
  slug: string,
  firstName: string,
  rawPhone: string,
  pin: string,
  tableCode?: string,
  consentAccepted?: boolean
): Promise<ActionResult> {
  try {
    if (!slug) {
      return { success: false, error: 'رابط المطعم غير صالح' };
    }

    // 1. Fetch active program
    const { data: program, error: progError } = await supabaseAdmin
      .from('loyalty_programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (progError || !program) {
      return { success: false, error: 'المطعم غير متاح حالياً' };
    }

    // 2. Validate phone number
    const canonicalPhone = normalizeEgyptianPhone(rawPhone);
    if (!canonicalPhone) {
      return { success: false, error: 'رقم الموبايل غير صحيح، تأكد من إدخال رقم مصري صحيح (مثال: 01012345678)' };
    }

    const phoneHash = hashPhone(canonicalPhone);
    const phoneLast4 = canonicalPhone.slice(-4);

    // 3. Rate limit check (max 5 failed attempts per 15 mins)
    const actorKey = phoneHash; // scoped by member phone hash
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { count: failedAttempts } = await supabaseAdmin
      .from('loyalty_pin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('actor_key', actorKey)
      .gte('attempted_at', fifteenMinsAgo);

    if ((failedAttempts || 0) >= 5) {
      return {
        success: false,
        error: 'محاولات خاطئة كثيرة للكود، يرجى الانتظار 15 دقيقة أو مراجعة الكاشير.',
      };
    }

    // 4. Verify daily Cashier PIN
    const isPinValid = verifyDailyPin(pin, program.id, program.daily_pin_hash);
    if (!isPinValid) {
      // Record failed attempt
      await supabaseAdmin.from('loyalty_pin_attempts').insert({
        program_id: program.id,
        actor_key: actorKey,
      });
      return { success: false, error: 'الكود غير صحيح، راجع الكاشير وجرب تاني' };
    }

    // 5. Upsert or fetch member
    const trimmedName = firstName ? firstName.trim().slice(0, 30) : 'صديق المطعم';
    
    let { data: member } = await supabaseAdmin
      .from('loyalty_members')
      .select('*')
      .eq('program_id', program.id)
      .eq('phone_hash', phoneHash)
      .single();

    if (!member) {
      if (consentAccepted === false) {
        return { success: false, error: 'يجب الموافقة على شروط حفظ رقم الموبايل لتسجيل الزيارات' };
      }

      const { data: newMember, error: insertError } = await supabaseAdmin
        .from('loyalty_members')
        .insert({
          program_id: program.id,
          first_name: trimmedName,
          phone_hash: phoneHash,
          phone_last4: phoneLast4,
          current_stamps: 0,
          total_visits: 0,
          consent_accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !newMember) {
        return { success: false, error: 'حدث خطأ أثناء تسجيل العضو الجديد' };
      }
      member = newMember;
    } else if (trimmedName && trimmedName !== 'صديق المطعم') {
      // Update name if updated
      await supabaseAdmin
        .from('loyalty_members')
        .update({ first_name: trimmedName })
        .eq('id', member.id);
      member.first_name = trimmedName;
    }

    // 6. Check Cooldown Window
    const now = new Date();
    if (member.last_visit_at) {
      const lastVisit = new Date(member.last_visit_at);
      const diffHours = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);

      if (diffHours < program.cooldown_hours) {
        const remainingMs = (program.cooldown_hours * 3600 * 1000) - (now.getTime() - lastVisit.getTime());
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        // Set session cookie anyway so they see their card & cooldown state
        await setSessionCookie(slug, member.id, program.id);

        return {
          success: true,
          status: 'cooldown',
          remainingHours,
          remainingMinutes,
          member,
          program,
        };
      }
    }

    // 7. Check if member already has an active voucher (cannot earn stamps until redeemed)
    const { data: activeVoucher } = await supabaseAdmin
      .from('loyalty_vouchers')
      .select('*')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .single();

    if (activeVoucher) {
      await setSessionCookie(slug, member.id, program.id);
      return {
        success: true,
        status: 'success',
        member,
        program,
        activeVoucher,
      };
    }

    // 8. Increment stamp & record visit
    const nextStamps = Math.min(member.current_stamps + 1, program.stamps_required);
    const sanitizedTable = tableCode ? tableCode.trim().slice(0, 16) : null;

    // Insert visit audit log
    await supabaseAdmin.from('loyalty_visits').insert({
      program_id: program.id,
      member_id: member.id,
      table_code: sanitizedTable,
      stamps_awarded: 1,
      stamp_number_after: nextStamps,
    });

    // Update member record
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('loyalty_members')
      .update({
        current_stamps: nextStamps,
        total_visits: member.total_visits + 1,
        last_visit_at: now.toISOString(),
      })
      .eq('id', member.id)
      .select()
      .single();

    if (updateError || !updatedMember) {
      return { success: false, error: 'حدث خطأ أثناء تسجيل الزيارة' };
    }
    member = updatedMember;

    // 9. If reached required stamps, issue voucher atomically
    let issuedVoucher: LoyaltyVoucher | null = null;
    if (member.current_stamps >= program.stamps_required) {
      const voucherCode = generateVoucherCode();
      const { data: newVoucher } = await supabaseAdmin
        .from('loyalty_vouchers')
        .insert({
          program_id: program.id,
          member_id: member.id,
          voucher_code: voucherCode,
          reward_title: program.reward_title,
          status: 'active',
        })
        .select()
        .single();

      if (newVoucher) {
        issuedVoucher = newVoucher;
      }
    }

    // 10. Set secure HttpOnly session cookie
    await setSessionCookie(slug, member.id, program.id);
    revalidatePath(`/l/${slug}`);

    return {
      success: true,
      status: 'success',
      member,
      program,
      activeVoucher: issuedVoucher,
    };
  } catch (err) {
    console.error('lookupOrRegisterAndStamp error:', err);
    return { success: false, error: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى' };
  }
}

/**
     * 2. Get current member card state from cookie session.
     */
export async function getMemberCardState(slug: string): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const cookieName = `loyalty_sess_${slug}`;
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return { success: false };
    }

    const payload = verifyLoyaltySession(token);
    if (!payload) {
      return { success: false };
    }

    const { data: rawProgram } = await supabaseAdmin
      .from('loyalty_programs')
      .select('id, slug, business_name, logo_url, primary_color, stamps_required, min_bill_egp, reward_title, reward_terms, cooldown_hours, is_active, v2_scratch_enabled, v2_double_stamp_active, created_at')
      .eq('slug', slug)
      .single();

    if (!rawProgram || !rawProgram.is_active) {
      return { success: false };
    }

    const program: LoyaltyProgram = {
      ...rawProgram,
      owner_id: '',
      daily_pin_hash: '',
      daily_pin_display: '',
      pin_rotated_at: '',
    };

    // Fetch member
    const { data: member } = await supabaseAdmin
      .from('loyalty_members')
      .select('*')
      .eq('id', payload.memberId)
      .eq('program_id', program.id)
      .single();

    if (!member) {
      return { success: false };
    }

    // Fetch active voucher if any
    const { data: activeVoucher } = await supabaseAdmin
      .from('loyalty_vouchers')
      .select('*')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .single();

    // Check cooldown if last visit exists
    let cooldownStatus = false;
    let remainingHours = 0;
    let remainingMinutes = 0;

    if (member.last_visit_at) {
      const now = new Date();
      const lastVisit = new Date(member.last_visit_at);
      const diffHours = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);

      if (diffHours < program.cooldown_hours) {
        cooldownStatus = true;
        const remainingMs = (program.cooldown_hours * 3600 * 1000) - (now.getTime() - lastVisit.getTime());
        remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      }
    }

    return {
      success: true,
      status: cooldownStatus ? 'cooldown' : 'success',
      remainingHours,
      remainingMinutes,
      member,
      program,
      activeVoucher: activeVoucher || null,
    };
  } catch (err) {
    console.error('getMemberCardState error:', err);
    return { success: false };
  }
}

/**
 * 3. Redeem active voucher atomically via Supabase RPC after verifying Cashier PIN.
 */
export async function redeemVoucherAction(
  slug: string,
  voucherId: string,
  pin: string,
  tableCode?: string
): Promise<ActionResult> {
  try {
    // 1. Fetch program
    const { data: program } = await supabaseAdmin
      .from('loyalty_programs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!program) {
      return { success: false, error: 'المطعم غير موجود' };
    }

    // 2. Verify PIN
    const isPinValid = verifyDailyPin(pin, program.id, program.daily_pin_hash);
    if (!isPinValid) {
      return { success: false, error: 'الكود غير صحيح، راجع الكاشير' };
    }

    // 3. Call atomic RPC function redeem_loyalty_voucher
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('redeem_loyalty_voucher', {
      p_voucher_id: voucherId,
      p_table_code: tableCode ? tableCode.trim().slice(0, 16) : null,
    });

    if (rpcError) {
      console.error('redeem_loyalty_voucher RPC error:', rpcError);
      return { success: false, error: 'فشل استبدال القسيمة، يرجى المحاولة مرة أخرى' };
    }

    const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

    if (!result || !result.success) {
      return { success: false, error: result?.message || 'القسيمة مستخدمة مسبقاً أو غير صالحة' };
    }

    revalidatePath(`/l/${slug}`);

    // Return updated state
    return getMemberCardState(slug);
  } catch (err) {
    console.error('redeemVoucherAction error:', err);
    return { success: false, error: 'حدث خطأ أثناء صرف القسيمة' };
  }
}

/**
 * 4. Switch account (clears session cookie).
 */
export async function switchAccountAction(slug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`loyalty_sess_${slug}`);
  revalidatePath(`/l/${slug}`);
}

/**
 * Helper to set secure HttpOnly signed cookie.
 */
async function setSessionCookie(slug: string, memberId: string, programId: string): Promise<void> {
  const token = signLoyaltySession({ memberId, programId });
  const cookieStore = await cookies();
  cookieStore.set({
    name: `loyalty_sess_${slug}`,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
}
