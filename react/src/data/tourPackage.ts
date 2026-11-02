import type { TourPackage, TourPackageGalleryImage } from "../data";

const text = (value: unknown, fallback = ""): string => typeof value === "string" ? value : fallback;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Pure normalization shared by the SSG baseline and live package manifest. */
export function mapTourPackage(value: unknown): TourPackage {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, any>;
  const rawPrices = item.fleetPrices ?? item.fleet_prices ?? {};
  const fleetPrices: Record<string, number> = {};
  for (const [key, amount] of Object.entries(rawPrices)) {
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) fleetPrices[key] = amount;
  }
  const explicitPrice = item.startingPriceInr ?? item.starting_price_inr ?? item.from;
  const validPrice = typeof explicitPrice === "number" && Number.isFinite(explicitPrice) && explicitPrice > 0;
  const prices = Object.values(fleetPrices);
  // null means unconfigured, not a free trip and not a made-up starting fare.
  const from = validPrice ? explicitPrice as number : prices.length ? Math.min(...prices) : null;
  const name = text(item.name, text(item.title, "Private tour"));
  const slug = text(item.slug, text(item.packageCode, text(item.package_code, text(item.id))));
  const gallery: TourPackageGalleryImage[] = (Array.isArray(item.gallery) ? item.gallery : [])
    .filter(Boolean)
    .map((entry: any) => typeof entry === "string" ? { url: entry, alt: name } : {
      url: text(entry.url), alt: text(entry.alt, text(entry.altText, name)), caption: text(entry.caption),
    })
    .filter((entry: TourPackageGalleryImage) => Boolean(entry.url));
  const itinerary = (Array.isArray(item.itinerary) ? item.itinerary : [])
    .filter((stop: any) => typeof stop?.title === "string" && typeof stop?.desc === "string")
    .map((stop: any) => ({ time: text(stop.time), title: stop.title as string, desc: stop.desc as string }));
  const places = strings(item.places);
  return {
    id: slug, slug, name,
    kicker: text(item.kicker, Number(item.days) > 1 ? "Overnight itinerary" : "Private day tour"),
    duration: text(item.durationText, text(item.duration_text, text(item.duration, "1 day"))),
    from, fleetPrices,
    image: text(item.imageUrl, text(item.image_url, text(item.image, gallery[0]?.url))),
    gallery,
    places: places.length ? places : itinerary.map((stop: { title: string }) => stop.title)
      .filter((title: string) => !/pickup|break|return|drop-off|overnight|drive from|drive to|agra to/i.test(title)),
    source: text(item.source, "Agra"),
    destination: text(item.destination, name),
    days: Number(item.days) || 1, nights: Number(item.nights) || 0,
    blurb: text(item.inclusionsHighlight, text(item.inclusions_highlight, text(item.blurb))),
    includes: strings(item.inclusions ?? item.includes),
    excludes: strings(item.exclusions ?? item.excludes),
    planningNote: text(item.inclusionsNote, text(item.inclusions_note, text(item.planningNote))),
    itinerary,
  };
}

export type PackageArea = "all" | "agra" | "nearby" | "overnight";

export function packageArea(pkg: Pick<TourPackage, "slug" | "days" | "nights" | "destination">): Exclude<PackageArea, "all"> {
  if ((pkg.days ?? 1) > 1 || (pkg.nights ?? 0) > 0) return "overnight";
  if (/fatehpur|sikri|mathura|vrindavan|bharatpur|keoladeo/i.test(`${pkg.slug} ${pkg.destination}`)) return "nearby";
  return "agra";
}
