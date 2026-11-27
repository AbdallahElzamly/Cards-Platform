'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Card, CardProduct, CardStatus, Company } from '@/types/smart-cards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

async function checkIsAdmin() {
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
    if (!user || !user.email) return false;

    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map((e) => e.trim().toLowerCase())
      : ['admin@kuwi.com', 'admin@cards-platform.local'];

    return adminEmails.includes(user.email.toLowerCase());
  } catch (err) {
    console.error('checkIsAdmin error:', err);
    return false;
  }
}

/**
 * Generate unambiguous 6-character uppercase alphanumeric codes (excluding 0, O, 1, I, L)
 */
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

export async function generateBatchAction(formData: FormData): Promise<{ success: boolean; error?: string; count?: number }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'غير مصرح بالدخول (مشرف النظام فقط)' };
  }

  const product = (formData.get('product')?.toString() || 'business') as CardProduct;
  const batchName = formData.get('batch_name')?.toString()?.trim() || `Batch-${Date.now()}`;
  const targetUrl = formData.get('target_url')?.toString()?.trim() || null;
  const quantity = parseInt(formData.get('quantity')?.toString() || '10', 10);

  if (quantity < 1 || quantity > 500) {
    return { success: false, error: 'الكمية يجب أن تكون بين 1 و 500 كارت' };
  }

  try {
    const { data: existing } = await supabaseAdmin.from('cards').select('code');
    const existingCodes = new Set((existing || []).map((c: any) => c.code));

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
  } catch (err: any) {
    console.error('generateBatchAction error:', err);
    return { success: false, error: err.message || 'فشل توليد البطاقات' };
  }
}

export async function updateCardStatusAction(cardId: string, status: CardStatus, targetUrl?: string): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'غير مصرح بالدخول' };
  }

  try {
    const updateData: any = { status };
    if (targetUrl !== undefined) {
      updateData.target_url = targetUrl;
    }

    const { error } = await supabaseAdmin.from('cards').update(updateData).eq('id', cardId);
    if (error) throw error;

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل التحديث' };
  }
}

export async function createCompanyAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'غير مصرح بالدخول' };
  }

  try {
    const name = formData.get('name')?.toString()?.trim() || '';
    const contactEmail = formData.get('contact_email')?.toString()?.trim() || null;
    const batchName = formData.get('batch_name')?.toString()?.trim() || null;

    if (!name) {
      return { success: false, error: 'اسم الشركة مطلوب' };
    }

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabaseAdmin.from('companies').insert({
      name,
      slug,
      contact_email: contactEmail,
      batch_name: batchName,
    });

    if (error) throw error;

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('createCompanyAction error:', err);
    return { success: false, error: err.message || 'فشل إنشاء مساحة الشركة' };
  }
}

export async function getAdminDashboardData(batchFilter?: string, statusFilter?: string, searchQuery?: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { isAdmin: false, cards: [], batches: [], companies: [] };
  }

  try {
    let query = supabaseAdmin.from('cards').select('*').order('created_at', { ascending: false }).limit(200);

    if (batchFilter && batchFilter !== 'ALL') {
      query = query.eq('batch_name', batchFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }
    if (searchQuery) {
      query = query.ilike('code', `%${searchQuery}%`);
    }

    const { data: cards } = await query;
    const { data: allCards } = await supabaseAdmin.from('cards').select('batch_name');
    const { data: companies } = await supabaseAdmin.from('companies').select('*').order('created_at', { ascending: false });

    const batches = Array.from(new Set((allCards || []).map((c: any) => c.batch_name).filter(Boolean)));

    return {
      isAdmin: true,
      cards: cards || [],
      batches,
      companies: (companies || []) as Company[],
    };
  } catch (err) {
    console.error('getAdminDashboardData error:', err);
    return { isAdmin: true, cards: [], batches: [], companies: [] };
  }
}
