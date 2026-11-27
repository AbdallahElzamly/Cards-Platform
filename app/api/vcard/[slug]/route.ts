import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const { data: card, error } = await supabaseAdmin
    .from('business_cards')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !card || !card.is_active) {
    return NextResponse.json({ error: 'Business card not found' }, { status: 404 });
  }

  const visibleFields = (card.social_links as any)?.visible_fields || {};
  const isFieldVisible = (key: string) => visibleFields[key] !== false;

  const phone = card.phone && isFieldVisible('phone') ? card.phone : '';
  const whatsapp = card.whatsapp && isFieldVisible('whatsapp') ? card.whatsapp : '';
  const email = card.email && isFieldVisible('email') ? card.email : '';
  const website = card.website && isFieldVisible('website') ? card.website : '';
  const bio = card.bio && isFieldVisible('bio') ? card.bio : '';

  // Build valid vCard v3.0 format respecting privacy toggles
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.full_name}`,
    `N:;${card.full_name};;;`,
    card.company ? `ORG:${card.company}` : '',
    card.job_title ? `TITLE:${card.job_title}` : '',
    phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
    whatsapp ? `TEL;TYPE=WORK,VOICE:${whatsapp}` : '',
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    website ? `URL:${website}` : '',
    bio ? `NOTE:${bio.replace(/\n/g, '\\n')}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.vcf"`,
    },
  });
}
