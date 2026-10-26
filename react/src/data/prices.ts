export const prices = {
  currency: "INR",
  fleet_per_km: {
    sedan: 10,
    ertiga: 14,
    innova_crysta: 18,
    tempo_traveller: 25,
    urbania: 34,
  },
  routes_oneway: {
    delhi_igi: 3499,
    jaipur: 3699,
    mathura: 2200,
    gwalior: 3000,
    fatehpur_sikri: 1800,
    lucknow: 4500,
    ayodhya: 6500,
    khatushyamji: 4800,
    agra_cantt: 699,
  },
  local_packages: { "8h_80km": 1900, "12h_120km": 2200 },
  tours: { same_day_agra: 3499, taj_sunrise: 5200, mathura_vrindavan: 4200 },
} as const;

export type SitePrices = typeof prices;
