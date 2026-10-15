import { maskEmail, maskPhone } from "../lib/utils.ts";

export interface UnmaskData {
  customerPhone: string;
  customerEmail: string | null;
}

export interface UnmaskState {
  unmasked: boolean;
  unmaskedData: UnmaskData | null;
  unmasking: boolean;
  error: string | null;
}

export const initialUnmaskState: UnmaskState = {
  unmasked: false,
  unmaskedData: null,
  unmasking: false,
  error: null,
};

export function startUnmasking(prev: UnmaskState): UnmaskState {
  return {
    ...prev,
    unmasking: true,
    error: null,
  };
}

export function applyUnmaskSuccess(data: UnmaskData): UnmaskState {
  return {
    unmasked: true,
    unmaskedData: data,
    unmasking: false,
    error: null,
  };
}

export function applyUnmaskFailure(errorMsg: string): UnmaskState {
  return {
    unmasked: false,
    unmaskedData: null,
    unmasking: false,
    error: errorMsg,
  };
}

export function resetUnmaskState(): UnmaskState {
  return {
    unmasked: false,
    unmaskedData: null,
    unmasking: false,
    error: null,
  };
}

export function resolveDisplayContact(options: {
  unmasked: boolean;
  unmaskedData: UnmaskData | null;
  rawPhone: string;
  rawEmail?: string | null;
}): { phone: string; email: string } {
  const { unmasked, unmaskedData, rawPhone, rawEmail } = options;
  if (unmasked && unmaskedData) {
    return {
      phone: unmaskedData.customerPhone,
      email: unmaskedData.customerEmail || "—",
    };
  }
  return {
    phone: maskPhone(rawPhone),
    email: rawEmail ? maskEmail(rawEmail) : "—",
  };
}
