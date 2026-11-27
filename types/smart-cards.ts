export type CardProduct = 'business' | 'review' | 'loyalty';

export type CardStatus = 'unclaimed' | 'active' | 'suspended' | 'lost';

export type CardSurfaceTheme = 'obsidian' | 'pearl' | 'titanium' | 'emerald' | 'amber';

export interface CardSocialLinks {
  phone2?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  x?: string;
  youtube?: string;
  github?: string;
  behance?: string;
  location_url?: string;
  custom_link_title?: string;
  custom_link_url?: string;
  surface_theme?: CardSurfaceTheme;
  admin_provisioned?: boolean;
  visible_fields?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface Card {
  id: string;
  code: string;
  owner_id: string | null;
  product: CardProduct;
  status: CardStatus;
  target_url: string | null;
  batch_name: string | null;
  created_at: string;
}

export interface BusinessCard {
  id: string;
  card_id: string;
  slug: string;
  full_name: string;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_color: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instapay_url: string | null;
  vodafone_cash: string | null;
  social_links: CardSocialLinks;
  is_active: boolean;
  created_at: string;
}

export interface CardLead {
  id: string;
  business_card_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_note: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  card_id: string;
  scanned_at: string;
  device_type: string | null;
  city: string | null;
  country: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  batch_name: string | null;
  created_at: string;
}

export interface CardWithDetails extends Card {
  business_card?: BusinessCard | null;
  scan_count?: number;
  leads?: CardLead[];
}

export function parseSocialLinks(raw: unknown): CardSocialLinks {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw as CardSocialLinks;
}
