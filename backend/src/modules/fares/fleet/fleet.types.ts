export type PublicFleetVehicle = {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
};

export type FleetGroupVehicle = {
  id: string;
  make: string;
  modelName: string;
  displayName: string;
  groupCode: string;
  groupName: string;
  seats: number;
  bags: number;
  perKm: number | null;
  imageUrl: string | null;
  active: boolean;
};

export type FleetGroup = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  vehicles: FleetGroupVehicle[];
};

export type FleetQueryResult = {
  version: string;
  vehicles: PublicFleetVehicle[];
  groups?: FleetGroup[];
};

