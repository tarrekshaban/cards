/**
 * Types for credit cards, benefits, and redemption tracking.
 */

export type BenefitSchedule =
  | 'calendar_year'
  | 'card_year'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'one_time'

export interface Card {
  id: string
  name: string
  issuer: string
  image_url?: string
  annual_fee?: number
  benefits_count?: number
  created_at?: string
  updated_at?: string
}

export interface Benefit {
  id: string
  card_id: string
  name: string
  description?: string
  value: number
  schedule: BenefitSchedule
  created_at?: string
  updated_at?: string
}

export interface CardWithBenefits extends Card {
  benefits: Benefit[]
}

export interface UserCard {
  id: string
  user_id: string
  card_id: string
  card_open_date: string
  nickname?: string
  card: Card
  created_at?: string
  updated_at?: string
}

export interface AvailableBenefit {
  benefit: Benefit
  user_card: UserCard
  is_redeemed: boolean
  resets_at: string | null
  auto_redeem: boolean
  hidden: boolean
  amount_redeemed: number
  amount_remaining: number
}

export interface UserCardWithBenefits extends UserCard {
  benefits: AvailableBenefit[]
}

export interface BenefitRedemption {
  id: string
  user_card_id: string
  benefit_id: string
  redeemed_at: string
  amount_redeemed: number
  period_year: number
  period_month?: number
  period_quarter?: number
  period_half?: number
}

export interface BenefitSummary {
  benefit: Benefit
  redeemed_count: number
  total_count: number
  redeemed_value: number
  total_value: number
}

export interface CardSummary {
  user_card: UserCard
  year: number
  benefits: BenefitSummary[]
  total_redeemed: number
  total_available: number
}

// Request types
export interface CreateCardRequest {
  name: string
  issuer: string
  image_url?: string
  annual_fee?: number
}

export interface UpdateCardRequest {
  name?: string
  issuer?: string
  image_url?: string
  annual_fee?: number
}

export interface CreateBenefitRequest {
  name: string
  description?: string
  value: number
  schedule: BenefitSchedule
}

export interface UpdateBenefitRequest {
  name?: string
  description?: string
  value?: number
  schedule?: BenefitSchedule
}

export interface AddUserCardRequest {
  card_id: string
  card_open_date: string
  nickname?: string
}

export interface UpdateUserCardRequest {
  card_open_date?: string
  nickname?: string
}

export interface AnnualSummary {
  year: number
  total_redeemed: number
  total_available: number
  outstanding: number
  redeemed_count: number
  total_count: number
  total_annual_fees: number
}

export interface BenefitPreference {
  id: string
  user_card_id: string
  benefit_id: string
  auto_redeem: boolean
  hidden: boolean
  created_at?: string
  updated_at?: string
}

export interface UpdateBenefitPreferenceRequest {
  auto_redeem?: boolean
  hidden?: boolean
}

export interface RedeemBenefitRequest {
  amount?: number
}
