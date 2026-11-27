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

  // Build valid vCard v3.0 format
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.full_name}`,
    `N:;${card.full_name};;;`,
    card.company ? `ORG:${card.company}` : '',
    card.job_title ? `TITLE:${card.job_title}` : '',
    card.phone ? `TEL;TYPE=CELL,VOICE:${card.phone}` : '',
    card.whatsapp ? `TEL;TYPE=WORK,VOICE:${card.whatsapp}` : '',
    card.email ? `EMAIL;TYPE=INTERNET:${card.email}` : '',
    card.website ? `URL:${card.website}` : '',
    card.bio ? `NOTE:${card.bio.replace(/\n/g, '\\n')}` : '',
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
