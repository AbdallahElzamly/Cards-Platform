'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export async function activateCardAction(formData: FormData): Promise<{ success: boolean; error?: string; slug?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'يجيب تسجيل الدخول لتفعيل الكارت' };
    }

    const rawCode = formData.get('code')?.toString() || '';
    const code = rawCode.trim().toUpperCase();
    const productType = formData.get('product_type')?.toString() || 'business';
    const targetUrl = formData.get('target_url')?.toString()?.trim() || null;
    const fullName = formData.get('full_name')?.toString()?.trim() || 'صاحب الكارت';
    const jobTitle = formData.get('job_title')?.toString()?.trim() || null;
    const company = formData.get('company')?.toString()?.trim() || null;
    const phone = formData.get('phone')?.toString()?.trim() || null;
    const whatsapp = formData.get('whatsapp')?.toString()?.trim() || null;
    const email = formData.get('email')?.toString()?.trim() || null;

    if (!code) {
      return { success: false, error: 'كود الكارت غير صالح' };
    }

    // 1. Fetch card using supabaseAdmin
    const { data: card, error: cardErr } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('code', code)
      .single();

    if (cardErr || !card) {
      return { success: false, error: 'الكارت غير موجود في النظام' };
    }

    if (card.status === 'active' && card.owner_id && card.owner_id !== user.id) {
      return { success: false, error: 'هذا الكارت مسجل بالفعل لمستخدم آخر' };
    }

    // 2. Update card ownership and status
    const { error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({
        owner_id: user.id,
        status: 'active',
        product: productType,
        target_url: productType === 'review' ? targetUrl : null,
      })
      .eq('id', card.id);

    if (updateErr) {
      console.error('Card update error:', updateErr);
      return { success: false, error: 'فشل تحديث بيانات الكارت' };
    }

    // 3. If business, create or update business_cards record
    let slug = '';
    if (productType === 'business') {
      slug = (fullName ? fullName : 'card')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      // Check if business_card already exists for this card_id
      const { data: existingBc } = await supabaseAdmin
        .from('business_cards')
        .select('slug')
        .eq('card_id', card.id)
        .single();

      if (existingBc?.slug) {
        slug = existingBc.slug;
        await supabaseAdmin
          .from('business_cards')
          .update({
            full_name: fullName,
            job_title: jobTitle,
            company,
            phone,
            whatsapp,
            email,
            is_active: true,
          })
          .eq('card_id', card.id);
      } else {
        const { error: bcErr } = await supabaseAdmin.from('business_cards').insert({
          card_id: card.id,
          slug,
          full_name: fullName,
          job_title: jobTitle,
          company,
          phone,
          whatsapp,
          email,
          is_active: true,
        });

        if (bcErr) {
          console.error('Business card insert error:', bcErr);
        }
      }
    }

    return { success: true, slug };
  } catch (err: any) {
    console.error('activateCardAction error:', err);
    return { success: false, error: err.message || 'حدث خطأ غير متوقع أثناء تفعيل الكارت' };
  }
}
