import type { CategoryCode, VehicleGroupCode, QuoteLine } from "../../contracts/fare-system.js";

export interface ExtraChargeRow {
  id?: string;
  category: CategoryCode;
  vehicle_group_code?: VehicleGroupCode | null;
  route_id?: string | null;
  local_package_id?: string | null;
  transfer_id?: string | null;
  tour_package_id?: string | null;
  label: string;
  amount?: number | null;
  is_active: boolean;
}

export interface ExtraChargeResolutionResult {
  lines: QuoteLine[];
  totalExtraAmount: number;
  messages: string[];
}

export function resolveApplicableExtraCharges(params: {
  category: CategoryCode;
  vehicleGroupCode: VehicleGroupCode;
  productId?: string | null;
  extraCharges: ExtraChargeRow[];
}): ExtraChargeResolutionResult {
  const { category, vehicleGroupCode, productId, extraCharges } = params;

  const lines: QuoteLine[] = [];
  const messages: string[] = [];
  let totalExtraAmount = 0;

  for (const row of extraCharges) {
    if (!row.is_active) continue;
    if (row.category !== category) continue;

    // Vehicle group check: null/empty means all vehicles in category
    if (row.vehicle_group_code && row.vehicle_group_code !== vehicleGroupCode) {
      continue;
    }

    // Product check: null/empty means all products in category
    const rowProductId =
      row.route_id ?? row.local_package_id ?? row.transfer_id ?? row.tour_package_id;
    if (rowProductId && rowProductId !== productId) {
      continue;
    }

    if (row.amount && row.amount > 0) {
      lines.push({
        code: "extra_charge",
        label: row.label,
        amount: row.amount,
      });
      totalExtraAmount += row.amount;
    } else {
      messages.push(row.label);
    }
  }

  return { lines, totalExtraAmount, messages };
}
