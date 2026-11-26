export type LoyaltyTier = 'standard' | 'silver' | 'gold';

export type VoucherStatus = 'active' | 'redeemed' | 'expired';

export interface LoyaltyProgram {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  logo_url: string | null;
  primary_color: string;
  stamps_required: number;
  min_bill_egp: number;
  reward_title: string;
  reward_terms: string;
  cooldown_hours: number;
  daily_pin_hash: string;
  daily_pin_display: string;
  pin_rotated_at: string;
  is_active: boolean;
  v2_scratch_enabled: boolean;
  v2_double_stamp_active: boolean;
  created_at: string;
}

export interface LoyaltyMember {
  id: string;
  program_id: string;
  first_name: string;
  phone_hash: string;
  phone_last4: string;
  phone?: string | null;
  current_stamps: number;
  total_visits: number;
  total_redemptions: number;
  tier: LoyaltyTier;
  last_visit_at: string | null;
  consent_accepted_at: string;
  created_at: string;
}

// Safe client-side member representation (excludes phone_hash)
export type PublicLoyaltyMember = Omit<LoyaltyMember, 'phone_hash'>;

// Safe client-side program representation (excludes PINs and owner_id)
export type PublicLoyaltyProgram = Omit<
  LoyaltyProgram,
  'daily_pin_hash' | 'daily_pin_display' | 'owner_id' | 'pin_rotated_at'
>;

export interface LoyaltyVisit {
  id: string;
  program_id: string;
  member_id: string;
  table_code: string | null;
  stamps_awarded: number;
  stamp_number_after: number;
  ip_hash: string | null;
  created_at: string;
}

export interface LoyaltyVoucher {
  id: string;
  program_id: string;
  member_id: string;
  voucher_code: string;
  reward_title: string;
  status: VoucherStatus;
  issued_at: string;
  redeemed_at: string | null;
  redeemed_by_table: string | null;
}

export interface LoyaltyPinAttempt {
  id: number;
  program_id: string;
  actor_key: string;
  attempted_at: string;
}

export interface LoyaltySessionPayload {
  m: string;
  p: string;
  iat: number;
}
