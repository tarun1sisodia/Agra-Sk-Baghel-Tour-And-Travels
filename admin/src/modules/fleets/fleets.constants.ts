import { VEHICLE_GROUPS, type VehicleTier } from "@/contracts/vehicle-tiers";

export interface FleetSpec {
  id: VehicleTier;
  label: string;
  name: string;
  seats: string;
  bags: string;
  ac: string;
  icon: string;
  defaultIncrement: number;
}

export const CANONICAL_FLEET_SPECS: Partial<Record<VehicleTier, FleetSpec>> = {
  sedan: {
    id: "sedan",
    label: "Sedan",
    name: "Maruti Dzire / Honda City",
    seats: "4 Passengers",
    bags: "2-3 Bags",
    ac: "Full Climate Control",
    icon: "Car",
    defaultIncrement: 0,
  },
  suv: {
    id: "suv",
    label: "SUV",
    name: "Maruti Ertiga / Innova Crysta",
    seats: "6-7 Passengers",
    bags: "3-4 Bags",
    ac: "Dual AC Vents",
    icon: "Car",
    defaultIncrement: 0,
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    name: "Toyota Camry / Vellfire",
    seats: "4-6 Passengers",
    bags: "3-4 Bags",
    ac: "Multi-Zone Climate",
    icon: "Shield",
    defaultIncrement: 0,
  },
  tempo_traveller: {
    id: "tempo_traveller",
    label: "Tempo Traveller",
    name: "Force Traveller / Urbania",
    seats: "12-17 Passengers",
    bags: "10-12 Bags",
    ac: "Roof-Mounted AC",
    icon: "Bus",
    defaultIncrement: 0,
  },
  dzire: {
    id: "dzire",
    label: "Maruti Dzire",
    name: "Maruti Suzuki Dzire",
    seats: "4 Passengers",
    bags: "2 Bags",
    ac: "Dual AC Vents",
    icon: "Car",
    defaultIncrement: 0,
  },
  city: {
    id: "city",
    label: "Honda City",
    name: "Honda City Sedan",
    seats: "4 Passengers",
    bags: "3 Bags",
    ac: "Full Climate Control",
    icon: "Car",
    defaultIncrement: 0,
  },
  ertiga: {
    id: "ertiga",
    label: "Ertiga",
    name: "Maruti Ertiga Hybrid",
    seats: "6 Passengers",
    bags: "3 Bags",
    ac: "Dual AC Vents",
    icon: "Car",
    defaultIncrement: 0,
  },
  "innova-crysta": {
    id: "innova-crysta",
    label: "Innova Crysta",
    name: "Toyota Innova Crysta VIP",
    seats: "7 Passengers",
    bags: "4 Bags",
    ac: "Triple-Zone Climate",
    icon: "Shield",
    defaultIncrement: 0,
  },
  fortuner: {
    id: "fortuner",
    label: "Toyota Fortuner",
    name: "Toyota Fortuner 4x4",
    seats: "7 Passengers",
    bags: "4 Bags",
    ac: "Triple-Zone Climate",
    icon: "Shield",
    defaultIncrement: 0,
  },
  camry: {
    id: "camry",
    label: "Toyota Camry",
    name: "Toyota Camry Executive Hybrid",
    seats: "4 Passengers",
    bags: "3 Bags",
    ac: "Multi-Zone Nanoe AC",
    icon: "Shield",
    defaultIncrement: 0,
  },
  vellfire: {
    id: "vellfire",
    label: "Toyota Vellfire",
    name: "Toyota Vellfire Ultra Luxury MPV",
    seats: "6 Passengers",
    bags: "4 Bags",
    ac: "Multi-Zone Nanoe AC",
    icon: "Crown",
    defaultIncrement: 0,
  },
  "traveller-12": {
    id: "traveller-12",
    label: "Traveller 12S",
    name: "Force Traveller 12-Seater",
    seats: "12 Passengers",
    bags: "10 Bags",
    ac: "Roof AC",
    icon: "Bus",
    defaultIncrement: 0,
  },
  "traveller-17": {
    id: "traveller-17",
    label: "Traveller 17S",
    name: "Force Traveller 17-Seater",
    seats: "17 Passengers",
    bags: "12 Bags",
    ac: "Roof AC",
    icon: "Bus",
    defaultIncrement: 0,
  },
  "urbania-13": {
    id: "urbania-13",
    label: "Urbania 13S",
    name: "Force Urbania 13-Seater VIP",
    seats: "13 Passengers",
    bags: "10 Bags",
    ac: "Individual Jet AC",
    icon: "Crown",
    defaultIncrement: 0,
  },
};

export const FLEET_KEYS: readonly VehicleTier[] = VEHICLE_GROUPS;

export const FLEET_LABELS: Record<string, string> = {
  sedan: "Sedan (4 Seater)",
  suv: "SUV (6-7 Seater)",
  luxury: "Luxury (4-6 Seater)",
  tempo_traveller: "Tempo Traveller (12-17 Seater)",
  dzire: "Maruti Dzire",
  city: "Honda City",
  ertiga: "Maruti Ertiga",
  "innova-crysta": "Innova Crysta",
  fortuner: "Toyota Fortuner",
  camry: "Toyota Camry",
  vellfire: "Toyota Vellfire",
  "traveller-12": "Traveller 12-Seater",
  "traveller-17": "Traveller 17-Seater",
  "urbania-13": "Urbania 13-Seater",
};

export function getFleetSpec(k: VehicleTier): FleetSpec {
  return (
    CANONICAL_FLEET_SPECS[k] ?? {
      id: k,
      label: String(k),
      name: String(k),
      seats: "4+",
      bags: "2+",
      ac: "AC",
      icon: "Car",
      defaultIncrement: 0,
    }
  );
}
