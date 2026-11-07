# SK Baghel — Real-Question FAQs for Every Page + SEO Rules Scorecard

**Date:** 7 Nov 2026 · **Site:** agraskbagheltourandtravels.com · **Repo:** tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels (local copy `~/workspace/skbaghel-travels`, commit e1495ba)
**Sources for the questions:** Google "People also ask" + competitor FAQ pages that rank for Agra taxi/tour queries (Triveni, Taj Mahal Cabs, TaxiYatri, Chiku Cab, HelloMyCabs, OneWay.cab, Braj Bhoomi, Vrindavan Tours), ASI / tajmahal.gov.in ticket & timing pages checked Oct–Nov 2026, and this site's own code (`FaqPage.tsx`, `RouteTemplate.tsx`, `LocalTourTemplate.tsx`, `MonumentTemplate.tsx`, `TourPackageTemplate.tsx`, `TransferDetailPage.tsx`, `VehicleDetailPage.tsx`, `FleetPage.tsx`, `RentalPage.tsx`, `seoLandingSlugs.ts`, `generated-published-routes.json`, `data.ts`, `prices.ts`).

## The FAQ rule (applies to every answer below)

**Answer first, explain later. 1–2 short sentences max. No paragraph.**
Sentence 1 = the direct answer. Sentence 2 = the one fact that makes it self-contained (fare, time, distance, or what is / is not included). If a question needs a third sentence, it is two questions — split it.
Every answer must be readable alone, without the rest of the page. No "we offer the best…" filler, no superlatives, no repeating the question back.

## The one structural rule that matters most for SEO

**Generic policy questions live in ONE place only: `/en/faq/`.**
Advance (28%), cancellation, 300 km/day minimum, night allowance, tolls, payment, driver details — today the same 5–6 answers are copy-pasted into `RouteTemplate`, `TourPackageTemplate`, `LocalTourTemplate`, `MonumentTemplate`, `VehicleDetailPage` and `TransferDetailPage`. That is why the pages look near-duplicate to Google. Every other page below gets **only questions that page alone can answer** (its distance, its stops, its tickets, its vehicle). If a question below repeats a `/faq/` answer, delete it from that page and link to `/faq/` instead.

---

## ⛔ STOP — fix these before publishing any new FAQ

Two of these were my mistake, corrected 7 Nov 2026 on Tarun's word: fares are **per vehicle model**, not one site-wide sedan price, and night allowance timing is **fixed 8 PM–6 AM**. Amounts resolved the same day: sedan/SUV ₹500, all other vehicles ₹700. The fleet is model-based now — name the exact model (Dzire, Etios, Ertiga, Innova Crysta, Tempo Traveller, Urbania) in every fare and vehicle answer, never just the class. The remaining items are real checks. An FAQ that states the wrong figure will be caught by customers and by Google (FAQ text must match the visible page).

| # | Conflict | Where it appears |
|---|---|---|
| 1 | **Fares differ per vehicle model — corrected, not a conflict.** | Agra–Delhi "sedan" is ₹2,399 (`seoLandingSlugs.ts`, Delhi NCR drop), ₹3,499 (`FaqPage.tsx` / `data.ts` / `prices.ts` / meta descriptions) and ₹5,000 (`generated-published-routes.json`) because each figure belongs to a different vehicle model / product on a different page. **Rule: never copy a fare from one page to another, and never state one site-wide sedan price.** Each page's FAQ uses only that page's own fare card. Before publishing, confirm which model each figure is (City vs Dzire vs Etios) and label it in the FAQ. Same applies to Jaipur and Lucknow. |
| 2 | **Tolls: included vs billed at actuals** | `FaqPage.tsx` + `RouteTemplate.tsx` say one-way fares include 100% of tolls. `FleetPage.tsx` says tolls, state permits and parking are billed at actuals. `data.ts:1005` splits it: one-way = included, round-trip = actuals. Use that split everywhere, or pick one. |
| 3 | **Night allowance — RESOLVED 7 Nov 2026: 8 PM–6 AM; sedan/SUV ₹500, rest ₹700.** | Timing is fixed 8 PM–6 AM. Amount: sedan and SUV ₹500 per night, all other vehicles (Tempo Traveller, Urbania, etc.) ₹700 per night. `FaqPage.tsx` (10 PM–6 AM, ₹300) and `RouteTemplate.tsx` (11 PM–5 AM, ₹300/₹500) are both wrong on timing and amount — fix both templates. |
| 4 | **Agra–Jaisalmer fare looks wrong in data** | `generated-published-routes.json`: 800 km, 840 min, sedan ₹5,000 — cheaper per km than Agra–Mathura (60 km, ₹3,000). Almost certainly a data error. Do not publish a Jaisalmer fare until checked. |
| 5 | **Local sightseeing fare** | `FaqPage.tsx`: ₹1,800–₹2,500. `seoLandingSlugs.ts`: sedan ₹2,000. Meta description: "from ₹1,900". Likely different models / starting points — confirm which model each figure is before harmonising; do not force one number. |
| 6 | **Taj Mahal foreign ticket** | This file uses ASI's current figure: **₹1,100 + ₹200 mausoleum**. One competitor page lists ₹1,050. Re-check asi.payumoney.com / tajmahal.gov.in before publishing — ASI changes this without notice. |

**Fare rule used below (corrected 7 Nov 2026):** there is no single sedan price for the whole website — every fare is per vehicle model and per route/product. So each answer prints only the fare from that page's own data, and never borrows a fare from another page. Where the model behind a figure is still unconfirmed, the answer gives distance + time and points at the fare card on that page. Anything marked **[VERIFY]** must be confirmed on the live page before it goes into FAQ schema.

---

## 1. Homepage `/` — 5 questions

These are the questions people ask before they trust any taxi site in Agra. Keep only these five here; everything else belongs on its own page.

**Q: How much does a taxi in Agra cost?**
A: A private AC sedan for a full day of Agra sightseeing costs from ₹2,000 for 8 hours / 80 km. One-way outstation fares start at ₹3,499 to Delhi in a sedan.

**Q: How do I book a taxi in Agra?**
A: Share pickup point, drop, date, time and passenger count on WhatsApp or the booking form, and you get a fixed fare and driver details before you pay anything. Book at least 2 hours before pickup; book the night before for a sunrise start.

**Q: Are tolls and taxes included in the fare?**
A: Yes, on fixed one-way fares — Yamuna Expressway tolls, FASTag and state taxes are included in the quoted price. On round-trip outstation bookings, tolls and parking are billed at actuals. **[VERIFY — see conflict #2 above]**

**Q: Is the taxi private, or shared with other passengers?**
A: Private. The car and driver are yours alone for the booking — no other passengers, no waiting for strangers, and you choose the stops.

**Q: Do your drivers speak English?**
A: Yes. Chauffeurs are police-verified and work with Agra tourists daily; English-speaking drivers and licensed guides can be requested when you book.

---

## 2. Central FAQ page `/en/faq/` — the ONLY home for policy questions (16 questions)

Keep the 16 existing questions, rewritten to the answer-first rule. **Do not copy any of these onto other pages.**

**Q: Are expressway tolls and FASTag charges included in one-way cab fares?**
A: Yes. One-way fares such as Agra–Delhi ₹3,499 and Agra–Jaipur ₹3,499 include all Yamuna Expressway and state-highway tolls. The driver carries a FASTag, so nobody asks you for toll money on the road.

**Q: How much does an Agra tour cost?**
A: A private full-day sightseeing cab costs ₹2,000–₹2,500 in a sedan for 8 hours / 80 km, covering Taj Mahal, Agra Fort, Baby Taj and Mehtab Bagh. Monument tickets and a guide are extra.

**Q: How does the 300 km/day minimum outstation rule work?**
A: Round-trip outstation billing starts at 300 km per calendar day, so a 2-day trip to Jaipur bills at least 600 km. Distance above that is charged at your vehicle's per-km rate.

**Q: When does the driver night allowance apply?**
A: Sedan and SUV: ₹500 per night. All other vehicles: ₹700 per night. It applies only when the vehicle runs between 8 PM and 6 AM, or the driver stays overnight on a multi-day trip — there is no daytime driver charge.

**Q: Can I get an official receipt for reimbursement?**
A: Yes. A computerised receipt with your company name and tax details is sent on email or WhatsApp as soon as the booking is confirmed.

**Q: How much advance do I pay to confirm a booking?**
A: 28% as a token deposit to lock the vehicle and driver. The remaining 72% is paid to the driver at the end of the trip, by UPI, cash or card.

**Q: What is the cancellation and refund policy?**
A: Cancel 24 hours or more before pickup and the 28% advance is refunded in full. Cancel 6–24 hours before pickup and 50% is kept as credit; same-day rescheduling is free if a vehicle is available.

**Q: When do I get my driver and vehicle details?**
A: 2 hours before pickup, on WhatsApp and SMS. The message has the driver's name and verified phone number, the vehicle model, and its yellow-plate commercial registration number.

**Q: Do all vehicles have air-conditioning?**
A: Yes, every vehicle, all year. AC stays on during highway driving and monument stops, including peak summer.

**Q: How much luggage fits in a sedan, Ertiga or Innova Crysta?**
A: Sedan: 2 large suitcases + 2 small bags. Ertiga: 3 medium suitcases + 2 cabin bags. Innova Crysta: 4 large trolley bags. Tempo Travellers have a rear luggage bay for 8 large bags.

**Q: Are pets allowed in the vehicles?**
A: No. Pets are not allowed, to keep the upholstery clean and allergen-free for the next passengers.

**Q: Is the Taj Mahal closed on any day?**
A: Yes, every Friday, for prayers. Agra Fort, Fatehpur Sikri, Baby Taj and Mehtab Bagh stay open all 7 days.

**Q: What are the Taj Mahal and Agra Fort ticket prices?**
A: Taj Mahal: ₹50 Indian, ₹540 SAARC/BIMSTEC, ₹1,100 foreign, plus ₹200 for the main mausoleum; under-15s free. Agra Fort: ₹50 Indian, ₹650 foreign. **[VERIFY ticket prices on asi.payumoney.com before publishing]**

**Q: What is included in an Agra local sightseeing taxi package?**
A: A private AC vehicle for 8 hours / 80 km (or 12 hours / 100 km), a chauffeur, fuel and monument parking. Monument tickets, guide fees and food are extra.

**Q: What is the best time for the Taj Mahal sunrise tour?**
A: Gates open 30 minutes before sunrise — about 5:30 AM in summer, 6:15 AM in winter. Pickup is 45 minutes before sunrise, so you reach the East Gate before the tour buses.

**Q: Are licensed monument guides available?**
A: Yes. Ministry of Tourism licensed guides in English, Spanish, French or German can meet you at the monument gate if you ask when booking.

---

## 3. Local sightseeing packages — `LocalTourTemplate.tsx` (`/en/packages/<slug>/`)

**Template problem today:** the same 7 FAQs (inclusions, destinations, extra km, parking, pickup, 28%, cancellation) are generated for every local package, with only the package name swapped. That is duplicate content. Fix: keep the 7 template questions **only as the skeleton**, and add the 3 package-specific questions below to each package. Delete the 28% and cancellation questions from this template — they live on `/faq/`.

### 3a. Same Day Agra Taj Mahal Tour (`agra-sightseeing`, sedan from ₹3,499)

**Q: Can I see the Taj Mahal, Agra Fort and Mehtab Bagh in one day?**
A: Yes. That is the standard circuit: Taj Mahal in the morning, Agra Fort before lunch, Baby Taj and Mehtab Bagh for sunset. The car waits at each stop, so the order can change to suit you.

**Q: What time should I start to avoid the Taj Mahal crowds?**
A: Start at sunrise. Pickup 45 minutes before sunrise gets you to the East Gate before the tour buses; by 10 AM the queues are at their longest.

**Q: Where does the car drop me at the Taj Mahal?**
A: At the East Gate or West Gate parking plaza, about 500 m from the gate. Petrol and diesel vehicles cannot go closer; battery golf carts and shuttles cover the last stretch.

### 3b. Taj Mahal Sunrise Tour (`taj-mahal-sunrise-tour`, ₹5,200)

**Q: What time is pickup for the sunrise tour?**
A: 45 minutes before sunrise — about 4:45 AM in summer, 5:30 AM in winter. Gates open 30 minutes before sunrise.

**Q: What happens on a foggy winter morning?**
A: The tour still runs. The guide starts with the marble interiors and courtyards, then moves to open-air photography once the mist lifts, usually by 8 AM.

**Q: Is the sunrise tour possible on a Friday?**
A: No. The Taj Mahal is closed every Friday, so a Friday sunrise tour visits Agra Fort and Mehtab Bagh instead, with the Taj view from across the river.

### 3c. Mathura & Vrindavan Darshan (`mathura-vrindavan`, ₹4,200)

**Q: Can Mathura and Vrindavan be covered in one day from Agra?**
A: Yes, with a 5:30–6 AM start. Agra–Mathura is about 60 km (75 minutes); Mathura–Vrindavan is another 25–40 minutes, and you are back in Agra by evening.

**Q: Do temples close in the middle of the day?**
A: Yes, most temples close around noon and reopen in the afternoon. The route plans lunch and travel in that gap, so no darshan time is lost.

**Q: Can the car reach the temple gates in Vrindavan?**
A: No, not inside the town limits. The driver drops you at the designated parking nodes and you walk or take an e-rickshaw to the temple gates.

### 3d. Same Day Agra by Gatimaan Train (`gatimaan-express-agra-tour`)

**Q: How does the Gatimaan Express tour work?**
A: You arrive in Agra by train and the driver meets you at Agra Cantt with a name board. The car covers the day's sightseeing and drops you back at the station for your return train.

**Q: What if my train is late?**
A: Give the train number or PNR when booking. The driver tracks the train and adjusts pickup with no waiting fee for the delay.

**Q: Can I go straight to the Taj Mahal from the station?**
A: Yes. Agra Cantt is about 6 km from the Taj Mahal, so the driver can take you to the East Gate first and to your hotel afterwards.

### 3e. Agra Overnight Experience (`agra-unhurried`)

**Q: What does an overnight Agra trip add over a day trip?**
A: A second day. Day 1 is the Taj Mahal and Agra Fort; day 2 is Fatehpur Sikri, Sikandra and Mehtab Bagh at sunset, without rushing any of them.

**Q: Is the hotel included in the overnight package?**
A: No. The package is the car, driver and sightseeing; the hotel is booked separately, or tell us your budget and we suggest one near the Taj.

**Q: Where does the driver stay overnight?**
A: The driver stays in Agra overnight. A night allowance applies for the overnight halt (8 PM–6 AM): ₹500 for a sedan/SUV, ₹700 for larger vehicles.

### 3f. Golden Triangle Tour (`golden-triangle`, sedan from ₹18,500)

**Q: How many days does the Golden Triangle take?**
A: 3 nights / 4 days: Delhi → Agra → Jaipur → Delhi. Each city gets a full sightseeing day, with the same car and driver throughout.

**Q: Is the Golden Triangle one booking or three?**
A: One booking. One car, one driver and one fixed price cover the whole circuit, including the 300 km/day outstation minimum.

**Q: Can the Golden Triangle start in Agra instead of Delhi?**
A: Yes. The circuit can start and end in Agra; the route and price are recalculated for the Agra start, and Delhi becomes the last stop.

### 3g. Same Day Fatehpur Sikri Royal Heritage Tour (`same-day-tour-of-fatehpur-sikri`, sedan ₹2,000)

**Q: How far is Fatehpur Sikri from Agra?**
A: About 40 km, 1–1.5 hours each way on NH21. It fits in a half day, so it pairs with the Taj Mahal in the morning.

**Q: What is there to see at Fatehpur Sikri?**
A: Akbar's red-sandstone capital: Buland Darwaza, Jama Masjid and the Salim Chishti Dargah. Plan 2–3 hours inside the complex.

**Q: Is Fatehpur Sikri open on Friday when the Taj Mahal is closed?**
A: Yes, it stays open all 7 days. A Friday is the best day to do Fatehpur Sikri, since the Taj Mahal is closed.

### 3h. Same Day Jaipur Pink City Excursion (`same-day-tour-of-jaipur`, sedan ₹3,499)

**Q: Can Jaipur be done in one day from Agra?**
A: Yes, but it is a long day: Agra–Jaipur is 240 km, about 4.5 hours each way. Leave by 5 AM to get 5–6 hours in Jaipur.

**Q: What does the Jaipur day cover?**
A: Hawa Mahal, Amer Fort and the old city markets, in that order. Anything more needs an overnight stay.

**Q: Is the Agra–Jaipur fare one-way or return?**
A: The published sedan fare is for the Agra–Jaipur leg. A same-day return is billed as a round trip with the 300 km/day minimum.

### 3i. Bharatpur Keoladeo Bird Sanctuary Safari (`same-day-visit-of-bharatpur`, sedan ₹2,200)

**Q: When is the best time to visit Bharatpur bird sanctuary?**
A: October to March, when migratory birds arrive. Arrive at the sanctuary gate by 7 AM, when birds are most active and the light is best for photography.

**Q: How far is Bharatpur from Agra?**
A: About 55 km, 1.2 hours. It is a half-day trip and pairs with Fatehpur Sikri on the same route.

**Q: Does the taxi go inside the sanctuary?**
A: No. Cars stop at the sanctuary gate; inside, you move by cycle-rickshaw or on foot, which is also how you get closest to the birds.

### 3j. Agra Tour for International Tourists, Full Day (12 h / 80 km, sedan ₹10,000)

**Q: Why is the international tourist tour 12 hours instead of 8?**
A: It covers five monuments — Taj Mahal, Agra Fort, Mehtab Bagh, Sikandra and Baby Taj — at an unhurried pace, with time for photography and lunch built in.

**Q: Is the guide included in the international tour?**
A: No, the guide is extra. The car, driver, fuel and parking are included; a licensed English-speaking guide can be added when you book.

**Q: Do you pick up from the airport or station for this tour?**
A: Yes, free doorstep pickup from any hotel, homestay, Agra Cantt (AGC) or Agra Fort (AF) station inside Agra city limits.

---

## 4. Tour packages — `TourPackageTemplate.tsx` (3 generated packages)

**Template problem today:** the same 5 generic FAQs (fog, shoes, tickets, customise, 28%) appear on every tour package. Keep the ticket and shoe questions only where they fit; add the package-specific ones below.

### 4a. Same Day Agra to Mathura Tour (`same-day-agra-to-mathura-tour`, from ₹6,200)

**Q: What is the route for the same-day Agra–Mathura tour?**
A: Agra → Mathura (Krishna Janmabhoomi, Dwarkadhish) → Vrindavan (Banke Bihari, ISKCON, Prem Mandir) → Agra, back by 8:30–10 PM. Start at 5:30–6 AM.

**Q: Is darshan free in Mathura and Vrindavan?**
A: Yes, darshan is free at all temples. Nobody sells an official VIP pass at Banke Bihari; anyone offering one is not official.

**Q: What should I wear for the Mathura–Vrindavan temples?**
A: Modest clothing and slip-on shoes, which come off at every temple. Carry water and a scarf; leave large bags in the car, as temple entry restricts them.

### 4b. Himachal Tour, 2 Day (`himachal-tour-2-day`)

**Q: Which places does the 2-day Himachal tour cover?**
A: **[VERIFY itinerary from the live package page before publishing — the package name alone does not say which towns it covers.]** The car and driver stay with you for both days, and the 300 km/day outstation minimum applies.

**Q: Is the hotel included in the Himachal tour?**
A: No. The package covers the car, driver, fuel and tolls; hotels are extra unless the package page says otherwise.

**Q: Is a sedan enough for Himachal hill roads?**
A: For 2–3 people with light luggage, yes. For 4 or more, or heavy luggage, take the Ertiga or Innova Crysta — hill climbs and luggage space are both easier.

### 4c. Exclusive Tour of Agra for 1 Day (`exclusive-tour-of-agra-for-1-day`)

**Q: What makes this tour "exclusive" compared to the standard Agra day tour?**
A: It is a private tour with no other passengers, a flexible start time and stops you choose — the same monuments, but the day is built around you instead of a fixed itinerary.

**Q: Can I change the stops on the day itself?**
A: Yes. It is a private tour, so you can swap Mehtab Bagh for Baby Taj, add a petha tasting or a market stop, and tell the driver on the day with no extra charge for the change itself.

**Q: How long does the exclusive Agra tour last?**
A: A full day — 8 to 12 hours, up to 80–100 km inside Agra. Extra hours and kilometres are billed at the published rates: sedan ₹10/km and ₹150/hr.

---

## 5. Monuments — `MonumentTemplate.tsx` (`/en/monuments/<slug>/`)

**Template problem today:** the same 9 FAQs repeat on all 10 monument pages, including a Taj Mahal Friday answer on pages where it does not belong. Fix: keep the visiting-hours / tickets / drop-point / guide questions, but make each answer use that monument's own facts, and add the 2 monument-specific questions below per page. Delete the generic 28% and cancellation questions from this template.

### 5a. Taj Mahal

**Q: How long should I plan inside the Taj Mahal?**
A: 2–3 hours. Tickets are valid for 3 hours from entry, and staying longer can mean paying again at the exit.

**Q: Which gate should I enter the Taj Mahal from?**
A: East Gate, for the shortest queues at sunrise. West Gate is closest to most hotels; South Gate is for local visitors. Your ticket is tied to the gate you book.

**Q: Can I see the Taj Mahal at night?**
A: Yes, on 5 nights a month — the full-moon night and the two nights before and after it, 8:30 PM–12:30 AM in 30-minute batches. No night viewing on Fridays or during Ramzan, and tickets must be bought a day in advance from the ASI office.

**Q: What is not allowed inside the Taj Mahal?**
A: Food, chewing gum, smoking items, matchboxes, tripods, large backpacks and sharp objects. Phones and small cameras are allowed; lockers are available at security.

### 5b. Agra Fort (Agra Red Fort)

**Q: How long does Agra Fort take to visit?**
A: 2–3 hours. It is a walled city, not a single building — palaces, mosques, courtyards and the view of the Taj Mahal from the riverside terrace.

**Q: Is Agra Fort open on Friday?**
A: Yes, all 7 days, including Friday when the Taj Mahal is closed. It is the best Friday alternative in Agra.

**Q: Where does the taxi drop me at Agra Fort?**
A: At the Amar Singh Gate parking area, the main visitor entrance. The car waits there while you visit.

### 5c. Fatehpur Sikri

**Q: Is Fatehpur Sikri open on Friday?**
A: Yes, all 7 days. It is the best Friday day trip from Agra, 40 km away on NH21.

**Q: Do I need a guide at Fatehpur Sikri?**
A: It helps more here than at the Taj Mahal. The complex is large and mostly unlabelled, so a licensed guide is worth it for the history of Akbar's capital.

### 5d. Itimad-ud-Daulah (Baby Taj)

**Q: Why is it called the Baby Taj?**
A: It is a small white-marble tomb with the same pietra dura inlay as the Taj Mahal, built a generation earlier. It is often called the draft version of the Taj.

**Q: How long does Baby Taj take?**
A: 45 minutes to 1 hour. It pairs with Mehtab Bagh across the river, usually as the sunset stop of a full-day tour.

### 5e. Mehtab Bagh

**Q: What is Mehtab Bagh best for?**
A: The sunset view of the Taj Mahal from across the Yamuna, without the crowds inside the Taj complex. It is the last stop of most full-day tours.

**Q: Is Mehtab Bagh open on Friday?**
A: Yes, all 7 days. On a Friday, it is the closest you can get to a Taj Mahal view.

### 5f. Sikandra (Akbar's Tomb)

**Q: What is Sikandra?**
A: Akbar's tomb, in a walled garden 10 km from central Agra on the Delhi road. Plan 1–1.5 hours, including the garden and the deer park.

**Q: Is Sikandra on the way to anywhere?**
A: Yes — it is on the Agra–Delhi road, so it works as a first or last stop on a Delhi transfer, or as part of the international tourists' full-day tour.

### 5g. Jama Masjid Agra

**Q: Where is Jama Masjid in Agra?**
A: Opposite Agra Fort's Delhi Gate, in the old city. It is a short stop — 30 minutes — and pairs with Agra Fort and the Kinari Bazaar walk.

**Q: Is Jama Masjid open to tourists?**
A: Yes, outside prayer times. Dress modestly and remove shoes at the entrance, as at any mosque.

### 5h. Moti Masjid (Pearl Mosque)

**Q: Where is Moti Masjid?**
A: Inside Agra Fort, near the Diwan-i-Am. It is visited as part of the fort tour, not as a separate stop.

**Q: Why is it called the Pearl Mosque?**
A: Its white marble glows like a pearl against the fort's red sandstone. It takes 15 minutes inside the fort visit.

### 5i. Jodha Bai Ka Rauza / Mariam-uz-Zamani Palace

**Q: What are these two places?**
A: Two Mughal-era sites in Agra: Jodha Bai's tomb (Rauza) and Mariam-uz-Zamani's palace, Akbar's Rajput queen. Both are quiet, uncrowded stops of 30–45 minutes each.

**Q: Are they included in a standard Agra day tour?**
A: No, not by default. Ask the driver to add them — they fit on the Fatehpur Sikri or Sikandra route, not the Taj Mahal circuit.

---

## 6. Outstation routes — `RouteTemplate.tsx` (`/en/routes/<slug>/`, 34 routes)

**Template problem today:** the same 6 FAQs (tolls, stopovers, night allowance, delays, cancellation, breakdown) appear word-for-word on all 34 route pages. Fix: keep **only 2** template questions (tolls — with the one-way/round-trip split — and stopovers), and add the route-specific questions below. Delete night allowance, cancellation and breakdown from this template; they live on `/faq/`.

**Pattern for every route page (fill from `generated-published-routes.json`):**
- Q1: fare + distance + time. A: "Sedan from ₹[route fare] one-way. [X] km, about [Y] hours via [expressway/road]."
- Q2: the one stop or detour people actually ask about on that corridor.
- Q3: the one practical worry on that corridor (return, same-day, luggage, hill road, etc.).

### 6a. Agra → Delhi (`agra-to-delhi`, 230 km, ~4 h, sedan ₹5,000 in route data — this page's own fare; the ₹3,499 figure on /faq/ is a different model/product, not the same fare)

**Q: How long does Agra to Delhi take by taxi?**
A: About 4 hours for 230 km via the Yamuna Expressway. Leave after 2 PM to avoid Delhi's morning traffic.

**Q: Can the taxi stop at Mathura or Vrindavan on the way to Delhi?**
A: Yes. Mathura is on the route; tell us when booking and the fare is confirmed before you travel — the direct-trip fare does not include the detour.

**Q: Do I pay a return fare on a one-way Agra–Delhi taxi?**
A: No. A one-way booking charges only the Agra–Delhi leg; the car does not come back with you.

### 6b. Delhi → Agra (`delhi-to-agra-taxi`, 230 km, ~4 h)

**Q: Where in Delhi does the taxi pick up?**
A: Anywhere in Delhi NCR — home, hotel, office or Delhi IGI Airport. Give the exact address and landmark when booking.

**Q: Can I visit the Taj Mahal and return to Delhi the same day?**
A: Yes, if you leave Delhi by 6 AM. You get 4–5 hours in Agra — Taj Mahal and Agra Fort — and are back in Delhi by 9–10 PM.

### 6c. Agra → Jaipur (`agra-to-jaipur`, 240 km, 4.5 h, sedan ₹5,000 in route data — this page's own fare; confirm which sedan model it is)

**Q: Which route does Agra–Jaipur take?**
A: NH21 via Bharatpur and Mahwa, 240 km in about 4.5 hours. The Bharatpur bird sanctuary is the natural halfway stop.

**Q: Can I stop at Fatehpur Sikri on the way to Jaipur?**
A: Yes, it is on the route — 40 km from Agra. A 2-hour stop fits without changing the day's plan if you leave early.

### 6d. Agra → Mathura (`agra-to-mathura`, 60 km, 75 min, sedan ₹3,000)

**Q: How long is Agra to Mathura by taxi?**
A: 75 minutes for 60 km on NH19. A same-day Mathura–Vrindavan return is the usual booking, not a one-way drop.

**Q: Is Agra–Mathura a one-way or round-trip booking?**
A: Usually a round trip. A one-way drop leaves you without a car in Mathura, where local transport between temples is by e-rickshaw.

### 6e. Agra → Lucknow (`agra-to-lucknow`, 335 km, 5 h, sedan ₹8,500 in route data — this page's own fare; confirm which sedan model it is)

**Q: Which expressway does Agra–Lucknow use?**
A: The Agra–Lucknow Expressway, 335 km in about 5 hours. There are food and rest plazas roughly every 100 km.

**Q: Can I be dropped at Lucknow airport or Charbagh station?**
A: Yes. Give the terminal or platform when booking; the driver plans the drop around your flight or train time.

### 6f. Agra → Gwalior (`agra-to-gwalior`, 120 km, 2.5 h, sedan ₹4,000)

**Q: How long is Agra to Gwalior?**
A: 2.5 hours for 120 km on NH44, crossing the Chambal river. It is a comfortable same-day return.

**Q: What is worth seeing in Gwalior on a day trip?**
A: Gwalior Fort and the Jai Vilas Palace. Leave Agra by 7 AM to get 4–5 hours in the city.

### 6g. Agra → Noida / Gurugram (`agra-to-noida` 195 km, 200 min, sedan ₹4,500; `agra-to-gurugram` 215 km, 220 min, sedan ₹4,800)

**Q: Is Noida a different fare from Delhi?**
A: Yes. Noida is 195 km (about 3.5 hours) and Gurugram is 215 km (about 3.5–4 hours), so each has its own fixed fare on this page — they are not the Delhi fare.

**Q: Can the taxi drop me at a Noida sector or Gurugram Cyber City office?**
A: Yes, door-to-door anywhere in Noida or Gurugram. Give the sector and building name; the Yamuna Expressway route avoids Delhi city traffic.

### 6h. Agra → Haridwar / Rishikesh / Dehradun (`agra-to-haridwar` 390 km, 7 h, sedan ₹9,000; Rishikesh 415 km, 7.5 h, ₹8,500; Dehradun 435 km, 8 h, ₹9,500)

**Q: Can Haridwar be done in one day from Agra?**
A: No, not comfortably — 390 km, 7 hours each way. Plan at least one night in Haridwar; the same driver stays with you and the 300 km/day minimum applies.

**Q: Is a sedan enough for the Haridwar–Rishikesh–Dehradun route?**
A: Yes for 2–3 people. For a family with luggage, take the Ertiga or Innova Crysta — the extra space matters on a 7–8 hour drive.

### 6i. Agra → Ayodhya / Banaras / Prayagraj (`agra-to-ayodhya` 470 km, 7 h, sedan ₹12,100; Banaras 630 km, 9.5 h, ₹12,500; Prayagraj 480 km, 7.5 h, ₹12,500)

**Q: How long is Agra to Ayodhya by road?**
A: About 7 hours for 470 km via the Agra–Lucknow Expressway and NH27. It is a 2-day trip, not a day return.

**Q: Can Ayodhya, Prayagraj and Banaras be combined in one trip?**
A: Yes, as a 3–4 day circuit with the same car and driver. Each leg is billed under the 300 km/day outstation minimum.

### 6j. Agra → Ajmer / Udaipur / Mussoorie (`agra-to-ajmer` 370 km, 6.5 h, sedan ₹7,500; Udaipur 630 km, 10.5 h, ₹15,000; Mussoorie 470 km, 9 h, ₹10,500)

**Q: Is Agra–Ajmer a day trip?**
A: It is a long day — 370 km, 6.5 hours each way. Most people stay one night in Ajmer or Pushkar and return the next day.

**Q: Is a sedan suitable for Mussoorie's hill roads?**
A: Yes, but an Ertiga or Innova is more comfortable for the climb and for luggage. Tell us your group size and we recommend the vehicle.

**Note on Jaisalmer:** `agra-to-jaisalmer` shows 800 km / 14 h at sedan ₹5,000 in route data — do not write a fare FAQ for it until the data is fixed (see conflict #4).

---

## 7. SEO landing routes — `seoLandingSlugs.ts` / `RichLandingPage.tsx` (15 slugs)

These pages already have 1–2 FAQs each in code, but most are generic ("tolls included?"). Replace with the one question only that landing page can answer — its landmark or its stop. **Do not publish both this page and the matching `RouteTemplate` page for the same city pair unless each states its own model + fare clearly** (this is the cannibalisation problem from the 20 Oct decision — keep 64, gated republish).

- **agra-local-full-day-tour** — Q: Which monuments does the full-day tour cover? A: Taj Mahal, Agra Fort, Baby Taj and Mehtab Bagh, in 8–12 hours / 80 km. Sedan ₹2,000, Ertiga ₹2,800, Innova Crysta ₹3,800, Tempo ₹5,500.
- **agra-cantt-station-transfer** — Q: What if my train to Agra Cantt is delayed? A: The driver tracks the train and adjusts arrival automatically, with no waiting fee for the delay.
- **fatehpur-sikri-excursion** — Q: How long is the Fatehpur Sikri excursion? A: 5–6 hours for the 90 km loop, including 2–3 hours inside the complex.
- **agra-to-sikandra-transfer** — Q: Can Sikandra be added to a Delhi transfer? A: Yes, it is on the Agra–Delhi road, 10 km from central Agra — a 1-hour stop on the way out.
- **mughal-bazaar-shopping-circuit** — Q: Which markets does the shopping circuit cover? A: Sadar Bazaar, Kinari Bazaar and the Fatehabad Road handicrafts hub, in a 6-hour / 50 km loop.
- **agra-to-delhi-airport-taxi** — Q: Which Delhi airport terminal does the taxi reach? A: IGI Terminal 3, Terminal 1 and Aerocity — give the terminal and flight number when booking.
- **agra-to-delhi-ncr-drop** — Q: Can I book a multi-point drop across Noida and Delhi? A: Yes. Custom route extensions are arranged when you book, and the fare is confirmed before travel.
- **agra-to-jaipur-cab** — Q: Can we halt at Bharatpur Bird Sanctuary mid-way? A: Yes. It is on the NH21 route; a 1–2 hour halt fits if you leave Agra early.
- **agra-to-mathura-vrindavan-taxi** — Q: Will the cab take us to the temple gates? A: No. Heavy-vehicle rules apply inside Vrindavan; the driver drops you at the designated parking nodes.
- **agra-to-lucknow-expressway-taxi** — Q: Are there safe rest stops on the Agra–Lucknow Expressway? A: Yes, monitored plazas with food courts roughly every 100 km.
- **agra-to-gwalior-cab** — Q: What is the Agra–Gwalior road like? A: NH44 through the Chambal region, 120 km in about 2.5 hours — a comfortable same-day return.
- **agra-to-kanpur-taxi** — Q: How long is Agra to Kanpur? A: 280 km, about 5 hours. **[VERIFY fare from the live page — no consistent figure in code.]**
- **agra-to-haridwar-rishikesh-taxi** — Q: Can Haridwar and Rishikesh be done in one trip? A: Yes, as a 2-day trip — Haridwar day 1, Rishikesh day 2 — with the same car and driver.
- **agra-to-ayodhya-dham-taxi** — Q: How long is Agra to Ayodhya? A: 480 km, about 7 hours via the Agra–Lucknow Expressway. Plan 2 days.
- **agra-to-bharatpur-gateway-taxi** — Q: Is Bharatpur a separate trip or a stop? A: Both. It is 55 km, 1.2 hours from Agra as a half-day trip, and a natural stop on the Agra–Jaipur route.

---

## 8. Airport & station transfers — `TransferDetailPage.tsx`

**Template problem today:** the same 9 FAQs (fare, delays, meeting point, night, 28%, cancellation, luggage, stopovers, breakdown) repeat on every transfer page. Keep fare / delay / meeting-point / luggage, delete the rest to `/faq/`, and add the transfer-specific question below.

### 8a. Delhi IGI Airport ⇄ Agra (`delhi-airport`, sedan ₹3,499, Ertiga ₹4,499, Innova ₹6,499, Tempo ₹9,500, Urbania ₹14,000)

**Q: How long is Delhi IGI Airport to Agra?**
A: 240 km, about 3.5 hours via the Yamuna Expressway. The driver meets you at the arrivals curb of your terminal with a name board.

**Q: What if my flight lands late?**
A: Give the flight number when booking. The driver tracks the flight and waits up to 60 minutes free at the terminal pickup bay.

**Q: Can the airport taxi stop for food on the Yamuna Expressway?**
A: Yes. The driver can halt at the expressway food courts — Haldiram's, Costa Coffee or Starbucks — at no extra charge for the stop itself.

### 8b. Agra Cantt Station Transfer (`agra-cantt-station-transfer`, 15 km radius, 30–45 min)

**Q: Where exactly do I meet the driver at Agra Cantt?**
A: At the main exit taxi parking bay, with your name board. Agra Cantt is busy, so a fixed meeting point beats "meet me outside" — confirm it on WhatsApp before the train arrives.

**Q: Which Agra stations do you serve?**
A: Agra Cantt (AGC), Agra Fort (AF) and Raja Ki Mandi. Give the train number and the driver tracks its running status.

**Q: Can I go straight from the station to the Taj Mahal?**
A: Yes. Agra Cantt is about 6 km from the Taj Mahal, so a station-to-Taj transfer makes sense if your itinerary is tight.

### 8c. Agra Airport (AGR / Kheria) Transfer

**Q: How far is Agra Airport from the Taj Mahal?**
A: About 12 km, 25–30 minutes. A sedan airport transfer is the usual booking; give the flight number so the driver times the pickup.

**Q: Are there flights into Agra Airport every day?**
A: No, Agra Airport has limited flights. Check your flight status before booking the transfer, and give the flight number so delays are tracked.

---

## 9. Vehicles — `VehicleDetailPage.tsx` + `FleetPage.tsx`

**Template problem today:** the same 6 FAQs (per-km rate, 300 km, child seats, night, 28%, breakdown) repeat on every vehicle page. Keep per-km / 300 km / luggage, delete the rest to `/faq/`, and add the vehicle-specific questions below. Fleet page keeps only the Ertiga-vs-Innova and yellow-plate questions.

### 9a. Sedan — Dzire / Etios / City (4+1, 2 large + 2 small bags)

**Q: How many people fit in a sedan?**
A: 4 passengers plus the driver. A fifth passenger needs an Ertiga or Innova.

**Q: Is a sedan enough for Agra–Delhi?**
A: Yes, for 2–3 people with 2 large suitcases. It is the cheapest option on the Yamuna Expressway and the standard car for the ₹3,499 Agra–Delhi fare.

**Q: What is included in the sedan's per-km outstation rate?**
A: Vehicle, chauffeur and fuel from the pickup point. Tolls and state taxes are billed at actuals on round trips, or included in fixed one-way fares. **[VERIFY — see conflict #2]**

### 9b. Ertiga MPV (6+1, 3 medium + 2 cabin bags)

**Q: When should I choose an Ertiga over a sedan?**
A: For 4–6 people, or 3 people with heavy luggage. It costs less than an Innova Crysta and fits where a Tempo Traveller cannot.

**Q: Does the Ertiga have a separate luggage boot?**
A: It has limited boot space with all 6 seats up. For 4 large suitcases, take the Innova Crysta instead.

### 9c. Innova Crysta (6+1, 4 large trolley bags)

**Q: What is the difference between Ertiga and Innova Crysta?**
A: Both seat 6, but the Innova has a heavier chassis, better highway suspension, captain seats and a real luggage space behind the third row. The Ertiga is lighter and cheaper, for light luggage.

**Q: Is the Innova Crysta better for hill trips?**
A: Yes. Its suspension and ground clearance handle hill roads to Mussoorie and Himachal better than a sedan or Ertiga.

### 9d. Tempo Traveller 12–17 seater (12 seats, 8 large bags)

**Q: How many people fit in a Tempo Traveller?**
A: 12–17, depending on the vehicle. For more than 17, book two Travellers or a bus — one vehicle cannot legally carry more than its registered seats.

**Q: How much luggage fits in a Tempo Traveller?**
A: 8 large suitcases in the rear bay, plus cabin bags inside. A roof carrier with a waterproof cover is available on request for extra bags.

**Q: Is a Tempo Traveller charged the same for one-way and round-trip?**
A: Yes, per kilometre — a one-way drop costs the same as a round trip, because the vehicle has to return to Agra either way.

**Q: Does a Tempo Traveller have pushback seats and AC vents?**
A: Yes, pushback seats, individual AC vents, a music system and charging points. The 300 km/day outstation minimum applies.

### 9e. Force Urbania Luxury Van (10+1)

**Q: When should I book an Urbania instead of a Tempo Traveller?**
A: For 8–10 people who want more comfort than a Tempo — wider seats, quieter cabin and a premium finish — on a wedding, corporate or family trip.

**Q: How many bags fit in an Urbania?**
A: 8–10 large suitcases, depending on the seating layout. Confirm the bag count when booking so the right layout is sent.

### 9f. Fleet page (`/en/fleet/`)

**Q: Are all your vehicles yellow-plate commercial cabs?**
A: Yes. Every vehicle has a commercial yellow plate, an All-India Tourist Permit, a fitness certificate and comprehensive passenger insurance.

**Q: Do you provide child seats?**
A: Yes, infant and booster seats are available on advance request at no extra cost. Ask when booking, not on the day.

**Q: Can I request a specific car model?**
A: Yes — Dzire, Etios, Innova Crysta or a specific Tempo Traveller. If that exact vehicle is unavailable, we confirm the replacement with you before the trip.

---

## 10. Rental, Services, Reviews, Contact

### 10a. Car Rental page (`/rental`, `RentalPage.tsx`) — 4 questions, keep as-is in meaning, rewritten short

**Q: Do I pay online to submit a rental enquiry?**
A: No. It is a call-first enquiry — availability and quote are confirmed by phone before any booking is finalised.

**Q: Can I request a specific car model?**
A: Yes. Pick the model in the form, or choose flexible assignment within that group.

**Q: Are rental vehicles chauffeur-driven?**
A: Yes, all of them. There is no self-drive option — every rental comes with a verified commercial chauffeur.

**Q: Where can I be picked up?**
A: Doorstep pickup anywhere in Agra, including Agra Cantt station, Kheria Airport, hotels and homes.

### 10b. Services page (`/en/services/`)

**Q: What taxi services do you run in Agra?**
A: Local sightseeing, one-way outstation cabs, round trips, airport and station transfers, Tempo Traveller hire, and multi-day tour packages — all chauffeur-driven, 24×7.

**Q: Do you run one-way cabs outside Agra?**
A: Yes, to Delhi, Jaipur, Mathura, Lucknow, Gwalior, Haridwar, Ayodhya and 40+ cities. One-way means you pay only for the leg you travel.

**Q: Do you arrange guides and hotels too?**
A: Guides, yes — licensed guides on request. Hotels, no — we suggest options, but the hotel booking is yours.

### 10c. Reviews page (`/en/reviews/`)

**Q: Are these reviews from real travellers?**
A: Yes. Reviews are from confirmed bookings, with the trip and date attached. **[VERIFY — if any review on the page has no booking attached, remove that claim.]**

**Q: Can I leave a review after my trip?**
A: Yes. A review link is sent on WhatsApp after the trip ends, and it takes under a minute.

### 10d. Contact / About

**Q: How do I reach SK Baghel Tour and Travels?**
A: Call or WhatsApp the number on this page, or use the booking form. The dispatch desk is at Taj Ganj, Agra, and answers 24×7.

**Q: How far in advance should I book?**
A: At least 2 hours before pickup on a normal day, the night before for a sunrise start, and earlier on festival weekends when cars sell out.

---

## 11. What NOT to put in FAQs

- The same answer on two pages. If it fits two pages, it belongs on `/faq/` and both pages link there.
- A fare that differs from the fare card on the same page. Google's FAQ guidance and its spam policies both treat mismatched visible text and schema as a problem.
- Ticket prices, timings or "best time" claims with no source. ASI changes Taj Mahal prices and hours; re-check asi.payumoney.com and tajmahal.gov.in every quarter.
- "Best taxi in Agra", "No. 1", "100% safe / guaranteed" claims with no evidence. The site's own 2026-10-29 AI-slop audit flagged exactly this language — plain fares and plain facts rank and convert better.
- Questions nobody asked. Every question above traces to a real "People also ask" / competitor FAQ / traveller question found in the research for this file. If a question has no search demand and no customer ever asked it, it does not go on the page.

---

## 12. SEO rules to score the site — 100-point checklist

Score each rule 0 / 1 (fail / pass). 90+ = healthy, 70–89 = fix the fails in order, below 70 = do not add new pages until the fails are fixed. Check with: Google Search Console (GSC), RustySEO / Screaming Frog crawl, PageSpeed Insights, Rich Results Test, and the live page itself. **Known status from the 16 Oct 2026 full audit and the 20 Oct turnaround report is noted where it still applies — re-verify live, do not trust the old report.**

### A. Crawl & index — 20 points

| # | Rule | How to check | SK Baghel status (re-verify) |
|---|---|---|---|
| A1 | Google can reach every important page (no robots.txt block) | GSC → Pages → check "Blocked by robots.txt" = 0 for /en/ pages | Staging host `skbagheltravels-customer.coccoder999.workers.dev` was indexable — must be noindex / blocked |
| A2 | Sitemap lists only live, indexable, canonical URLs | Open sitemap.xml, spot-check 10 URLs return 200 | Was 52 → 1,813 URLs (mostly near-duplicate routes); decision: wipe + gated republish, keep ~64 |
| A3 | Sitemap, canonical and hreflang all point to `.com`, never staging | View source on 5 pages | Was pointing to workers.dev staging — P0 fix from 20 Oct |
| A4 | Every indexable page returns 200; no soft 404s | Crawl export, status codes | 52/52 were 200 in Oct audit |
| A5 | 404 pages return a real 404 status (not 200) | Visit a bad URL, check status | Passed in Oct audit |
| A6 | One canonical URL per page; no duplicate URL versions indexed | GSC → URL Inspection → Google-selected canonical = declared canonical | Duplicate /en-less catalog links were a known issue |
| A7 | No `noindex` on a page that is in the sitemap | Crawl: compare sitemap vs noindex list | — |
| A8 | HTTPS everywhere; no mixed content | Browser padlock + crawl | — |
| A9 | Mobile version is the version Google indexes (mobile-first) | GSC → Mobile Usability, 0 errors | — |
| A10 | Pages are in GSC index, not "Crawled — currently not indexed" or "Discovered — not crawled" | GSC → Pages report, per-URL | GSC was not set up as of 20 Oct — set it up first (Domain property, DNS TXT via Cloudflare, submit .com sitemap) |
| A11 | No doorway / near-duplicate pages indexed (same content, different city swapped in) | Crawl: compare word count + text similarity across route pages | The 1,813-URL problem; allowlist ~70–90, rest 301 / retire |
| A12 | Redirects are 301, single-hop, to a live page | Crawl redirect chains | Redirect plan in `redirect-plan-2026-10-20.csv` |
| A13 | No redirect chains or loops | Crawl | — |
| A14 | No orphan pages (important pages have at least one internal link) | Crawl: inlinks = 0 | — |
| A15 | No pages blocked by `robots.txt` that are linked internally | robots.txt vs internal links | — |
| A16 | `hreflang` (if used) has return links and matching canonicals | Crawl hreflang errors | hreflang was pointing to staging |
| A17 | Trailing-slash / www / http variants all redirect to one version | Visit the 4 variants of the homepage | — |
| A18 | XML sitemap is under 50,000 URLs and under 50 MB, and is referenced in robots.txt | Sitemap file | 1,813 URLs — under the limit, but the quality, not the count, is the problem |
| A19 | New / changed pages are submitted for indexing (or sitemap pinged) | GSC → URL Inspection → Request indexing | — |
| A20 | No manual action / security issue in GSC | GSC → Security & Manual Actions | — |

### B. On-page — 25 points

| # | Rule | How to check |
|---|---|---|
| B1 | One unique `<title>` per page, naming this page (city + service + brand), ~50–60 characters | Crawl: duplicate titles = 0 |
| B2 | Titles are not lowercase and do not start with a digit | Crawl: 13/52 pages had lowercase or digit-start titles in Oct audit — re-check |
| B3 | One unique meta description per page, matching the page, ~120–160 characters | Crawl: duplicate descriptions = 0 |
| B4 | Exactly one H1 per page, matching the title's promise | Crawl: H1 count = 1, 52/52 passed in Oct audit |
| B5 | H2/H3 outline the page; no skipped levels, no keyword-stuffed headings | View page outline |
| B6 | URL is short, readable, lowercase, hyphenated, no typo slugs | Crawl: `fatehbad` typo slugs returned 404 in Oct audit — remove or 301 them |
| B7 | First paragraph answers the page's main question in 1–2 sentences | Read the page |
| B8 | Every page has ≥300 words of useful, page-specific text | Crawl: word count; 52/52 passed in Oct audit, but route pages are template text |
| B9 | No near-duplicate body text across pages (same paragraph on 10+ pages = fail) | Text-similarity check across templates |
| B10 | Fare on the page = fare in the FAQ = fare in the schema (for that page's vehicle model) | Compare the three on 5 pages. Different pages may legitimately show different fares — that is per-model pricing, not an error. |
| B11 | Prices, times and ticket figures are current and sourced (ASI for monument prices) | Check against asi.payumoney.com quarterly |
| B12 | Images have descriptive alt text; no empty alt on a meaningful image | Crawl: empty alt = 0 on content images; hero alt was empty in Oct audit |
| B13 | Images have width/height (no layout shift) | Crawl: only 2/30 homepage images had them in Oct audit |
| B14 | Images are compressed, modern format (WebP/AVIF), lazy-loaded below the fold | PageSpeed → Opportunities |
| B15 | Internal links use descriptive anchor text, not "click here" | Crawl anchor text |
| B16 | Every important page links to its parent (Home → Packages → Package) and to `/faq/` where policy is mentioned | Click through |
| B17 | No broken internal links (404) | Crawl: internal 404 = 0 |
| B18 | No broken outbound links | Crawl: external 404 = 0 |
| B19 | Contact / phone / WhatsApp is the same on every page (NAP consistency) | Compare header, footer, Contact page |
| B20 | No keyword stuffing: city/service name reads naturally, not repeated in every sentence | Read the page aloud |
| B21 | No hidden text, no cloaking, no auto-generated filler | View source vs rendered page |
| B22 | Page works without JavaScript for the core content (Google renders, but the fare + FAQ must be in the HTML) | View source: fare and FAQ text present in HTML, not only after JS |
| B23 | Language of the page matches its `lang` / hreflang | View source |
| B24 | No duplicate H1/H2 text across different pages | Crawl |
| B25 | Each page targets ONE intent (one city pair, one package, one monument) — not three intents on one URL | Read the title + H1 + first paragraph together |

### C. Content & FAQ quality — 20 points

| # | Rule | How to check |
|---|---|---|
| C1 | Each FAQ question is a real question people ask (search demand, "People also ask", customer messages) | Check the question in Google; it should appear as a suggestion or PAA |
| C2 | Each FAQ answer is self-contained (readable without the page) | Read the answer alone |
| C3 | Answer first, explanation after; ≤2 sentences | Count sentences per answer |
| C4 | No FAQ answer repeats another page's FAQ answer word-for-word | Text comparison across FAQ blocks |
| C5 | Generic policy FAQs appear only on `/faq/`, nowhere else | Search the codebase for the policy answer text |
| C6 | Each page has 4–8 FAQs, all specific to that page | Count per page |
| C7 | FAQ answers contain the page's own facts (its distance, its fare, its stops), not generic claims | Read 3 answers per page |
| C8 | No superlatives without evidence ("best", "No. 1", "100% safe") | Search the page for best / No. 1 / guaranteed |
| C9 | Content is people-first: it helps the traveller decide, not just rank | Would a traveller book after reading it? |
| C10 | No AI-slop template language ("verified chauffeur fleet", "dispatch corridor", "two decades") | Compare against the 29 Oct 2026 AI-slop audit; plain Agra–Delhi page is the house style |
| C11 | Dates, prices and hours are current; no "2024" or stale year in copy | Search the page for old years |
| C12 | Reviews shown are real, with trip/date; no invented testimonials | Check the review source |
| C13 | No copied text from competitors | Spot-check a sentence in Google (quoted search) |
| C14 | Local details are correct (station codes AGC/AF, gate names, distances) | Verify against a map / official source |
| C15 | Every claim that needs a source has one (ASI for tickets, official for hours) | Check the claim's source |
| C16 | Content is updated when the fact changes (fare, ticket price, Friday closure) | Last-updated date on the page |
| C17 | No thin pages: a page with only a fare table + FAQs and <300 words of real text is not indexable | Word count per page |
| C18 | No auto-generated city-swap pages (same text, only the city name changed) | Text similarity across route pages |
| C19 | Images are real photos of Agra / the vehicle, with photographer + source + licence recorded | Check the image credits file |
| C20 | The page answers the question its title promises — no bait title, different content | Read title, then read the page |

### D. Structured data (schema) — 10 points

| # | Rule | How to check |
|---|---|---|
| D1 | Valid JSON-LD, no errors | Rich Results Test + Schema validator, per template |
| D2 | FAQPage schema matches the visible FAQ text exactly (same questions, same answers) | Compare schema vs rendered FAQ |
| D3 | **FAQ rich results are NOT expected in Google for this site** — since Aug 2023 Google shows FAQ rich results only to well-known government/health sites, and Google's FAQ documentation was removed in June 2026. Keep FAQPage schema for AI/search understanding, but do not score the site on getting FAQ accordions in results. | Google Search Central — FAQPage guidance |
| D4 | LocalBusiness / TravelAgency schema on the homepage with correct name, phone, address, opening hours | Rich Results Test on `/` |
| D5 | Review / AggregateRating schema only if real reviews exist on that page, with a real rating value | No AggregateRating/Review schema existed in Oct audit despite visible reviews — add only with real review data |
| D6 | BreadcrumbList on every page, matching the visible breadcrumb | Rich Results Test; was 35/52 in Oct audit |
| D7 | TouristTrip / Product schema only where the page is a real bookable trip, with a real price | Was 9/52 in Oct audit |
| D8 | No schema for content that is not on the page (no fake reviews, no fake prices) | Compare schema vs page |
| D9 | One schema graph per page, no duplicate or conflicting types | View source |
| D10 | Canonical URL in schema = page canonical | View source |

### E. Local SEO & trust (E-E-A-T) — 10 points

| # | Rule | How to check |
|---|---|---|
| E1 | Google Business Profile exists, verified, same name / phone / address as the site | Search "SK Baghel Tour and Travels Agra" on Google Maps |
| E2 | NAP (name, address, phone) identical on site, GBP and listings | Compare the three |
| E3 | Real business address and phone on the Contact page, not only a form | Read the Contact page |
| E4 | About page says who runs the business, since when, and where (no invented "two decades" — About says Since 2009 / 15+ years; use that) | Read the About page |
| E5 | Real reviews, replied to, on Google and on the site | Check GBP reviews |
| E6 | Author / business identity is visible (not an anonymous site) | Footer + About |
| E7 | Privacy, Terms and Cancellation pages exist and are linked from the footer | Click footer links |
| E8 | Secure payment / booking flow named (UPI, card) with no card details collected on the site itself | Read the booking flow |
| E9 | No fake badges, awards or affiliations | Check every badge on the homepage against its issuer |
| E10 | HTTPS + contact + address together signal a real Agra business, not a doorway site | Overall read |

### F. Speed, mobile & UX — 10 points

| # | Rule | How to check |
|---|---|---|
| F1 | PageSpeed mobile Performance ≥90 on the homepage (target 100, per Tarun's directive — but never by removing design/animation) | PageSpeed Insights; staging home was Mobile 60 / Desktop 90 in Oct |
| F2 | Largest Contentful Paint <2.5 s on mobile | PageSpeed / CrUX |
| F3 | No layout shift (CLS <0.1) | PageSpeed |
| F4 | Page is usable on a phone: tap targets, readable text, no horizontal scroll | Test on a real phone |
| F5 | FAQ accordion works on mobile and the answer text is in the HTML (not loaded only on click) | View source + tap test |
| F6 | Booking / WhatsApp button is visible without scrolling on mobile | Load the page on a phone |
| F7 | No intrusive interstitial blocking the content | Load the page |
| F8 | Fonts and images do not block first paint | PageSpeed → Opportunities |
| F9 | 404 page helps the visitor (search, popular routes, home link) | Visit a bad URL |
| F10 | Site search / navigation finds every package and route in ≤2 taps | Try it |

### G. Links & authority — 5 points

| # | Rule | How to check |
|---|---|---|
| G1 | No bought / spammy backlinks; no link schemes | GSC → Links → top linking sites, review for spam |
| G2 | Real mentions: local Agra listings, travel directories, hotel partners link to the site | Search the brand name |
| G3 | Internal linking: every route page links to its package, vehicle and `/faq/` pages | Crawl internal links |
| G4 | Outbound links go to official sources only (ASI, tajmahal.gov.in, IRCTC) where cited | Check outbound links |
| G5 | No broken or redirected backlinks from the site's own pages | Crawl |

**How to score:** run the crawl + GSC + PageSpeed checks, mark each rule 0/1, add up. Fix in this order: A (crawl/index) → B10 + C4/C5 (fare + FAQ duplication) → D2/D5 (schema truth) → B1/B2 (titles) → F1 (speed). Do not add new route pages until A11 and C18 pass.

---

## Sources

- Google Search Central: Search Essentials, SEO Starter Guide, FAQPage structured data guidance (FAQ rich results restricted to government/health sites since Aug 2023; FAQ documentation removed June 2026).
- ASI / tajmahal.gov.in via competitor pages checked Oct–Nov 2026: Taj Mahal ₹50 Indian / ₹540 SAARC / ₹1,100 foreign + ₹200 mausoleum, under-15 free, closed Friday, open 30 min before sunrise to 30 min before sunset, night viewing 5 nights/month.
- Competitor FAQ research (Nov 2026): trivenicabs.in, tajmahalcabs.com, taxiyatri.com, chikucab.com / chikucabs.com, hellomycabs.com, oneway.cab, vedanshicabs.com, babataxiservice.com, indiatourhirecaranddriver.com, brajbhoomitourandtravels.com, vrindavantoursandpackages.com, mathuravrindavantaxiservices.com, agrabeyondtaj.com, delhitoagratour.com, discoverindiabycar.com.
- Site's own code and audits: `~/workspace/seo-audit/SEO-FULL-AUDIT-2026-10-16.md`, `~/workspace/your_files/sk-baghel-seo-turnaround-report-2026-10-20.md`, `~/workspace/your_files/sk-baghel-ai-slop-audit-2026-10-29.md`.
- **Note on competitor fares in this file:** competitor prices are shown only to prove what questions people ask. Never copy a competitor's fare into an SK Baghel FAQ — use SK Baghel's own published fare, and fix the conflicts in § "STOP" first.
