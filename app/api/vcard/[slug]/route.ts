import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseSocialLinks } from '@/types/smart-cards';

function escapeVCardText(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export async function GET(
  _request: NextRequest,
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

  const socials = parseSocialLinks(card.social_links);
  const visibleFields = socials.visible_fields || {};
  const isFieldVisible = (key: string) => visibleFields[key] !== false;

  const phone = card.phone && isFieldVisible('phone') ? String(card.phone).trim() : '';
  const phone2 = socials.phone2 && isFieldVisible('phone2') ? String(socials.phone2).trim() : '';
  const whatsapp =
    card.whatsapp && isFieldVisible('whatsapp') && card.whatsapp !== phone && card.whatsapp !== phone2
      ? String(card.whatsapp).trim()
      : '';
  const email = card.email && isFieldVisible('email') ? String(card.email).trim() : '';
  const website = card.website && isFieldVisible('website') ? String(card.website).trim() : '';
  const bio = card.bio && isFieldVisible('bio') ? String(card.bio).trim() : '';

  const linkedin = socials.linkedin && isFieldVisible('linkedin') ? String(socials.linkedin).trim() : '';
  const instagram = socials.instagram && isFieldVisible('instagram') ? String(socials.instagram).trim() : '';
  const facebook = socials.facebook && isFieldVisible('facebook') ? String(socials.facebook).trim() : '';

  const safeName = escapeVCardText(card.full_name || 'KUWI Contact');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${safeName}`,
    `N;CHARSET=UTF-8:${safeName};;;;`,
    card.company ? `ORG;CHARSET=UTF-8:${escapeVCardText(card.company)}` : '',
    card.job_title ? `TITLE;CHARSET=UTF-8:${escapeVCardText(card.job_title)}` : '',
    phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
    phone2 ? `TEL;TYPE=WORK,VOICE:${phone2}` : '',
    whatsapp ? `TEL;TYPE=MSG:${whatsapp}` : '',
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    website ? `URL:${website}` : '',
    linkedin ? `URL;TYPE=LinkedIn:${linkedin}` : '',
    instagram ? `URL;TYPE=Instagram:${instagram}` : '',
    facebook ? `URL;TYPE=Facebook:${facebook}` : '',
    bio ? `NOTE;CHARSET=UTF-8:${escapeVCardText(bio)}` : '',
    'END:VCARD',
  ].filter(Boolean);

  const vcard = lines.join('\r\n');

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(slug)}.vcf"`,
    },
  });
}
