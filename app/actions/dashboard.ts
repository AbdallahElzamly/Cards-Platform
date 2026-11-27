'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CardStatus } from '@/types/smart-cards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

async function getAuthenticatedUser() {
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

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    return null;
  }
}

export async function updateBusinessCardAction(cardId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  try {
    const { data: card } = await supabaseAdmin.from('cards').select('id, owner_id').eq('id', cardId).single();
    if (!card || card.owner_id !== user.id) {
      return { success: false, error: 'غير مسموح بالتعديل' };
    }

    const fullName = formData.get('full_name')?.toString() || '';
    const jobTitle = formData.get('job_title')?.toString() || '';
    const company = formData.get('company')?.toString() || '';
    const bio = formData.get('bio')?.toString() || '';
    const phone = formData.get('phone')?.toString() || '';
    const whatsapp = formData.get('whatsapp')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const website = formData.get('website')?.toString() || '';
    const vodafoneCash = formData.get('vodafone_cash')?.toString() || '';
    const instapayUrl = formData.get('instapay_url')?.toString() || '';
    const themeColor = formData.get('theme_color')?.toString() || '#0F172A';
    const avatarUrl = formData.get('avatar_url')?.toString()?.trim() || null;
    const socialLinksJson = formData.get('social_links_json')?.toString();

    const updatePayload: any = {
      full_name: fullName.trim(),
      job_title: jobTitle.trim(),
      company: company.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      website: website.trim(),
      vodafone_cash: vodafoneCash.trim(),
      instapay_url: instapayUrl.trim(),
      theme_color: themeColor,
    };

    if (avatarUrl !== null) {
      updatePayload.avatar_url = avatarUrl;
    }

    if (socialLinksJson) {
      try {
        updatePayload.social_links = JSON.parse(socialLinksJson);
      } catch (e) {
        console.error('Failed to parse social_links_json:', e);
      }
    }

    const { error } = await supabaseAdmin
      .from('business_cards')
      .update(updatePayload)
      .eq('card_id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('updateBusinessCardAction error:', err);
    return { success: false, error: err.message || 'فشل تحديث الكارت' };
  }
}

export async function updateReviewCardTargetUrlAction(cardId: string, targetUrl: string): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  try {
    const { data: card } = await supabaseAdmin.from('cards').select('id, owner_id').eq('id', cardId).single();
    if (!card || card.owner_id !== user.id) {
      return { success: false, error: 'غير مسموح' };
    }

    const { error } = await supabaseAdmin
      .from('cards')
      .update({ target_url: targetUrl.trim() })
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تحديث الرابط' };
  }
}

export async function updateCardStatusModeAction(cardId: string, status: CardStatus): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  try {
    const { data: card } = await supabaseAdmin.from('cards').select('id, owner_id').eq('id', cardId).single();
    if (!card || card.owner_id !== user.id) {
      return { success: false, error: 'غير مسموح' };
    }

    const { error } = await supabaseAdmin
      .from('cards')
      .update({ status })
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath(`/q/`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تغيير حالة الكارت' };
  }
}

export async function reassignCardCustodyAction(
  cardId: string,
  formData: FormData,
  clearLeads: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  try {
    const { data: card } = await supabaseAdmin.from('cards').select('id, owner_id').eq('id', cardId).single();
    if (!card || card.owner_id !== user.id) {
      return { success: false, error: 'غير مسموح' };
    }

    // 1. Update business card profile details
    const updateRes = await updateBusinessCardAction(cardId, formData);
    if (!updateRes.success) {
      return updateRes;
    }

    // 2. If clearLeads is true, delete leads for this business card
    if (clearLeads) {
      const { data: bc } = await supabaseAdmin.from('business_cards').select('id').eq('card_id', cardId).single();
      if (bc) {
        await supabaseAdmin.from('card_leads').delete().eq('business_card_id', bc.id);
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('reassignCardCustodyAction error:', err);
    return { success: false, error: err.message || 'فشل إعادة تعيين الكارت' };
  }
}
