import { contact } from "../data/contact";
import { prices } from "../data/prices";
import { JsonLd, buildBreadcrumbSchema, buildGraphSchema, buildLocalBusinessSchema } from "../components/seo/JsonLd";
import { SEO_LANDING_SLUGS, SEO_ROUTE_MAP, type SeoLandingSlug } from "../data/seoLandingSlugs";
import { RichLandingPage } from "../components/RichLandingPage";
export { SEO_LANDING_SLUGS } from "../data/seoLandingSlugs";

const seaterBestFor: Record<string, string> = { "12": "Small families and airport transfers", "16": "Wedding guest shuttles and day trips", "18": "Wedding parties and group tours", "20": "Corporate offsites", "24": "Baraat and large groups" };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const cityTitle = (slug: string) => slug.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");

function pageModel(slug: SeoLandingSlug) {
  const seater = slug.match(/^(12|16|18|20|24)-seater/)?.[1];
  if (slug === "tempo-traveller-on-rent-agra" || seater) {
    const label = seater ? `${seater}-Seater Tempo Traveller on Rent in Agra` : "Tempo Traveller on Rent in Agra";
    const opening = seater
      ? `A ${seater}-seater tempo traveller in Agra costs ₹${prices.fleet_per_km.tempo_traveller} per km with Agra SK Baghel Tour and Travels. It is suited to ${seaterBestFor[seater].toLowerCase()}, with pushback seating and luggage space. Driver allowance, minimum km/day and night halt charges are confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`
      : `Hiring a tempo traveller in Agra costs ₹${prices.fleet_per_km.tempo_traveller} per km with Agra SK Baghel Tour and Travels. Choose from 12, 16, 18, 20 and 24-seater options for weddings, corporate trips and group sightseeing, with verified drivers and pushback seats. Driver allowance, minimum km/day and night halt charges are confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`;
    return { title: label, meta: `${label} from ₹${prices.fleet_per_km.tempo_traveller}/km. Pushback seats, verified drivers and group travel options. Call or WhatsApp to book.`, opening, table: seater ? <table><caption>{label} details</caption><thead><tr><th>Seating</th><th>Price per km</th><th>Best for</th></tr></thead><tbody><tr><td>{seater}-seater</td><td>{money(prices.fleet_per_km.tempo_traveller)}/km</td><td>{seaterBestFor[seater]}</td></tr></tbody></table> : <table><caption>Tempo traveller rates in Agra</caption><thead><tr><th>Seater</th><th>Price per km</th><th>Best for</th></tr></thead><tbody>{Object.entries(seaterBestFor).map(([size, best]) => <tr key={size}><td>{size}-seater</td><td>{money(prices.fleet_per_km.tempo_traveller)}/km</td><td>{best}</td></tr>)}</tbody></table>, questions: seater ? [`What is the per km rate for a ${seater}-seater tempo traveller in Agra?`, "Are there any additional charges beyond the per km rate?", "Is a minimum distance required for booking?", "Is this tempo traveller suitable for outstation trips from Agra?"] : ["What is the per km rate for a tempo traveller in Agra?", "Which tempo traveller size should I choose?", "Is there a minimum distance or duration required?", "Can I take the tempo traveller out of Agra?"] };
  }

  if (slug === "innova-crysta-rental-in-agra") {
    return {
      title: "Innova Crysta Rental in Agra | Luxury SUV Cab Service",
      meta: `Rent an Innova Crysta in Agra for outstation tours, weddings, and family trips. Luxury 6+1 and 7+1 AC cabs from ${money(prices.fleet_per_km.innova_crysta)}/km. Call ${contact.phoneDisplay}.`,
      opening: `Enjoy premium comfort with an elite Innova Crysta rental in Agra, ideal for corporate travelers, VIP delegations, weddings, or family tours of 6–7 passengers. Chauffeur-driven with captain seats, dual air-conditioning, ample luggage capacity, and 100% transparent billing.`,
      table: <table><caption>Innova Crysta Hire Rates in Agra</caption><thead><tr><th>Trip Type</th><th>Capacity</th><th>Rate / Fare</th><th>Inclusions</th></tr></thead><tbody><tr><td>Outstation (per km)</td><td>6+1 Seats</td><td>{money(prices.fleet_per_km.innova_crysta)}/km</td><td>AC, chauffeur, fuel</td></tr><tr><td>Local 8h / 80km</td><td>6+1 Seats</td><td>₹3,500</td><td>City monuments, fuel</td></tr><tr><td>Agra to Delhi Drop</td><td>6+1 Seats</td><td>₹4,800</td><td>Yamuna Expressway toll included</td></tr></tbody></table>,
      questions: ["How many passengers fit comfortably in an Innova Crysta?", "What is the per-km rate for an outstation trip from Agra?", "Are expressway tolls included in outstation fares?", "Can I book an Innova Crysta for wedding ceremonies in Agra?"]
    };
  }

  if (slug === "ertiga-taxi-booking-agra") {
    return {
      title: "Ertiga Taxi Booking Agra | Affordable Family MPV Cab",
      meta: `Book an Ertiga taxi in Agra for economical group travel. Spacious 6-seater AC cab from ${money(prices.fleet_per_km.ertiga)}/km. Call or WhatsApp to book.`,
      opening: `Book an Ertiga taxi in Agra for economical group travel without compromising on air-conditioned space. Perfect for small families of 5–6 passengers traveling to Delhi, Jaipur, Mathura, or local Agra monuments with verified local chauffeurs.`,
      table: <table><caption>Maruti Ertiga Rates in Agra</caption><thead><tr><th>Service</th><th>Seats</th><th>Pricing</th><th>Best For</th></tr></thead><tbody><tr><td>Outstation</td><td>5+1 / 6+1</td><td>{money(prices.fleet_per_km.ertiga)}/km</td><td>Intercity highways</td></tr><tr><td>Local Full Day</td><td>5+1 / 6+1</td><td>₹2,800</td><td>Agra local sightseeing</td></tr><tr><td>Delhi Airport Drop</td><td>5+1 / 6+1</td><td>₹4,200</td><td>Direct terminal delivery</td></tr></tbody></table>,
      questions: ["Is the Maruti Ertiga spacious enough for luggage and 5 passengers?", "What is the minimum km per day for outstation trips?", "How do I confirm an Ertiga cab on WhatsApp?"]
    };
  }

  if (slug === "agra-local-sightseeing-taxi") {
    return {
      title: "Agra Local Sightseeing Taxi | Same Day Taj Mahal Tour Package",
      meta: `Hire a local sightseeing taxi in Agra. Low-cost customized day packages covering Taj Mahal, Agra Fort, Baby Taj, and Mehtab Bagh with professional local driver-guides.`,
      opening: `Maximize your time in the city of love with our curated Agra local sightseeing taxi packages. Skip the chaotic local transport and enjoy a personalized, chauffeur-driven journey around the region's architectural marvels. Doorstep pickup across Agra hotels and railway stations.`,
      table: <table><caption>Agra Local Sightseeing Taxi Packages</caption><thead><tr><th>Package Duration</th><th>Sedan (4+1)</th><th>Ertiga (6+1)</th><th>Innova Crysta</th></tr></thead><tbody><tr><td>Half Day (4h / 40km)</td><td>₹1,400</td><td>₹1,800</td><td>₹2,400</td></tr><tr><td>Standard Day (8h / 80km)</td><td>{money(prices.local_packages["8h_80km"])}</td><td>₹2,400</td><td>₹3,200</td></tr><tr><td>Full Day Extended (12h / 120km)</td><td>{money(prices.local_packages["12h_120km"])}</td><td>₹2,800</td><td>₹3,800</td></tr></tbody></table>,
      questions: ["Which monuments are covered in the 8-hour Agra tour?", "Are parking charges and fuel included in the sightseeing fare?", "Can the driver pick us up from Agra Cantt railway station?", "Can we customize the monument sequence?"]
    };
  }

  if (slug === "taj-mahal-sunrise-tour-package-by-car") {
    return {
      title: "Taj Mahal Sunrise Tour Package by Car | Early Dawn Pickup Agra",
      meta: `Book a Taj Mahal sunrise tour package by car. Early morning hotel pickup, verified guide, and priority gate access. Chilled AC cabs from ${money(prices.tours.taj_sunrise)}.`,
      opening: `Witness the morning light over the ivory monument with convenient early doorstep pickup from any Agra hotel. Our Taj Mahal sunrise tour package by car ensures timely arrival at 5:30 AM before tourist crowds gather, complete with licensed guide assistance and verified chauffeurs.`,
      table: <table><caption>Sunrise Tour Itinerary & Vehicle Options</caption><thead><tr><th>Time</th><th>Milestone</th><th>Included Fleet Tiers</th></tr></thead><tbody><tr><td>05:30 AM</td><td>Hotel Pickup across Agra</td><td>Sedan / Ertiga / Innova</td></tr><tr><td>06:00 AM</td><td>Taj Mahal East Gate Arrival</td><td>Contactless ticket scan</td></tr><tr><td>08:30 AM</td><td>Breakfast stopover</td><td>Chilled AC vehicle custody</td></tr><tr><td>10:00 AM</td><td>Agra Fort / Baby Taj</td><td>Optional continuation</td></tr></tbody></table>,
      questions: ["What time does the sunrise tour start from Agra hotels?", "Is the Taj Mahal open on Fridays for sunrise tours?", "Are monument entrance tickets included in the car package?", "Can we visit Mehtab Bagh after the sunrise tour?"]
    };
  }

  if (slug === "agra-cantt-railway-station-taxi-service") {
    return {
      title: "Agra Cantt Railway Station Taxi Service | 24x7 Pickup & Drop",
      meta: `Book reliable Agra Cantt railway station taxi service. Direct transfers to Taj Mahal, Agra Fort, and hotels timed with Gatimaan & Shatabdi Express. Sedan from ${money(prices.routes_oneway.agra_cantt)}.`,
      opening: `Arriving at Agra Cantt railway station? Agra SK Baghel Tour and Travels provides prompt, reliable station pickup service timed with Gatimaan Express, Shatabdi Express, and Vande Bharat arrivals with zero waiting fee for train delays.`,
      table: <table><caption>Agra Cantt Station Transfer Fares</caption><thead><tr><th>Destination</th><th>Sedan</th><th>Ertiga</th><th>Innova Crysta</th></tr></thead><tbody><tr><td>Taj Mahal East / West Gate</td><td>{money(prices.routes_oneway.agra_cantt)}</td><td>₹999</td><td>₹1,499</td></tr><tr><td>Fatehabad Road Hotel Zone</td><td>{money(prices.routes_oneway.agra_cantt)}</td><td>₹999</td><td>₹1,499</td></tr><tr><td>Day Sightseeing (8h / 80km)</td><td>{money(prices.local_packages["8h_80km"])}</td><td>₹2,400</td><td>₹3,200</td></tr></tbody></table>,
      questions: ["Will the driver hold a nameboard at Agra Cantt platform exit?", "What if our train arrives late?", "Can we start our sightseeing tour directly from the railway station?"]
    };
  }

  if (slug === "agra-to-delhi-airport-cab-booking") {
    return {
      title: "Agra to Delhi Airport Cab Booking | Direct IGI Drop from ₹3,499",
      meta: `Direct Agra to Delhi Airport cab booking. Fast transit via Yamuna Expressway to IGI Terminal 1, 2, and 3. All expressway tolls included. 24x7 flight drop.`,
      opening: `Stress-free Agra to Delhi Airport cab booking ensuring you reach your flight on time. Direct pickup from any hotel or residence in Agra with flat rates via the Yamuna Expressway and dedicated commercial chauffeurs.`,
      table: <table><caption>Agra to IGI Airport (T1/T2/T3) Taxi Fares</caption><thead><tr><th>Vehicle Tier</th><th>Seating</th><th>Fare (Tolls Included)</th><th>Transit Time</th></tr></thead><tbody><tr><td>Sedan (Dzire/Etios)</td><td>4+1</td><td>{money(prices.routes_oneway.delhi_igi)}</td><td>3.5 Hours</td></tr><tr><td>Ertiga MPV</td><td>6+1</td><td>₹4,200</td><td>3.5 Hours</td></tr><tr><td>Innova Crysta</td><td>6+1</td><td>₹5,200</td><td>3.5 Hours</td></tr></tbody></table>,
      questions: ["How long does a taxi take from Agra to Delhi IGI Airport?", "Are Yamuna Expressway tolls included in the fare?", "Can the driver drop us directly at Terminal 3 International Departures?"]
    };
  }

  const routeMap: Record<string, { from: string; to: string; fare: number }> = {
    "delhi-to-agra-taxi": { from: "Delhi", to: "Agra", fare: prices.routes_oneway.delhi_igi },
    "agra-to-delhi-taxi": { from: "Agra", to: "Delhi", fare: prices.routes_oneway.delhi_igi },
    "agra-to-jaipur-taxi": { from: "Agra", to: "Jaipur", fare: prices.routes_oneway.jaipur },
    "agra-to-mathura-taxi": { from: "Agra", to: "Mathura", fare: prices.routes_oneway.mathura },
    "agra-to-gwalior-taxi": { from: "Agra", to: "Gwalior", fare: prices.routes_oneway.gwalior },
    "agra-to-lucknow-taxi": { from: "Agra", to: "Lucknow", fare: prices.routes_oneway.lucknow },
    "agra-to-ayodhya-taxi": { from: "Agra", to: "Ayodhya", fare: prices.routes_oneway.ayodhya },
    "agra-to-khatushyamji-taxi": { from: "Agra", to: "Khatushyamji", fare: prices.routes_oneway.khatushyamji },
  };
  if (routeMap[slug]) { const r = routeMap[slug]; return { title: `${r.from} to ${r.to} Taxi | One-Way ${money(r.fare)} | Agra SK Baghel Tour and Travels`, meta: `${r.from} to ${r.to} one-way taxi ${money(r.fare)}. Sedan, Ertiga and Innova Crysta available with verified drivers. Book on WhatsApp.`, opening: `A one-way taxi from ${r.from} to ${r.to} costs ${money(r.fare)} with Agra SK Baghel Tour and Travels. Choose a Sedan (${money(prices.fleet_per_km.sedan)}/km), Ertiga (${money(prices.fleet_per_km.ertiga)}/km) or Innova Crysta (${money(prices.fleet_per_km.innova_crysta)}/km), subject to route confirmation. Call or WhatsApp ${contact.phoneDisplay} to book.`, table: <table><caption>{r.from} to {r.to} one-way fares</caption><thead><tr><th>Vehicle</th><th>Seats</th><th>Per-km rate</th><th>One-way fare</th></tr></thead><tbody><tr><td>Sedan</td><td>4+1</td><td>{money(prices.fleet_per_km.sedan)}/km</td><td>{money(r.fare)}</td></tr><tr><td>Ertiga</td><td>6+1</td><td>{money(prices.fleet_per_km.ertiga)}/km</td><td>Confirm at booking</td></tr><tr><td>Innova Crysta</td><td>6+1</td><td>{money(prices.fleet_per_km.innova_crysta)}/km</td><td>Confirm at booking</td></tr></tbody></table>, questions: [`Is toll included in the ${r.from} to ${r.to} fare?`, `Which vehicles are available from ${r.from}?`, `Do you pick up from ${r.from} airport or railway station?`] }; }
  if (slug === "same-day-agra-tour-from-delhi") return { title: "Same Day Agra Tour from Delhi | Private Car", meta: `Same day Agra tour by car with pickup from Delhi, Noida or Gurgaon. Taj Mahal and Agra Fort with a verified driver. From ${money(prices.tours.same_day_agra)}. Book on WhatsApp.`, opening: `Visit the Taj Mahal and Agra Fort in a single day with pickup from Delhi, Noida, Gurgaon or Ghaziabad. A private car with a verified driver starts from ${money(prices.tours.same_day_agra)}; Delhi-pickup pricing is confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`, table: <table><caption>Sample same-day Agra itinerary</caption><thead><tr><th>Time</th><th>Stop</th></tr></thead><tbody>{[["06:00", "Pickup from Delhi/NCR"], ["09:30", "Taj Mahal"], ["13:00", "Lunch at own expense"], ["14:30", "Agra Fort"], ["18:00", "Drive back via Yamuna Expressway"], ["21:30", "Drop at Delhi"]].map(([time, stop]) => <tr key={time}><td>{time}</td><td>{stop}</td></tr>)}</tbody></table>, questions: ["Can you visit the Taj Mahal and Agra Fort in one day?", "What time should you leave Delhi?", "Private car or train: which is better for Delhi–Agra?", "What is included and excluded in the same-day tour?"] };
  if (slug === "taj-mahal-taxi-service" || slug === "agra-fatehpur-sikri-one-day-tour") return { title: "Taj Mahal Taxi Service Agra | One-Day & Full-Day Cabs", meta: `Book a Taj Mahal taxi in Agra. 8h/80km ${money(prices.local_packages["8h_80km"])}, 12h/120km ${money(prices.local_packages["12h_120km"])}. Near Taj East Gate. Call or WhatsApp.`, opening: `Our Taj Mahal taxi service covers the Taj Mahal, Agra Fort and Mehtab Bagh, with 8-hour/80-km packages at ${money(prices.local_packages["8h_80km"])} and 12-hour/120-km packages at ${money(prices.local_packages["12h_120km"])}. We are based near Taj East Gate. Call or WhatsApp ${contact.phoneDisplay} to book.`, table: <table><caption>Taj Mahal taxi packages in Agra</caption><thead><tr><th>Package</th><th>Hours / km</th><th>Price</th></tr></thead><tbody><tr><td>Taj Mahal Day Trip</td><td>8 hrs / 80 km</td><td>{money(prices.local_packages["8h_80km"])}</td></tr><tr><td>Taj Mahal Full Day</td><td>12 hrs / 120 km</td><td>{money(prices.local_packages["12h_120km"])}</td></tr></tbody></table>, questions: ["What does the one-day Taj Mahal taxi package include?", "Do you provide railway station and airport pickup?", "Can I add Fatehpur Sikri to the day trip?"] };
  return { title: `${cityTitle(slug)} | Agra SK Baghel Tour and Travels`, meta: "Private Agra taxi booking with verified drivers. Call or WhatsApp to confirm availability.", opening: `Private taxi bookings from Agra are available for ${cityTitle(slug)} with verified drivers and clear fare confirmation. Call or WhatsApp ${contact.phoneDisplay} with your date, route and group size.`, table: <table><caption>Booking information</caption><thead><tr><th>Service</th><th>Details</th></tr></thead><tbody><tr><td>Vehicle</td><td>Private chauffeur-driven taxi</td></tr><tr><td>Fare</td><td>Confirmed before booking</td></tr></tbody></table>, questions: ["Which vehicle is right for this journey?", "What is included in the fare?", "How do I book this taxi?"] };
}

export function SeoLandingPage({ slug }: { slug: SeoLandingSlug }) {
  // If the slug is one of our dedicated rich routes, render the dedicated RichLandingPage component
  const richRoute = SEO_ROUTE_MAP[slug];
  if (richRoute) {
    return <RichLandingPage route={richRoute} />;
  }

  const model = pageModel(slug);
  const canonical = `/en/${slug}/`;
  const related = slug.includes("tempo") ? "/en/fleet/" : slug.includes("taxi") ? "/en/routes/" : "/en/packages/";
  const schema = buildGraphSchema(buildLocalBusinessSchema({ includeAggregateRating: false }), buildBreadcrumbSchema([{ name: "Home", url: "/" }, { name: model.title, url: canonical }]));
  return <main id="main-content" className="marketing-page seo-landing-page"><JsonLd schema={schema} /><section className="marketing-hero"><p className="eyebrow">Agra SK Baghel Tour and Travels · Taj Ganj, Agra</p><h1>{model.title.split(" | ")[0]}</h1><p className="hero-copy">{model.opening}</p><div className="hero-actions"><a className="button button-primary" href={`tel:${contact.phone}`}>Call {contact.phoneDisplay}</a><a className="button button-whatsapp" href={`https://wa.me/${contact.whatsapp}?text=Hi%20SK%20Baghel%20Travels%2C%20I%20want%20to%20book`} target="_blank" rel="noreferrer">WhatsApp to book</a></div></section><section className="detail-content"><div className="fare-table-wrap">{model.table}</div><p className="muted-note">Toll, parking, interstate tax, driver allowance and night halt charges are confirmed for the route before booking.</p><h2>What should I know before booking?</h2><p>Call or WhatsApp with your travel date, pickup point, destination and group size. We confirm vehicle availability and the complete fare before the booking is finalized.</p>{model.questions.map((question) => <section key={question}><h2>{question}</h2><p>We provide a direct answer during fare confirmation based on your vehicle, route and travel date. The desk will explain inclusions, timing, pickup options and any applicable extras before you pay.</p></section>)}<h2>How do I book this service?</h2><ol><li>Call or WhatsApp {contact.phoneDisplay} with your date, route and group size.</li><li>We confirm the vehicle, timing and total fare.</li><li>Follow the booking instructions shared by the travel desk.</li></ol><p><a className="text-link" href={related}>Explore related {related.includes("fleet") ? "fleet options" : related.includes("routes") ? "Agra taxi routes" : "Agra tour packages"}</a> · <a className="text-link" href="/en/contact/">Contact the Agra travel desk</a></p></section></main>;
}
