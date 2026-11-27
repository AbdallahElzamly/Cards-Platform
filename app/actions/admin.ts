'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import {
  BusinessCard,
  Card,
  CardProduct,
  CardSocialLinks,
  CardStatus,
  CardSurfaceTheme,
  CardWithDetails,
  Company,
} from '@/types/smart-cards';

function normalizeUrl(raw: string | null | undefined): string | undefined {
  const val = (raw || '').trim();
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  return `https://${val}`;
}

function getErrMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

async function getAdminUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return null;
    if (!isSuperAdminEmail(user.email)) return null;
    return user;
  } catch (err) {
    console.error('getAdminUser error:', err);
    return null;
  }
}

function generateUnambiguousCode(existingCodes: Set<string>): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
}

export async function provisionIndividualClientCardAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  slug?: string;
}> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return { success: false, error: 'غير مصرح بالدخول (مشرف النظام فقط).' };
  }

  try {
    const fullName = (formData.get('full_name')?.toString() || '').trim();
    if (!fullName) {
      return { success: false, error: 'يرجى إدخال اسم العميل.' };
    }

    const jobTitle = (formData.get('job_title')?.toString() || '').trim() || null;
    const company = (formData.get('company')?.toString() || '').trim() || null;
    const bio = (formData.get('bio')?.toString() || '').trim() || null;
    const phone = (formData.get('phone')?.toString() || '').trim() || null;
    const phone2 = (formData.get('phone2')?.toString() || '').trim() || undefined;
    const whatsapp = (formData.get('whatsapp')?.toString() || '').trim() || phone || null;
    const email = (formData.get('email')?.toString() || '').trim() || null;
    const website = normalizeUrl(formData.get('website')?.toString()) || null;
    const vodafoneCash = (formData.get('vodafone_cash')?.toString() || '').trim() || null;
    const instapayUrl = normalizeUrl(formData.get('instapay_url')?.toString()) || null;
    const avatarUrl = (formData.get('avatar_url')?.toString() || '').trim() || null;
    const surfaceTheme =
      (formData.get('surface_theme')?.toString() as CardSurfaceTheme) || 'obsidian';
    const customSlugInput = (formData.get('custom_slug')?.toString() || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    const { data: existingCards } = await supabaseAdmin.from('cards').select('code');
    const existingCodes = new Set(
      ((existingCards || []) as Array<{ code: string }>).map((c) => c.code)
    );
    const code = generateUnambiguousCode(existingCodes);

    const asciiFromName = fullName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = customSlugInput || asciiFromName || `vip-${code.toLowerCase()}`;

    const { data: slugCollision } = await supabaseAdmin
      .from('business_cards')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (slugCollision) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const socialLinks: CardSocialLinks = {
      phone2,
      linkedin: normalizeUrl(formData.get('linkedin')?.toString()),
      facebook: normalizeUrl(formData.get('facebook')?.toString()),
      instagram: normalizeUrl(formData.get('instagram')?.toString()),
      tiktok: normalizeUrl(formData.get('tiktok')?.toString()),
      telegram: normalizeUrl(formData.get('telegram')?.toString()),
      location_url: normalizeUrl(formData.get('location_url')?.toString()),
      surface_theme: surfaceTheme,
      admin_provisioned: true,
    };

    const { data: createdCard, error: cardErr } = await supabaseAdmin
      .from('cards')
      .insert({
        code,
        owner_id: adminUser.id,
        product: 'business',
        status: 'active',
        batch_name: 'VIP-Individuals',
      })
      .select('*')
      .single();

    if (cardErr || !createdCard) throw cardErr;

    const { error: bcErr } = await supabaseAdmin.from('business_cards').insert({
      card_id: createdCard.id,
      slug,
      full_name: fullName,
      job_title: jobTitle,
      company,
      bio,
      phone,
      whatsapp,
      email,
      website,
      vodafone_cash: vodafoneCash,
      instapay_url: instapayUrl,
      avatar_url: avatarUrl,
      theme_color: '#181818',
      social_links: socialLinks,
      is_active: true,
    });

    if (bcErr) throw bcErr;

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath(`/c/${slug}`);

    return { success: true, code, slug };
  } catch (err: unknown) {
    console.error('provisionIndividualClientCardAction error:', err);
    return { success: false, error: getErrMsg(err, 'تعذر تجهيز كارت العميل.') };
  }
}

export async function generateBatchAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; count?: number }> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return { success: false, error: 'غير مصرح بالدخول (مشرف النظام فقط).' };
  }

  const product = (formData.get('product')?.toString() || 'business') as CardProduct;
  const batchName = formData.get('batch_name')?.toString()?.trim() || `Batch-${Date.now()}`;
  const targetUrl = normalizeUrl(formData.get('target_url')?.toString()) || null;
  const quantity = parseInt(formData.get('quantity')?.toString() || '10', 10);

  if (quantity < 1 || quantity > 500) {
    return { success: false, error: 'الكمية يجب أن تكون بين 1 و 500 كارت.' };
  }

  try {
    const { data: existing } = await supabaseAdmin.from('cards').select('code');
    const existingCodes = new Set(
      ((existing || []) as Array<{ code: string }>).map((c) => c.code)
    );

    const rowsToInsert = [];
    for (let i = 0; i < quantity; i++) {
      const code = generateUnambiguousCode(existingCodes);
      rowsToInsert.push({
        code,
        product,
        status: 'unclaimed',
        batch_name: batchName,
        target_url: product === 'review' ? targetUrl : null,
      });
    }

    const { error: insertErr } = await supabaseAdmin.from('cards').insert(rowsToInsert);
    if (insertErr) throw insertErr;

    revalidatePath('/admin');
    return { success: true, count: quantity };
  } catch (err: unknown) {
    console.error('generateBatchAction error:', err);
    return { success: false, error: getErrMsg(err, 'فشل توليد البطاقات') };
  }
}

export async function updateCardStatusAction(
  cardId: string,
  status: CardStatus,
  targetUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return { success: false, error: 'غير مصرح بالدخول' };
  }

  try {
    const updateData: Record<string, unknown> = { status };
    if (targetUrl !== undefined) {
      updateData.target_url = targetUrl;
    }

    const { error } = await supabaseAdmin.from('cards').update(updateData).eq('id', cardId);
    if (error) throw error;

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrMsg(err, 'فشل التحديث') };
  }
}

export async function createCompanyAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  slug?: string;
  generatedCards?: number;
}> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return { success: false, error: 'غير مصرح بالدخول' };
  }

  try {
    const name = formData.get('name')?.toString()?.trim() || '';
    const contactEmail = formData.get('contact_email')?.toString()?.trim().toLowerCase() || null;
    let batchName = formData.get('batch_name')?.toString()?.trim() || '';
    const fleetQuantity = parseInt(formData.get('fleet_quantity')?.toString() || '0', 10);

    if (!name) {
      return { success: false, error: 'اسم الشركة مطلوب.' };
    }

    const cleanSlugBase =
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'company';

    const rand = Math.floor(1000 + Math.random() * 9000);
    const slug = `${cleanSlugBase}-${rand}`;

    if (!batchName) {
      batchName = `CORP-${cleanSlugBase.toUpperCase().slice(0, 10)}-${rand}`;
    }

    const { error } = await supabaseAdmin.from('companies').insert({
      name,
      slug,
      contact_email: contactEmail,
      batch_name: batchName,
    });

    if (error) throw error;

    let generatedCards = 0;
    if (fleetQuantity > 0 && fleetQuantity <= 500) {
      const { data: existing } = await supabaseAdmin.from('cards').select('code');
      const existingCodes = new Set(
        ((existing || []) as Array<{ code: string }>).map((c) => c.code)
      );

      const cardRows = [];
      for (let i = 0; i < fleetQuantity; i++) {
        const code = generateUnambiguousCode(existingCodes);
        cardRows.push({
          code,
          owner_id: adminUser.id,
          product: 'business' as CardProduct,
          status: 'active' as CardStatus,
          batch_name: batchName,
        });
      }

      const { data: insertedCards, error: cardsErr } = await supabaseAdmin
        .from('cards')
        .insert(cardRows)
        .select('id, code');

      if (cardsErr) throw cardsErr;

      if (insertedCards && insertedCards.length > 0) {
        const bcRows = insertedCards.map((c: { id: string; code: string }, idx: number) => ({
          card_id: c.id,
          slug: `${slug}-emp-${idx + 1}-${c.code.toLowerCase()}`,
          full_name: `${name} — كارت #${idx + 1}`,
          company: name,
          theme_color: '#181818',
          social_links: { surface_theme: 'obsidian', admin_provisioned: true },
          is_active: true,
        }));
        await supabaseAdmin.from('business_cards').insert(bcRows);
        generatedCards = insertedCards.length;
      }
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, slug, generatedCards };
  } catch (err: unknown) {
    console.error('createCompanyAction error:', err);
    return { success: false, error: getErrMsg(err, 'فشل إنشاء مساحة الشركة') };
  }
}

export async function getAdminDashboardData() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return { isAdmin: false, cards: [] as CardWithDetails[], batches: [] as string[], companies: [] as Company[] };
  }

  try {
    const [{ data: cards }, { data: businessCards }, { data: companies }, { data: scans }] =
      await Promise.all([
        supabaseAdmin.from('cards').select('*').order('created_at', { ascending: false }).limit(300),
        supabaseAdmin.from('business_cards').select('*'),
        supabaseAdmin.from('companies').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('scans').select('card_id'),
      ]);

    const bcByCardId = new Map<string, BusinessCard>();
    for (const bc of businessCards || []) {
      bcByCardId.set(bc.card_id, bc as BusinessCard);
    }

    const scanCounts = new Map<string, number>();
    for (const s of scans || []) {
      scanCounts.set(s.card_id, (scanCounts.get(s.card_id) || 0) + 1);
    }

    const typedCards = (cards || []) as Card[];
    const enrichedCards: CardWithDetails[] = typedCards.map((c) => ({
      ...c,
      business_card: bcByCardId.get(c.id) || null,
      scan_count: scanCounts.get(c.id) || 0,
    }));

    const batches = Array.from(
      new Set(typedCards.map((c) => c.batch_name).filter(Boolean))
    ) as string[];

    return {
      isAdmin: true,
      cards: enrichedCards,
      batches,
      companies: (companies || []) as Company[],
    };
  } catch (err) {
    console.error('getAdminDashboardData error:', err);
    return { isAdmin: true, cards: [] as CardWithDetails[], batches: [] as string[], companies: [] as Company[] };
  }
}
