import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isSuperAdminEmail } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB safety cap

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لرفع الصورة.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const cardId = (formData.get('cardId')?.toString() || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'لم يتم إرفاق ملف صورة صالح.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'صيغة الصورة غير مدعومة. يرجى اختيار JPG أو PNG أو WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'حجم الصورة كبير جداً. الحد الأقصى 4 ميجابايت.' },
        { status: 413 }
      );
    }

    // Verify ownership of the target card if cardId is supplied
    if (cardId) {
      const { data: card } = await supabaseAdmin
        .from('cards')
        .select('id, owner_id, batch_name')
        .eq('id', cardId)
        .maybeSingle();

      if (!card) {
        return NextResponse.json({ error: 'البطاقة غير موجودة.' }, { status: 404 });
      }

      let authorized =
        card.owner_id === user.id || isSuperAdminEmail(user.email);

      if (!authorized && user.email && card.batch_name && card.batch_name !== 'SELF_INDIVIDUAL') {
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('batch_name', card.batch_name)
          .ilike('contact_email', user.email.trim())
          .maybeSingle();
        if (company) authorized = true;
      }

      if (!authorized) {
        return NextResponse.json({ error: 'غير مصرح لك بتعديل صورة هذه البطاقة.' }, { status: 403 });
      }
    }

    const ext =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
        ? 'gif'
        : 'jpg';

    const safePrefix = cardId ? cardId.replace(/[^a-zA-Z0-9_-]/g, '') : user.id;
    const filePath = `users/${user.id}/${safePrefix}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error('upload-avatar storage error:', uploadError);
      return NextResponse.json(
        { error: 'تعذر حفظ الصورة على خادم التخزين حالياً.' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error('POST /api/upload-avatar error:', err);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء رفع الصورة.' },
      { status: 500 }
    );
  }
}
