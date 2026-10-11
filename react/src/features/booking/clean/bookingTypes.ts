import type {
  CategoryCode,
  OptionsResponse,
  OptionsVehicleItem,
  QuoteResponse,
} from "../../../contracts/fare-system";

export interface BookingEntryParams {
  category: CategoryCode;
  product?: string;
  trip?: "one_way" | "round_trip";
  car?: string;
  passengers?: number;
}

export interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  pickup_address: string;
  drop_address: string;
  flight_train_number: string;
  notes: string;
}

export interface SelectedCarState {
  vehicle: OptionsVehicleItem;
  quote: QuoteResponse;
}

export interface ReconfirmationState {
  isOpen: boolean;
  freshQuote: QuoteResponse;
  oldTotal: number;
}
