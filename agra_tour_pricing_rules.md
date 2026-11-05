# Agra SK Baghel Tour & Travels — Tour, Outstation, Local & Transfer Pricing Rules

## 1. Purpose

Use this document as the source of truth when creating or configuring tour packages, outstation services, local sightseeing tours, and transfer services in the admin system.

**Important:** Keep each service category separate. Do not mix tour-package formulas with fixed outstation or local-tour prices. Vehicle-specific prices must be associated with the correct vehicle model/category.

---

## 2. Tour Packages

### Pricing rule

For a multi-day tour package:

```text
Billable KM = Number of Tour Days × 300
Vehicle Price = Billable KM × Vehicle Per-KM Rate
```

- The minimum running allowance is **300 km per tour day**.
- Calculate the billable kilometres from the number of days, not from the itinerary's estimated road distance.
- Multiply the resulting billable kilometres by the selected vehicle's configured per-kilometre rate.
- Calculate and display a separate price for each eligible vehicle.
- Use the vehicle's current configured rate; do not hard-code the example rates below as universal rates.

### Example: 3-day package

```text
3 days × 300 km = 900 billable km

Sedan at ₹11/km: 900 × 11 = ₹9,900
Ertiga at ₹14/km: 900 × 14 = ₹12,600
```

### Example vehicle rates supplied

| Vehicle | Example rate | 3-day example price |
|---|---:|---:|
| Sedan / Dzire | ₹11/km | ₹9,900 |
| Ertiga | ₹14/km | ₹12,600 |

These are the rates and example totals supplied for illustration. Read the live vehicle rates from the system when generating actual prices.

### Packages to create

| Package name / route | Duration | Itinerary / route |
|---|---:|---|
| Agra to Delhi Tour | 3 days | Agra → Fatehpur Sikri → Mathura → Delhi drop |
| Agra to Mussoorie Tour | 5 days | Agra → Haridwar → Rishikesh → Dehradun → Mussoorie / Nainital itinerary |
| Agra to Manali Tour | 5 days | Agra → Kullu → Manali |
| Agra to Jaisalmer Tour | 5 days | Agra → Jaipur → Ajmer → Udaipur → Jaisalmer |
| Delhi to Agra Tour | 3 days | Delhi → Mathura → Agra → Fatehpur Sikri |

**Route note:** The supplied Mussoorie itinerary also names Nainital. Preserve the listed destinations and let the admin confirm the exact stop order/route before publishing if needed.

### Agra–Delhi one-day option

The one-day Agra → Delhi option is separate from the 3-day package.

- The business may set a dedicated one-way fixed price for each vehicle.
- If the admin chooses per-kilometre calculation instead, use a **300 km minimum**:

```text
One-day billable KM = 300
Vehicle price = 300 × that vehicle's per-KM rate
```

- Do not assume the one-day fixed price is the same as the 3-day package price.

## 3. Local Sightseeing

Local sightseeing prices are configurable. The admin may set or change prices when required.

### Agra Local — Same-Day Sightseeing

- Create the local sightseeing service.
- Price: **not supplied yet**; leave configurable/unset until entered by the admin.
- Do not invent a price.

### Agra to Mathura Local Sightseeing

**Route:** Agra → Mathura → Vrindavan

| Vehicle | Price |
|---|---:|
| Sedan | ₹3,300 |
| Ertiga | ₹4,200 |
| Crysta | ₹5,400 |
| Tempo Traveller 13-seater | ₹8,100 |
| Traveller 17-seater | ₹8,400 |
| Urbania 13-seater | ₹11,400 |
| Urbania 17-seater | ₹9,600 |

The following are excluded from the listed local-tour prices:
- Parking charges
- Toll charges
- Driver night charges

A separate **₹500** amount was also mentioned, but its purpose and application were not specified. Do not automatically add it to prices or label it as a fee. Keep it pending admin clarification.

Rules:
- Store each price against its corresponding vehicle/model or vehicle category.
- Local-tour prices are configurable by the admin.
- Do not apply the 300 km/day tour-package formula to these fixed local prices unless the admin explicitly chooses to do so.

---

## 5. Transfers

Transfer prices are configurable and must be stored separately for each vehicle/model.

### Agra to Delhi Airport

- Use the corresponding vehicle's own configured **one-way price**.
- Do not derive this price from the multi-day tour-package formula.
- If a vehicle's one-way price has not been configured, leave it unset rather than inventing a price.

### Agra to Noida International Airport

Calculate the price from the corresponding **Agra to Delhi route price**:

```text
Noida International Airport transfer price
= Agra to Delhi price − ₹1,000
```

Examples should be calculated separately for every vehicle/model using that vehicle's Agra → Delhi price.

Rules:
- Save the resulting amount against the corresponding vehicle/model for the Agra → Noida International Airport route.
- Do not subtract ₹1,000 from one common price and apply that result to every vehicle.
- If the Agra → Delhi source price is missing, leave the Noida Airport price unset until the source price is configured.
- Admin may configure or update transfer prices when required.

---

## 6. Vehicle and Pricing Data Rules

1. Use the vehicles that are active/live and bookable in the system.
2. Keep prices vehicle-specific. Do not assign one vehicle's price to another vehicle.
3. For category-wide prices explicitly described above, apply the price to all eligible active vehicles in that category.
4. Read per-kilometre rates from the vehicle records for tour-package calculations.
5. Keep fixed prices, per-kilometre rates, minimum running, duration, and exclusions as separate fields where the existing data model supports them.
6. Do not invent missing prices, rates, fees, or route details.
7. Allow authorized admins to configure or update local-tour and transfer prices.
8. Clearly show whether a price is fixed, per-kilometre, or calculated from another route's price.
9. Preserve the stated exclusions and minimum-running conditions in customer-facing service details.
10. Before publishing a service, validate that every required vehicle price is present and that the vehicle is active.

---

## 7. Quick Pricing Summary

| Service type | Pricing method |
|---|---|
| Multi-day tour package | Days × 300 km × vehicle per-km rate |
| Agra → Delhi one-day option | Admin-set one-way price, or 300 km × vehicle per-km rate if that method is selected |
| Delhi → Agra same-day outstation | Fixed category prices; 500 km minimum running |
| Agra local sightseeing | Admin-configurable; price pending |
| Agra → Mathura → Vrindavan local sightseeing | Supplied fixed vehicle-specific prices |
| Agra → Delhi Airport transfer | Vehicle's own one-way price |
| Agra → Noida International Airport transfer | Corresponding Agra → Delhi price minus ₹1,000 |

**Implementation priority:** Treat this document as the pricing/configuration specification. Reuse the existing vehicle, service, and pricing data structures where possible. Do not create duplicate vehicle records merely to support different service prices; associate each service price with the existing vehicle/model and service route.
