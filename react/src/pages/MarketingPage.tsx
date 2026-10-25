import { contact } from "../data/contact";
import { cities, packages, routes, vehicles, type Package, type Route, type Vehicle } from "../data/catalogue";
import { WhatsAppIcon } from "../components/icons";

type MarketingPageProps = {
  language: "en" | "hi";
  section: string;
};

const copy = {
  en: {
    fleet: ["Our fleet", "Comfortable cars for every kind of journey.", "Choose a vehicle by group size, luggage, and the kind of road ahead."],
    routes: ["Popular routes", "Clear fares from Agra and beyond.", "Compare common outstation journeys and request the vehicle that fits your plan."],
    packages: ["Curated journeys", "See more, without rushing.", "Private, chauffeur-driven itineraries built around Agra's landmarks and nearby cities."],
    services: ["Travel services", "One local team for the whole journey.", "From a Taj Mahal morning to a multi-city transfer, we keep the details simple."],
    contact: ["Contact", "Tell us where you want to go.", "Call or message the local desk and we will help you choose the right car and timing."],
    about: ["About Agra SK Baghel Tour and Travels", "Local knowledge, dependable travel.", "We are an Agra-based travel desk for airport transfers, sightseeing, outstation taxis, and private tours."],
    faq: ["Frequently asked questions", "Straight answers before you book.", "Here are the details travellers usually want to know."],
    fallback: ["Agra SK Baghel Tour and Travels", "Plan your next journey from Agra.", "Explore our services, routes, vehicles, and private tour packages."]
  },
  hi: {
    fleet: ["Our fleet", "Comfortable cars for every kind of journey.", "Choose a vehicle by group size, luggage, and the kind of road ahead."],
    routes: ["Popular routes", "Clear fares from Agra and beyond.", "Compare common outstation journeys and request the vehicle that fits your plan."],
    packages: ["Curated journeys", "See more, without rushing.", "Private, chauffeur-driven itineraries built around Agra's landmarks and nearby cities."],
    services: ["Travel services", "One local team for the whole journey.", "From a Taj Mahal morning to a multi-city transfer, we keep the details simple."],
    contact: ["Contact", "Tell us where you want to go.", "Call or message the local desk and we will help you choose the right car and timing."],
    about: ["About Agra SK Baghel Tour and Travels", "Local knowledge, dependable travel.", "We are an Agra-based travel desk for airport transfers, sightseeing, outstation taxis, and private tours."],
    faq: ["Frequently asked questions", "Straight answers before you book.", "Here are the details travellers usually want to know."],
    fallback: ["Agra SK Baghel Tour and Travels", "Plan your next journey from Agra.", "Explore our services, routes, vehicles, and private tour packages."]
  }
} as const;

const serviceCards = [
  ["Outstation cabs", "Agra to Delhi, Jaipur, Mathura, Gwalior and Lucknow with clear sample fares.", "/en/routes/"],
  ["Local Agra sightseeing", "Taj Mahal, Agra Fort, Mehtab Bagh and the city's heritage corners.", "/en/agra-sightseeing-taxi/"],
  ["Airport transfers", "Doorstep pickup, flight tracking and comfortable drops to Agra or Delhi airports.", "/en/services/"],
  ["Group travel", "Tempo Traveller and Urbania options for families, weddings and corporate groups.", "/en/vehicles/tempo-traveller/"],
  ["Private tour planning", "Chauffeur-driven day trips, overnight stays and Golden Triangle circuits.", "/en/packages/"]
] as const;

const faqItems = [
  ["How does the advance payment work?", "You pay part of the fare after the car is confirmed. The rest is paid to the driver. This React demo never charges anyone."],
  ["Can I cancel?", "Free cancellation is available up to 24 hours before pickup for cabs. Multi-day tours follow their published refund schedule."],
  ["Is fare inclusions?", "Sample fares are shown transparently and a booking receipt is available on confirmed paid bookings."],
  ["What about night driving allowance?", "A ₹300 allowance applies to cars and ₹500 to Tempo Travellers for late-night departures, shown before confirmation."]
] as const;

const legalSections = {
  privacy: [["1. Information collection", "We collect only the contact and journey details needed to answer an enquiry or prepare a mock booking."], ["2. How information is used", "Details are used for travel coordination, fare estimates, customer support and service improvement. No live payment or marketing API is connected in this frontend."], ["3. Contact", "For privacy questions, email bookings@agraskbagheltourandtravels.com."]],
  terms: [["1. Booking and advance", "A booking is confirmed only after availability is checked by the travel desk. The current React flow is a demonstration and does not collect money."], ["2. Fares and inclusions", "Published fares are sample fares. Toll, parking, night allowance and package inclusions are shown before confirmation and may be reconfirmed by the desk."], ["3. Cancellation", "Cab cancellation is free up to 24 hours before pickup. Tour package refunds depend on the published cancellation slab."]]
} as const;

function getPageCopy(language: MarketingPageProps["language"], section: string) {
  const localized = copy[language];
  return localized[section as keyof typeof localized] ?? localized.fallback;
}

function findDetail(pathSection: string, pathname: string): Vehicle | Package | Route | undefined {
  const normalizedSection = pathSection.replace(/\.html$/, "");
  if (pathname.includes("/vehicles/")) {
    const vehicleId = normalizedSection === "innova-crysta" ? "innova" : normalizedSection.replace("tempo-traveller", "tempo");
    return vehicles.find((vehicle) => vehicle.id === vehicleId);
  }
  if (pathname.includes("/packages/")) return packages.find((tour) => tour.slug === pathSection);
  if (pathname.includes("agra-to-delhi-taxi")) return routes.find((route) => route.id === "agra-delhi");
  if (pathname.includes("agra-to-jaipur-taxi")) return routes.find((route) => route.id === "agra-jaipur");
  if (pathname.includes("agra-to-mathura-taxi")) return routes.find((route) => route.id === "agra-mathura");
  if (pathname.includes("agra-to-gwalior-taxi")) return routes.find((route) => route.id === "agra-gwalior");
  if (pathname.includes("agra-to-lucknow-taxi")) return routes.find((route) => route.id === "agra-lucknow");
  if (pathname.includes("delhi-to-agra-taxi")) return routes.find((route) => route.id === "delhi-agra");
  if (pathname.includes("delhi-to-jaipur-taxi")) return routes.find((route) => route.id === "delhi-jaipur");
  if (pathname.includes("agra-se-delhi-taxi")) return routes.find((route) => route.id === "agra-delhi");
  if (pathname.includes("agra-se-jaipur-taxi")) return routes.find((route) => route.id === "agra-jaipur");
  if (pathname.includes("agra-se-mathura-taxi")) return routes.find((route) => route.id === "agra-mathura");
  if (pathname.includes("agra-se-gwalior-taxi")) return routes.find((route) => route.id === "agra-gwalior");
  if (pathname.includes("agra-se-lucknow-taxi")) return routes.find((route) => route.id === "agra-lucknow");
  if (pathname.includes("delhi-se-agra-taxi")) return routes.find((route) => route.id === "delhi-agra");
  if (pathname.includes("delhi-se-jaipur-taxi")) return routes.find((route) => route.id === "delhi-jaipur");
  if (pathname.includes("agra-darshan-taxi")) return routes.find((route) => route.id === "agra-local");
  return undefined;
}

function DetailPage({ detail, language }: { detail: Vehicle | Package | Route; language: MarketingPageProps["language"] }) {
  const isVehicle = "seats" in detail;
  const isPackage = "slug" in detail;
  const route = !isVehicle && !isPackage ? detail : undefined;
  const vehicle = isVehicle ? detail : undefined;
  const tour = isPackage ? detail : undefined;
  const title = isVehicle
    ? `${detail.name} hire in Agra`
    : isPackage
      ? detail.name
      : `${cities.find((city) => city.id === detail.from)?.name} to ${cities.find((city) => city.id === detail.to)?.name} taxi`;
  const description = isVehicle
    ? detail.blurb
    : isPackage
      ? detail.blurb
      : `Private AC taxi from ${detail.from} to ${detail.to}. ${detail.fares.sedan ? `Sample fares from ₹${detail.fares.sedan.toLocaleString("en-IN")}.` : "Fares available on request."}`;
  const languagePrefix = language === "hi" ? "/hi" : "/en";

  return (
    <main id="main-content" className="marketing-page">
      <section className="marketing-hero detail-hero">
        <p className="eyebrow">Agra SK Baghel Tour and Travels</p>
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
        <div className="hero-actions">
          <a className="button button-primary" href={`tel:${contact.phone}`}>Call {contact.phoneDisplay}</a>
          <a className="button button-whatsapp inline-flex items-center gap-2" style={{ color: "#ffffff" }} href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer"><WhatsAppIcon className="w-4 h-4 shrink-0 text-white" /><span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span></a>
          <a className="button button-outline" href={`/book.html?${isVehicle ? `vehicle=${detail.id}` : isPackage ? `package=${detail.slug}` : `route=${detail.id}`}`}>Book now ↗</a>
        </div>
      </section>
      {vehicle && <section className="detail-media-section"><img src={vehicle.image} alt={`${vehicle.name} hire in Agra`} width="480" height="300" /><div><p className="eyebrow">{vehicle.klass}</p><h2>Comfort for {vehicle.suitable.toLowerCase()}.</h2><p className="spec-row">{vehicle.tags.join(" · ")}</p><p className="fare">{vehicle.rateRange}</p><ul className="check-list">{vehicle.models.map((model) => <li key={model}>{model}</li>)}</ul></div></section>}
      {tour && <><section className="detail-media-section"><img src={tour.image} alt={`${tour.name} from Agra`} width="480" height="300" /><div><p className="eyebrow">{tour.kicker} · {tour.duration}</p><h2>See the highlights without rushing.</h2><p>{tour.places.join(" → ")}</p><p className="fare">From ₹{tour.from.toLocaleString("en-IN")}</p></div></section><section className="detail-content"><h2>What this journey includes.</h2><div className="detail-columns"><div><h3>Included</h3><ul className="check-list">{tour.includes.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Not included</h3><ul className="cross-list">{tour.excludes.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section></>}
      {route && <section className="detail-content"><p className="eyebrow">Sample fare</p><h2>Compare vehicles before you book.</h2><p>{route.duration} · {route.km} km · private chauffeur-driven vehicle.</p><div className="fare-table-wrap"><table className="fare-table"><thead><tr><th>Vehicle</th><th>Seats</th><th>One way</th><th>Book</th></tr></thead><tbody>{vehicles.map((candidate) => <tr key={candidate.id}><td><a href={`${languagePrefix}/vehicles/${candidate.id === "innova" ? "innova-crysta" : candidate.id === "tempo" ? "tempo-traveller" : candidate.id}/`}>{candidate.name}</a></td><td>{candidate.seats}</td><td><strong>{route.fares[candidate.id] ? `₹${route.fares[candidate.id]!.toLocaleString("en-IN")}` : "On request"}</strong></td><td><a className="text-link" href={`/book.html?route=${route.id}&vehicle=${candidate.id}`}>Book ↗</a></td></tr>)}</tbody></table></div></section>}
    </main>
  );
}

export function MarketingPage({ language, section }: MarketingPageProps) {
  const pathname = window.location.pathname;
  const detail = findDetail(section, pathname);
  const [eyebrow, title, intro] = getPageCopy(language, section);

  if (detail) return <DetailPage detail={detail} language={language} />;

  return (
    <main id="main-content" className="marketing-page">
      <section className="marketing-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{intro}</p>
        <a className="button button-primary" href="/book.html">Check availability</a>
      </section>

      {section === "fleet" && (
        <section className="catalogue-grid" aria-label="Vehicle catalogue">
          {vehicles.map((vehicle) => (
            <article className="catalogue-card" key={vehicle.id}>
              <img src={vehicle.image} alt={`${vehicle.name} vehicle`} loading="lazy" />
              <p className="eyebrow">{vehicle.klass}</p>
              <h2>{vehicle.name}</h2>
              <p>{vehicle.blurb}</p>
              <div className="card-meta"><span>{vehicle.seats} seats</span><span>{vehicle.rateRange}</span></div>
              <a className="button button-outline" href={`/book.html?vehicle=${vehicle.id}`}>Choose this vehicle</a>
            </article>
          ))}
        </section>
      )}

      {section === "routes" && (
        <section className="catalogue-grid" aria-label="Route catalogue">
          {routes.filter((route) => route.kind === "one-way").map((route) => (
            <article className="catalogue-card" key={route.id}>
              <p className="eyebrow">{route.duration} · {route.km} km</p>
              <h2>{route.from.replace("-", " ")} to {route.to.replace("-", " ")}</h2>
              <p>Private AC taxi with a local driver and clear sample fares.</p>
              <div className="card-meta"><span>From Agra desk</span><strong>{route.fares.sedan ? `₹${route.fares.sedan.toLocaleString("en-IN")}` : "On request"}</strong></div>
              <a className="button button-outline" href={`/book.html?route=${route.id}`}>Book this route</a>
            </article>
          ))}
        </section>
      )}

      {section === "packages" && (
        <section className="catalogue-grid" aria-label="Tour packages">
          {packages.map((tour) => (
            <article className="catalogue-card" key={tour.id}>
              <img src={tour.image} alt="" loading="lazy" />
              <p className="eyebrow">{tour.kicker} · {tour.duration}</p>
              <h2>{tour.name}</h2>
              <p>{tour.blurb}</p>
              <div className="card-meta"><span>{tour.places.slice(0, 2).join(" · ")}</span><strong>₹{tour.from.toLocaleString("en-IN")}</strong></div>
              <a className="button button-outline" href={`/book.html?package=${tour.slug}`}>Plan this tour</a>
            </article>
          ))}
        </section>
      )}

      {section === "services" && <section className="catalogue-grid" aria-label="Travel services">{serviceCards.map(([name, body, href], index) => <article className="catalogue-card service-hub-card" key={name}><span className="service-index">{String(index + 1).padStart(2, "0")}</span><h2>{name}</h2><p>{body}</p><a className="button button-outline" href={href}>Explore service ↗</a></article>)}</section>}

      {section === "faq" && <section className="detail-content faq-list" aria-label="Frequently asked questions">{faqItems.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}

      {(section === "privacy" || section === "terms") && <section className="detail-content legal-content" aria-label={section === "privacy" ? "Privacy policy" : "Booking terms"}>{legalSections[section].map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</section>}

      {(section === "about" || section === "contact") && (
        <section className="content-section marketing-info">
          <h2>{section === "about" ? "Local knowledge, dependable travel." : "Your local travel desk in Agra."}</h2>
          <p>{intro}</p>
          <div className="contact-details"><a href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a><a href={contact.mapsUrl}>{contact.address}</a></div>
          <div className="hero-actions"><a className="button button-whatsapp inline-flex items-center gap-2" style={{ color: "#ffffff" }} href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer"><WhatsAppIcon className="w-4 h-4 shrink-0 text-white" /><span className="text-white" style={{ color: "#ffffff" }}>Message on WhatsApp</span></a><a className="button button-outline" href="/book.html">Start a booking</a></div>
        </section>
      )}
    </main>
  );
}
