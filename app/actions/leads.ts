'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeEgyptianPhone } from '@/lib/loyalty-crypto';
import { consumeRateLimit } from '@/lib/rate-limit';

export async function submitCardLeadAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Silent honeypot check against bots
    const honeypot = formData.get('b_check')?.toString()?.trim();
    if (honeypot) {
      return { success: true };
    }

    const businessCardId = formData.get('business_card_id')?.toString()?.trim() || '';
    const visitorName = formData.get('visitor_name')?.toString()?.trim() || '';
    const visitorPhoneRaw = formData.get('visitor_phone')?.toString()?.trim() || '';
    const visitorNoteRaw = formData.get('visitor_note')?.toString()?.trim() || '';

    if (!businessCardId || !visitorName || !visitorPhoneRaw) {
      return { success: false, error: 'الاسم ورقم الموبايل مطلوبان.' };
    }

    // 2. Strict field length caps
    if (visitorName.length < 2 || visitorName.length > 80) {
      return { success: false, error: 'يرجى إدخال اسم صحيح (من 2 إلى 80 حرفاً).' };
    }

    if (visitorPhoneRaw.length > 25) {
      return { success: false, error: 'رقم الموبايل طويل جداً.' };
    }

    if (visitorNoteRaw.length > 500) {
      return { success: false, error: 'الملاحظة طويلة جداً (الحد الأقصى 500 حرف).' };
    }

    // 3. Validate Egyptian mobile format (+201xxxxxxxxx -> normalized 01xxxxxxxxx for display)
    const canonicalPhone = normalizeEgyptianPhone(visitorPhoneRaw);
    if (!canonicalPhone) {
      return {
        success: false,
        error: 'يرجى إدخال رقم موبايل مصري صحيح (مثال: 01012345678).',
      };
    }
    const cleanPhone = `0${canonicalPhone.slice(3)}`;

    // 4. Rate limit per-card & per-IP (15 minutes window)
    const [cardLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'lead_card',
        targetId: businessCardId,
        maxRequests: 5,
        windowSeconds: 900,
      }),
      consumeRateLimit({
        scope: 'lead_ip',
        targetId: 'global',
        maxRequests: 15,
        windowSeconds: 900,
      }),
    ]);

    if (!cardLimit.allowed || !ipLimit.allowed) {
      return {
        success: false,
        error: 'تم إرسال طلبات كثيرة مؤخراً. يرجى الانتظار بضع دقائق والمحاولة مرة أخرى.',
      };
    }

    // 5. Verify target business card exists and is active
    const { data: bc, error: bcErr } = await supabaseAdmin
      .from('business_cards')
      .select('id')
      .eq('id', businessCardId)
      .eq('is_active', true)
      .maybeSingle();

    if (bcErr || !bc) {
      return { success: false, error: 'كارت الأعمال غير موجود أو غير نشط.' };
    }

    const { error: insertErr } = await supabaseAdmin.from('card_leads').insert({
      business_card_id: businessCardId,
      visitor_name: visitorName,
      visitor_phone: cleanPhone,
      visitor_note: visitorNoteRaw || null,
    });

    if (insertErr) {
      console.error('Lead insert error details:', insertErr);
      return { success: false, error: 'تعذر حفظ البيانات حالياً. يرجى المحاولة لاحقاً.' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('submitCardLeadAction unexpected error:', err);
    return { success: false, error: 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.' };
  }
}
