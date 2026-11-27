'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function submitCardLeadAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const businessCardId = formData.get('business_card_id')?.toString()?.trim();
    const visitorName = formData.get('visitor_name')?.toString()?.trim();
    const visitorPhone = formData.get('visitor_phone')?.toString()?.trim();
    const visitorNote = formData.get('visitor_note')?.toString()?.trim() || null;

    if (!businessCardId || !visitorName || !visitorPhone) {
      return { success: false, error: 'جميع الحكام الأساسية (الاسم ورقم الموبايل) مطلوبة' };
    }

    // Verify business card exists
    const { data: bc, error: bcErr } = await supabaseAdmin
      .from('business_cards')
      .select('id')
      .eq('id', businessCardId)
      .single();

    if (bcErr || !bc) {
      return { success: false, error: 'كارت الأعمال غير موجود أو غير نشط' };
    }

    // Insert lead using supabaseAdmin (bypassing browser RLS blocks)
    const { error: insertErr } = await supabaseAdmin.from('card_leads').insert({
      business_card_id: businessCardId,
      visitor_name: visitorName,
      visitor_phone: visitorPhone,
      visitor_note: visitorNote,
    });

    if (insertErr) {
      console.error('Lead insert error details:', insertErr);
      return { success: false, error: `فشل حفظ البيانات: ${insertErr.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('submitCardLeadAction unexpected error:', err);
    return { success: false, error: err.message || 'حدث خطأ أثناء إرسال البيانات' };
  }
}
