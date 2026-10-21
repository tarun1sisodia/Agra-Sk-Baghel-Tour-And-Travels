export interface PromoCodeItem {
  id: string;
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validTo: string | null;
  allowGroupVehicles: boolean;
  isBroadcast: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeInput {
  code: string;
  discountAmount: number;
  minTotal?: number;
  description: string;
  isActive?: boolean;
  maxRedemptions?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  allowGroupVehicles?: boolean;
  isBroadcast?: boolean;
}

export type UpdatePromoCodeInput = Partial<CreatePromoCodeInput>;

export interface FeaturedPromo {
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  allowGroupVehicles: boolean;
}

export interface PromoValidateRequest {
  code: string;
  subtotal: number;
  vehicleTier?: string;
}

export interface PromoValidateResponse {
  valid: boolean;
  code: string;
  discount: number;
  description?: string;
  message?: string;
}
