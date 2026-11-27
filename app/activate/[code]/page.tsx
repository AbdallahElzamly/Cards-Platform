import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import ActivateCardClient from '@/components/cards/ActivateCardClient';
import { BusinessCard, Card, parseSocialLinks } from '@/types/smart-cards';

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ActivateCardPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  // 1. Fetch card + any pre-provisioned business_card
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (error || !card) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">الكارت غير مسجل في النظام</h1>
          <p className="text-sm text-neutral-600 mb-6">
            الكود ({normalizedCode}) غير موجود في قاعدة البيانات. تأكد من صحة الكود المطبوع على البطاقة.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 bg-[#181818] text-white text-sm font-semibold rounded-xl"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (card.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">هذا الكارت موقوف حالياً</h1>
          <p className="text-sm text-neutral-600">تواصل مع الإدارة لإعادة التفعيل.</p>
        </div>
      </div>
    );
  }

  const { data: existingBc } = await supabaseAdmin
    .from('business_cards')
    .select('*')
    .eq('card_id', card.id)
    .maybeSingle();

  // 2. Check current authenticated user if any
  let currentUser: { id: string; email?: string | null } | null = null;
  const env = getServerSupabaseEnv();
  if (env.isAuthConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUser = user;
    } catch {
      // unauthenticated visitor
    }
  }

  const socials = parseSocialLinks(existingBc?.social_links);
  const isAdminProvisioned = Boolean(socials.admin_provisioned);

  // If the authenticated owner (or Super Admin) revisits an already-activated card, send them straight to /dashboard
  if (
    card.status === 'active' &&
    card.owner_id &&
    !isAdminProvisioned &&
    currentUser &&
    (currentUser.id === card.owner_id || isSuperAdminEmail(currentUser.email))
  ) {
    redirect('/dashboard');
  }

  // If card is already owned by a real client (and not admin-provisioned waiting for client claim)
  if (
    card.status === 'active' &&
    card.owner_id &&
    !isAdminProvisioned &&
    (!currentUser || (currentUser.id !== card.owner_id && !isSuperAdminEmail(currentUser.email)))
  ) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 text-center flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-neutral-950">هذا الكارت مفعل بالفعل</h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            إذا كنت مالك هذا الكارت، سجل الدخول إلى لوحة التحكم لتعديل بياناتك في أي وقت.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {existingBc?.slug && (
              <Link
                href={`/c/${existingBc.slug}`}
                className="min-h-[46px] py-3 px-5 bg-[#181818] text-white font-semibold rounded-xl text-sm flex items-center justify-center"
              >
                فتح الكارت الرقمي
              </Link>
            )}
            <Link
              href="/auth/login?redirect=/dashboard"
              className="min-h-[46px] py-3 px-5 bg-neutral-100 text-neutral-900 font-semibold rounded-xl text-sm flex items-center justify-center"
            >
              تسجيل الدخول لتعديل الكارت
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ActivateCardClient
      card={card as Card}
      code={normalizedCode}
      existingBusinessCard={(existingBc as BusinessCard) || null}
      currentUserEmail={currentUser?.email || null}
    />
  );
}
