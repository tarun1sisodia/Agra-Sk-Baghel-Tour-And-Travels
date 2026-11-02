import { useEffect, useMemo, useState } from "react";
import { siteConfig, type SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { packages as snapshotPackages, type TourPackage } from "../data";
import { packageArea, type PackageArea } from "../data/tourPackage";
import photoCredits from "../data/package-photo-credits.json";
import { loadPublishedPackages } from "../services/catalogManifest";
import { resolveCatalogMediaUrl } from "../services/catalog";
import { Pagination } from "../components/ui/Pagination";
import { WhatsAppIcon } from "../components/icons";
import { PackagePhotoCredits } from "../components/catalog/PackagePhotoCredits";

interface PackagesPageProps { language?: SupportedLanguage }
const PAGE_SIZE = 6;
const filters: { id: PackageArea; label: string; hi: string }[] = [
  { id: "all", label: "All packages", hi: "सभी पैकेज" },
  { id: "agra", label: "Inside Agra", hi: "आगरा के अंदर" },
  { id: "nearby", label: "Around Agra", hi: "आगरा के आसपास" },
  { id: "overnight", label: "2-day getaways", hi: "2 दिन की यात्राएँ" },
];
const areaLabels = { agra: "Inside Agra", nearby: "Around Agra", overnight: "2-day getaway" };

export function PackagesPage({ language = "en" }: PackagesPageProps) {
  const hi = language === "hi";
  const prefix = `/${language}/packages/`;
  const [packages, setPackages] = useState<TourPackage[]>([...snapshotPackages]);
  const [area, setArea] = useState<PackageArea>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    loadPublishedPackages().then((items) => {
      if (active) setPackages(items);
    }).catch(() => { /* The pre-rendered collection stays available offline. */ });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return packages.filter((pkg) => (area === "all" || packageArea(pkg) === area) &&
      (!search || [pkg.name, pkg.blurb, pkg.destination, ...pkg.places].join(" ").toLowerCase().includes(search)));
  }, [packages, area, query]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const schema = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "Private tours inside and around Agra", numberOfItems: packages.length,
    itemListElement: packages.map((pkg, index) => ({
      "@type": "ListItem", position: index + 1,
      item: {
        "@type": "TouristTrip", name: pkg.name, description: pkg.blurb,
        url: `${siteConfig.domain}${prefix}${pkg.slug}/`,
        itinerary: { "@type": "ItemList", itemListElement: pkg.places.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })) },
        ...(pkg.from && pkg.from > 0 ? { offers: { "@type": "Offer", price: pkg.from, priceCurrency: "INR" } } : {}),
      },
    })),
  };

  return (
    <div className="w-full bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="bg-surface-container-low border-b border-border-warm">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-space-xl">
          <nav aria-label="Breadcrumb" className="text-body-sm text-on-surface-variant mb-5">
            <a href="/" className="hover:underline">{hi ? "होम" : "Home"}</a><span aria-hidden="true"> / </span>{hi ? "पैकेज" : "Packages"}
          </nav>
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-primary">{hi ? "आगरा से निजी यात्राएँ" : "Start in Agra. Make a day of it."}</span>
          <h1 className="font-headline-hero text-headline-hero text-ink-charcoal mt-3 mb-4">
            {hi ? "आगरा और आसपास के टूर पैकेज" : "Agra & nearby tour packages"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            {hi ? "ताजमहल, मुगल स्मारक, ब्रज दर्शन या भरतपुर की प्रकृति—अपनी रुचि के अनुसार यात्रा चुनें। पहले पूरा कार्यक्रम देखें, फिर तारीख और वाहन तय करने के लिए हमसे बात करें।" : "A morning at the Taj, a full day of Mughal history, Braj temple darshan or a quieter escape to Bharatpur. Choose a route, read the itinerary, then tell us your date and group size."}
          </p>
          <div className="flex flex-wrap gap-3 mt-5 text-body-sm text-primary font-semibold">
            <span>{hi ? "आगरा होटल / स्टेशन से पिकअप" : "Agra hotel or station pickup"}</span>
            <span aria-hidden="true">·</span>
            <span>{hi ? "निजी AC वाहन" : "Private AC vehicle"}</span>
            <span aria-hidden="true">·</span>
            <span>{hi ? "बिना अनिवार्य खरीदारी" : "No compulsory shopping stops"}</span>
          </div>
        </div>
      </section>

      <section id="packages-directory" className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label={hi ? "यात्रा क्षेत्र" : "Filter by tour area"}>
            {filters.map((filter) => {
              const count = packages.filter((pkg) => filter.id === "all" || packageArea(pkg) === filter.id).length;
              return <button key={filter.id} type="button" aria-pressed={area === filter.id}
                onClick={() => { setArea(filter.id); setPage(1); }}
                className={`min-h-12 px-3.5 py-2 rounded-lg border text-label-lg font-semibold ${area === filter.id ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface border-border-warm"}`}>
                {hi ? filter.hi : filter.label} <span>({count})</span>
              </button>;
            })}
          </div>
          <label className="flex flex-col gap-1 text-body-sm text-on-surface-variant lg:min-w-64">
            <span>{hi ? "मंदिर, स्मारक या यात्रा खोजें" : "Search a monument, temple or tour"}</span>
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={hi ? "जैसे: ताज, मथुरा…" : "Try Taj, Mathura, sunset…"}
              className="min-h-12 px-3 rounded-lg border border-border-warm bg-surface text-on-surface" />
          </label>
        </div>
        <p className="text-body-sm text-on-surface-variant mb-4" role="status">
          {filtered.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} ${hi ? "में से" : "of"} ${filtered.length} ${hi ? "यात्राएँ" : "itineraries"}` : hi ? "कोई यात्रा नहीं मिली।" : "No itineraries match your search."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {shown.map((pkg) => {
            const detailUrl = `${prefix}${pkg.slug}/`;
            const image = resolveCatalogMediaUrl(pkg.image || pkg.gallery?.[0]?.url);
            const photo = photoCredits.find((credit) => credit.path === image);
            const whatsapp = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello, I am interested in ${pkg.name}. My travel date is ___ and my group size is ___. Please help me plan this itinerary from Agra.`)}`;
            return <article key={pkg.slug} className="flex flex-col rounded-xl border border-border-warm bg-surface-container-lowest overflow-hidden">
              <a href={detailUrl} aria-label={`View ${pkg.name}`} className="relative block h-44 sm:h-48 bg-sandstone-wash overflow-hidden">
                <img src={image} alt={pkg.gallery?.find((entry) => entry.url === image)?.alt || photo?.alt || pkg.name}
                  width={photo?.width || 640} height={photo?.height || 400} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-surface text-primary px-2 py-1 rounded text-label-caps font-semibold">{areaLabels[packageArea(pkg)]}</span>
              </a>
              <div className="p-3.5 sm:p-4 flex flex-col gap-3 flex-1">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">{pkg.duration} · {hi ? "आगरा से" : "From Agra"}</span>
                <h2 className="font-headline-sm text-headline-sm text-ink-charcoal"><a href={detailUrl} className="hover:underline">{pkg.name}</a></h2>
                <p className="text-body-sm text-on-surface-variant">{pkg.blurb}</p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Main stops">
                  {pkg.places.slice(0, 4).map((place) => <li key={place} className="px-2 py-1 rounded bg-sandstone-wash text-body-sm text-on-surface">{place}</li>)}
                </ul>
                <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border-warm">
                  <a href={detailUrl} className="min-h-12 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary text-on-primary text-label-lg font-semibold">{hi ? "पैकेज देखें" : "View package"}</a>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`Ask about ${pkg.name} on WhatsApp`}
                    className="min-h-12 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-warm text-on-surface text-label-lg font-semibold">
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />{hi ? "पूछताछ करें" : "Enquire"}
                  </a>
                </div>
              </div>
            </article>;
          })}
        </div>
        {!filtered.length && <div className="py-10 text-center">
          <p className="text-body-md text-on-surface-variant mb-3">{hi ? "दूसरा शब्द या क्षेत्र चुनें।" : "Try another destination or clear the filters."}</p>
          <button type="button" className="min-h-12 px-4 rounded-lg bg-primary text-on-primary" onClick={() => { setArea("all"); setQuery(""); setPage(1); }}>{hi ? "फ़िल्टर हटाएँ" : "Clear filters"}</button>
        </div>}
        {filtered.length > PAGE_SIZE && <Pagination totalItems={filtered.length} itemsPerPage={PAGE_SIZE} currentPage={currentPage} onPageChange={setPage} className="mt-8" />}
      </section>

      <section className="bg-surface-container-low border-y border-border-warm">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-space-xl grid md:grid-cols-2 gap-5">
          <div>
            <h2 className="font-headline-md text-headline-md text-ink-charcoal mb-3">{hi ? "यात्रा तय करने से पहले" : "A little planning goes a long way"}</h2>
            <p className="text-body-md text-on-surface-variant">{hi ? "हर यात्रा आगरा से शुरू होती है। दिल्ली से पिकअप, होटल, गाइड और टिकट चाहिए तो पहले बताएँ। तारीख, समूह और वाहन के अनुसार लिखित प्रस्ताव तय होने के बाद ही बुकिंग करें।" : "These itineraries start in Agra. Delhi pickup, a hotel room, a licensed guide and entry tickets are not automatically included. We confirm the route, vehicle and written inclusions with you before any booking."}</p>
          </div>
          <ul className="space-y-3 text-body-sm text-on-surface-variant">
            <li>{hi ? "ताजमहल शुक्रवार को पर्यटकों के लिए बंद रहता है।" : "Taj Mahal sightseeing is closed on Fridays; early pickup follows the season."}</li>
            <li>{hi ? "मंदिरों के दर्शन समय और स्थानीय वाहन प्रतिबंध बदल सकते हैं।" : "Temple darshan windows, festival queues and local vehicle restrictions can change the order of visits."}</li>
            <li>{hi ? "भरतपुर में पक्षी दिखना मौसम और प्राकृतिक स्थितियों पर निर्भर है।" : "Bharatpur is a seasonal nature trip. Wildlife sightings and sunrise or sunset colours are never guaranteed."}</li>
          </ul>
        </div>
      </section>
      <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-6">
        <PackagePhotoCredits urls={packages.flatMap((pkg) => [pkg.image, ...(pkg.gallery?.map((entry) => entry.url) || [])])} />
      </div>
    </div>
  );
}
