import type {
  CategoryCode,
  OptionsResponse,
  OptionsVehicleItem,
  QuoteResponse,
  BookingEntryParams,
} from "../../../contracts/fare-system.js";

export type { BookingEntryParams };

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
