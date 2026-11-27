'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export async function activateCardAction(formData: FormData): Promise<{ success: boolean; error?: string; slug?: string }> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
      return {
        success: false,
        error: 'خطأ إعدادات النظام: مفتاح الخدمة SUPABASE_SERVICE_ROLE_KEY غير مضبوط في بيئة العمل (Environment Variables). يرجى إضافته في إعدادات Vercel.',
      };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
      return { success: false, error: 'يجب تسجيل الدخول لتفعيل الكارت' };
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
    const avatarUrl = formData.get('avatar_url')?.toString()?.trim() || null;

    if (!code) {
      return { success: false, error: 'كود الكارت غير صالح' };
    }

    // 1. Fetch card using admin client
    const { data: card, error: cardErr } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('code', code)
      .single();

    if (cardErr || !card) {
      return { success: false, error: `الكارت غير موجود في النظام (${cardErr?.message || 'not found'})` };
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
      console.error('Card update error details:', updateErr);
      return {
        success: false,
        error: `فشل تحديث بيانات الكارت: ${updateErr.message} (code: ${updateErr.code})`,
      };
    }

    // 3. If business, create or update business_cards record
    let slug = '';
    if (productType === 'business') {
      slug = (fullName ? fullName : 'card')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      const { data: existingBc } = await supabaseAdmin
        .from('business_cards')
        .select('slug')
        .eq('card_id', card.id)
        .single();

      if (existingBc?.slug) {
        slug = existingBc.slug;
        const updatePayload: any = {
          full_name: fullName,
          job_title: jobTitle,
          company,
          phone,
          whatsapp,
          email,
          is_active: true,
        };
        if (avatarUrl) {
          updatePayload.avatar_url = avatarUrl;
        }

        const { error: bcUpdateErr } = await supabaseAdmin
          .from('business_cards')
          .update(updatePayload)
          .eq('card_id', card.id);

        if (bcUpdateErr) {
          console.error('Business card update error:', bcUpdateErr);
        }
      } else {
        const insertPayload: any = {
          card_id: card.id,
          slug,
          full_name: fullName,
          job_title: jobTitle,
          company,
          phone,
          whatsapp,
          email,
          is_active: true,
        };
        if (avatarUrl) {
          insertPayload.avatar_url = avatarUrl;
        }

        const { error: bcErr } = await supabaseAdmin.from('business_cards').insert(insertPayload);

        if (bcErr) {
          console.error('Business card insert error:', bcErr);
          return {
            success: false,
            error: `فشل إنشاء تفاصيل كارت الأعمال: ${bcErr.message} (code: ${bcErr.code})`,
          };
        }
      }
    }

    return { success: true, slug };
  } catch (err: any) {
    console.error('activateCardAction error:', err);
    return { success: false, error: err.message || 'حدث خطأ غير متوقع أثناء تفعيل الكارت' };
  }
}
