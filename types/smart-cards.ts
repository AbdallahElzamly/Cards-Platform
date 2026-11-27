export type CardProduct = 'business' | 'review' | 'loyalty';

export type CardStatus = 'unclaimed' | 'active' | 'suspended' | 'lost';

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
  social_links: Record<string, any>;
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
