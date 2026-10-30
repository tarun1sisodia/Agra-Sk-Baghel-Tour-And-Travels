import { useEffect, useState } from "react";
import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { Icon } from "../icons/Icon";
import {
  fetchPublishedCatalog,
  resolveCatalogMediaUrl,
  type PublicCatalogItem,
} from "../../services/catalog";
import { onUserInteractionOrIdle } from "../../utils/deferredRevalidation";

export interface FamousPlace {
  id: string;
  name: string;
  category: "all" | "heritage" | "braj" | "outstation";
  categoryBadge: string;
  subtitle: string;
  description: string;
  distance: string;
  driveTime: string;
  bestTime: string;
  recommendedVehicle: string;
  highlights: string[];
  images: Array<{
    url: string;
    caption: string;
    alt: string;
  }>;
}

const GALLERY_PREFIX = "/assets/places/gallery/";
const GALLERY_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px";

/**
 * Base path (without extension) for self-hosted gallery images, or null for
 * remote/CMS URLs which keep a plain <img>.
 */
function galleryBase(url: string): string | null {
  return url.startsWith(GALLERY_PREFIX) && url.endsWith(".jpg")
    ? url.slice(0, -".jpg".length)
    : null;
}

interface PlacePhotoProps {
  url: string;
  alt: string;
  className?: string;
  eager?: boolean;
  onClick?: () => void;
}

/**
 * AVIF-first responsive <picture> for self-hosted gallery images
 * ({base}-480/960/1600.avif -> webp -> 1600w jpg fallback). Remote or CMS
 * gallery URLs render as a plain lazy <img> so catalog overrides keep working.
 */
function PlacePhoto({ url, alt, className, eager, onClick }: PlacePhotoProps) {
  const base = galleryBase(url);
  const img = (
    <img
      src={base ? `${base}.jpg` : url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onClick={onClick}
    />
  );
  if (!base) return img;
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${base}-480.avif 480w, ${base}-960.avif 960w, ${base}-1600.avif 1600w`}
        sizes={GALLERY_SIZES}
      />
      <source
        type="image/webp"
        srcSet={`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`}
        sizes={GALLERY_SIZES}
      />
      {img}
    </picture>
  );
}

export const FAMOUS_PLACES: FamousPlace[] = [
  {
    id: "taj-mahal",
    name: "Taj Mahal",
    category: "heritage",
    categoryBadge: "UNESCO World Wonder",
    subtitle: "Pristine white marble mausoleum on the Yamuna riverfront",
    description:
      "Commissioned in 1631 by Mughal Emperor Shah Jahan for Empress Mumtaz Mahal. Renowned worldwide for its symmetrical ivory-white marble architecture, delicate floral pietra dura inlay, and majestic reflecting pools.",
    distance: "5 km from Agra Cantt",
    driveTime: "15 mins",
    bestTime: "Sunrise 05:45 AM – 08:30 AM",
    recommendedVehicle: "Sedan or Innova Crysta",
    highlights: ["UNESCO World Heritage", "Pietra Dura Inlay", "Yamuna Reflection"],
    images: [
      {
        url: "/assets/places/gallery/taj-mahal-01.jpg",
        caption: "Iconic reflection pool at golden dawn",
        alt: "Taj Mahal reflection pool at dawn in Agra",
      },
      {
        url: "/assets/places/gallery/taj-mahal-02.jpg",
        caption: "Intricate marble archways & minarets",
        alt: "Intricate marble archways and minarets of Taj Mahal",
      },
      {
        url: "/assets/places/gallery/taj-mahal-03.jpg",
        caption: "Taj Mahal framed by the great gateway at golden hour",
        alt: "Taj Mahal seen through the main gateway arch at golden hour",
      },
      {
        url: "/assets/places/gallery/taj-mahal-04.jpg",
        caption: "Panoramic aerial perspective of the dome",
        alt: "Panoramic aerial view of the Taj Mahal dome and gardens",
      },
    ],
  },
  {
    id: "agra-fort",
    name: "Agra Red Fort",
    category: "heritage",
    categoryBadge: "UNESCO Citadel",
    subtitle: "Imperial 16th-century Mughal fortress of red sandstone",
    description:
      "The primary residence of the Mughal emperors until 1638. Spans 94 acres with monumental 70-foot-high double ramparts, Jahangiri Mahal, Diwan-i-Khas, and the Musamman Burj where Shah Jahan gazed upon the Taj Mahal.",
    distance: "4 km from Agra Cantt",
    driveTime: "12 mins",
    bestTime: "Morning 09:00 AM – 12:30 PM",
    recommendedVehicle: "Executive Sedan / Ertiga",
    highlights: ["Emperor Akbar 1565", "Jahangiri Mahal", "Taj Viewpoint"],
    images: [
      {
        url: "/assets/places/gallery/agra-fort-01.jpg",
        caption: "Moat and towering red sandstone ramparts",
        alt: "Agra Fort moat and massive red sandstone walls",
      },
      {
        url: "/assets/places/gallery/agra-fort-02.jpg",
        caption: "Manicured gardens and marble pavilions",
        alt: "Gardens and white marble pavilions inside Agra Fort",
      },
      {
        url: "/assets/places/gallery/agra-fort-03.jpg",
        caption: "Royal courtyard with white marble palaces",
        alt: "Marble palace courtyard inside Agra Fort",
      },
    ],
  },
  {
    id: "fatehpur-sikri",
    name: "Fatehpur Sikri & Buland Darwaza",
    category: "heritage",
    categoryBadge: "UNESCO Ghost City",
    subtitle: "Akbar's magnificent red sandstone imperial capital",
    description:
      "Founded in 1571 by Emperor Akbar to celebrate his victory in Gujarat. Highlights include the 54-meter Buland Darwaza (the highest gateway in the world), the sacred white marble Dargah of Salim Chishti, and Panch Mahal.",
    distance: "38 km from Agra",
    driveTime: "45 mins via NH-21",
    bestTime: "Afternoon to Sunset",
    recommendedVehicle: "Innova Crysta / Tempo Traveller",
    highlights: ["54m Buland Darwaza", "Salim Chishti Shrine", "Panch Mahal"],
    images: [
      {
        url: "/assets/places/gallery/fatehpur-sikri-01.jpg",
        caption: "Buland Darwaza with visitors on the steps",
        alt: "Tourists on the steps of Buland Darwaza at Fatehpur Sikri",
      },
      {
        url: "/assets/places/gallery/fatehpur-sikri-02.jpg",
        caption: "Jama Masjid courtyard facade",
        alt: "Jama Masjid facade at Fatehpur Sikri",
      },
      {
        url: "/assets/places/gallery/fatehpur-sikri-03.jpg",
        caption: "Buland Darwaza rising above the grand steps",
        alt: "Buland Darwaza viewed from the grand steps at Fatehpur Sikri",
      },
    ],
  },
  {
    id: "mathura-vrindavan",
    name: "Mathura & Vrindavan",
    category: "braj",
    categoryBadge: "Sacred Pilgrimage",
    subtitle: "Lord Krishna's holy birthplace & temple circuit",
    description:
      "The spiritual heartland of Braj on the banks of the sacred Yamuna river. Experience Krishna Janmabhoomi temple, Banke Bihari Ji's divine darshan, ISKCON temple, and the evening light show at Prem Mandir.",
    distance: "55 km from Agra",
    driveTime: "1h 15m via NH-19",
    bestTime: "04:30 PM – 08:30 PM (Evening Aarti)",
    recommendedVehicle: "Ertiga / Innova / Tempo",
    highlights: ["Krishna Janmabhoomi", "Banke Bihari", "Prem Mandir Lighting"],
    images: [
      {
        url: "/assets/places/gallery/mathura-vrindavan-01.jpg",
        caption: "Prem Mandir in daylight",
        alt: "Prem Mandir temple in Vrindavan during the day",
      },
      {
        url: "/assets/places/gallery/mathura-vrindavan-02.jpg",
        caption: "Prem Mandir glowing purple and gold at night",
        alt: "Prem Mandir illuminated in purple and gold at night in Vrindavan",
      },
      {
        url: "/assets/places/gallery/mathura-vrindavan-03.jpg",
        caption: "Prem Mandir lit in tricolour at night",
        alt: "Prem Mandir lit in saffron, white and green at night in Vrindavan",
      },
    ],
  },
  {
    id: "mehtab-bagh",
    name: "Mehtab Bagh & Baby Taj",
    category: "heritage",
    categoryBadge: "Sunset River Vista",
    subtitle: "Charbagh garden complex with moonlit river reflections",
    description:
      "Located directly opposite the Taj Mahal across the Yamuna River, this 25-acre garden was built by Babur and aligned with the Taj complex by Shah Jahan. Nearby Itimad-ud-Daulah ('Baby Taj') showcases the finest pietra dura marble mosaic in India.",
    distance: "8 km from Tajganj",
    driveTime: "20 mins",
    bestTime: "Golden Hour 04:30 PM – 06:30 PM",
    recommendedVehicle: "Comfort AC Sedan",
    highlights: ["Sunset Taj View", "Baby Taj Marble Inlay", "Quiet Charbagh"],
    images: [
      {
        url: "/assets/places/gallery/mehtab-bagh-01.jpg",
        caption: "Taj Mahal through the trees from Mehtab Bagh",
        alt: "Taj Mahal seen through trees from Mehtab Bagh across the Yamuna",
      },
      {
        url: "/assets/places/gallery/mehtab-bagh-02.jpg",
        caption: "Taj Mahal across the Mehtab Bagh gardens",
        alt: "Taj Mahal viewed across the gardens of Mehtab Bagh",
      },
      {
        url: "/assets/places/gallery/mehtab-bagh-03.jpg",
        caption: "Red sandstone pavilion at Mehtab Bagh",
        alt: "Red sandstone pavilion in the Mehtab Bagh garden",
      },
    ],
  },
  {
    id: "jaipur-pink-city",
    name: "Jaipur & Amber Fort",
    category: "outstation",
    categoryBadge: "Golden Triangle Royal",
    subtitle: "Rajasthan's royal Pink City & majestic hilltop fortress",
    description:
      "A premier Golden Triangle destination 4 hours from Agra via smooth NH-21. Features the honeycomb facade of Hawa Mahal, the hilltop Amber Fort overlooking Maota Lake, the City Palace, and vibrant Johari Bazaar.",
    distance: "240 km from Agra",
    driveTime: "4h 15m via NH-21",
    bestTime: "Full Day Trip or Overnight",
    recommendedVehicle: "Innova Crysta / Urbania",
    highlights: ["Hawa Mahal", "Amber Fort Hilltop", "Royal City Palace"],
    images: [
      {
        url: "/assets/places/gallery/jaipur-pink-city-01.jpg",
        caption: "Hawa Mahal (Palace of Winds) iconic pink facade",
        alt: "Hawa Mahal palace of winds in Jaipur",
      },
      {
        url: "/assets/places/gallery/jaipur-pink-city-02.jpg",
        caption: "Amber Fort majestic hilltop palace reflection",
        alt: "Amber Fort towering over Maota Lake in Jaipur",
      },
      {
        url: "/assets/places/gallery/jaipur-pink-city-03.jpg",
        caption: "Jal Mahal floating on Man Sagar Lake",
        alt: "Jal Mahal water palace on Man Sagar Lake in Jaipur",
      },
    ],
  },
  {
    id: "aram-bagh",
    name: "Aram Bagh (Ram Bagh)",
    category: "heritage",
    categoryBadge: "Oldest Mughal Garden",
    subtitle: "India's earliest Mughal Charbagh garden built by Babur in 1528",
    description:
      "Commissioned in 1528 by the first Mughal Emperor Babur, Aram Bagh (Garden of Rest, later called Ram Bagh) is the oldest surviving Mughal garden in India. Located on the banks of the Yamuna River, its Persian Charbagh layout features cascading waterways, stepped terraces, and tranquil shaded pavilions.",
    distance: "9 km from Agra Cantt",
    driveTime: "22 mins",
    bestTime: "Morning 07:00 AM – 10:30 AM",
    recommendedVehicle: "Sedan or Ertiga",
    highlights: ["Emperor Babur 1528", "Stepped Water Cascades", "Yamuna Riverside"],
    images: [
      {
        url: "/assets/places/gallery/mehtab-bagh-02.jpg",
        caption: "Historic riverside terraced pavilions of Aram Bagh",
        alt: "Aram Bagh historic Charbagh garden terraces in Agra",
      },
      {
        url: "/assets/places/gallery/agra-fort-02.jpg",
        caption: "Lush Mughal garden pathways and water channels",
        alt: "Aram Bagh traditional stone water channels and gardens",
      },
    ],
  },
];

/**
 * Maps a published catalog `place` item (Famous Places & Monuments vertical,
 * managed from the Catalog CMS with a multi-image gallery) onto the richer
 * static FamousPlace shape used by this section.
 */
function catalogPlaceToFamousPlace(item: PublicCatalogItem): FamousPlace | null {
  const text = `${item.title} ${item.routeSummary} ${item.stops.join(" ")}`.toLowerCase();
  const category: FamousPlace["category"] = /mathura|vrindavan|braj|gokul|nandgaon|barsana/.test(text)
    ? "braj"
    : /jaipur|delhi|gwalior|lucknow|varanasi|ayodhya|rishikesh|himachal|shimla|manali|outstation/.test(text)
      ? "outstation"
      : "heritage";
  const images = item.gallery
    .filter((g) => g.mediaType === "image" && Boolean(g.url))
    .map((g) => ({
      url: resolveCatalogMediaUrl(g.url),
      caption: g.caption ?? g.altText,
      alt: g.altText,
    }))
    .filter((image) => Boolean(image.url));

  // Ignore malformed CMS places rather than allowing one bad record to crash
  // the entire homepage.
  if (images.length === 0) return null;

  return {
    id: item.slug,
    name: item.title,
    category,
    categoryBadge: "Verified Destination",
    subtitle: item.shortDescription,
    description: item.description,
    distance: item.distanceKm !== null && item.distanceKm !== undefined ? `${item.distanceKm} km from Agra` : "Around Agra",
    driveTime: item.durationText || "Half day visit",
    bestTime: "Sunrise & early morning",
    recommendedVehicle: "Sedan or Innova Crysta",
    highlights: item.stops.slice(0, 3),
    images,
  };
}

export function FamousPlacesSection() {
  const [activeCategory, setActiveCategory] = useState<"all" | "heritage" | "braj" | "outstation">("all");
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [modalImage, setModalImage] = useState<{ url: string; title: string; caption: string } | null>(null);
  // Static list first (SSG baseline), then merge places published through the
  // Catalog CMS — the backend is the single source of truth for new monuments.
  const [places, setPlaces] = useState<FamousPlace[]>(FAMOUS_PLACES);

  useEffect(() => {
    let isMounted = true;
    const cleanup = onUserInteractionOrIdle(() => {
      fetchPublishedCatalog({ type: "place" })
        .then((items) => {
          if (!isMounted || items.length === 0) return;
          setPlaces((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            for (const item of items) {
              const mapped = catalogPlaceToFamousPlace(item);
              if (!mapped) continue;
              const existing = byId.get(mapped.id);
              // Prefer the CMS gallery when it has images; otherwise keep static art.
              byId.set(mapped.id, existing && mapped.images.length === 0 ? existing : { ...existing, ...mapped });
            }
            return [...byId.values()];
          });
        })
        .catch(() => {
          /* static list remains the fallback */
        });
    }, 8000);

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const filteredPlaces = places.filter(
    (p) => activeCategory === "all" || p.category === activeCategory
  );

  const handleSelectImage = (placeId: string, imgIdx: number) => {
    setActiveImageIndices((prev) => ({ ...prev, [placeId]: imgIdx }));
  };

  return (
    <section className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin" id="famous-places">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
        <div className="max-w-2xl">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2 font-bold">
            Heritage &amp; Destinations
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
            Famous Places &amp; Monuments Around Agra
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
            Explore authentic high-resolution perspectives of world wonders, sacred pilgrimage circuits, and royal fortresses.
            Private, doorstep-pickup AC taxis with verified commercial chauffeurs.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-border-warm/40 shrink-0">
          {[
            { id: "all", label: "All Destinations" },
            { id: "heritage", label: "Agra Heritage" },
            { id: "braj", label: "Sacred Braj" },
            { id: "outstation", label: "Royal Outstation" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-label-lg transition-all font-semibold ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-sandstone-wash"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Places Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        {filteredPlaces.map((place) => {
          const currentImgIdx = activeImageIndices[place.id] || 0;
          const activeImg = place.images[currentImgIdx] || place.images[0];
          if (!activeImg) return null;

          return (
            <article
              key={place.id}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-border-warm/50 flex flex-col shadow-xs hover:shadow-lg transition-all duration-300 group"
            >
              {/* Main Image Showcase Stage */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                <PlacePhoto
                  url={activeImg.url}
                  alt={activeImg.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                  onClick={() =>
                    setModalImage({
                      url: activeImg.url,
                      title: place.name,
                      caption: activeImg.caption,
                    })
                  }
                />

                {/* Top Badge: Category */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-ink-midnight/80 text-white font-label-caps text-label-caps uppercase tracking-wider font-semibold backdrop-blur-md shadow-xs">
                    {place.categoryBadge}
                  </span>
                </div>

                {/* Top Right: Expand Lightbox Button */}
                <button
                  type="button"
                  onClick={() =>
                    setModalImage({
                      url: activeImg.url,
                      title: place.name,
                      caption: activeImg.caption,
                    })
                  }
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink-midnight/70 hover:bg-ink-midnight text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-xs"
                  aria-label="View photo in high-resolution lightbox"
                  title="Expand high-res photo"
                >
                  <Icon name="zoom_in" className="text-icon-17" />
                </button>

                {/* Bottom Overlay: Photo Caption & Image Counter */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-midnight/90 via-ink-midnight/40 to-transparent p-3 pt-6 flex items-end justify-between">
                  <span className="text-label-md text-white/95 font-medium truncate max-w-[75%] drop-shadow-xs">
                    {activeImg.caption}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-white text-body-sm font-mono tracking-wider backdrop-blur-xs font-semibold">
                    {currentImgIdx + 1} / {place.images.length}
                  </span>
                </div>
              </div>

              {/* Multi-Image Interactive Thumbnails Strip */}
              <div className="p-2.5 bg-surface-container-low/70 border-b border-border-warm/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {place.images.map((img, idx) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => handleSelectImage(place.id, idx)}
                    className={`relative w-14 h-10 rounded-md overflow-hidden shrink-0 transition-all border ${
                      currentImgIdx === idx
                        ? "ring-2 ring-primary border-primary scale-[1.03] shadow-xs"
                        : "opacity-65 hover:opacity-100 border-border-warm/60"
                    }`}
                    title={img.caption}
                    aria-label={`View photo ${idx + 1}: ${img.caption}`}
                  >
                    <PlacePhoto
                      url={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                <span className="text-label-lg text-on-surface-variant font-label-caps ml-auto pr-1 shrink-0 font-medium">
                  {place.images.length} Real Photos
                </span>
              </div>

              {/* Body Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                {/* Title & Subtitle */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                      {place.name}
                    </h3>
                  </div>
                  <p className="font-title-md text-xs text-on-surface-variant mt-0.5">
                    {place.subtitle}
                  </p>
                </div>

                {/* Editorial Blurb */}
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {place.description}
                </p>

                {/* Specs Strip */}
                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-lg border border-border-warm/40 text-body-md">
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block font-semibold">
                      Distance
                    </span>
                    <span className="font-title-md text-on-surface font-bold">
                      {place.distance}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block font-semibold">
                      Cab Duration
                    </span>
                    <span className="font-title-md text-on-surface font-bold">
                      {place.driveTime}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border-warm/40 flex items-center justify-between">
                    <span className="text-on-surface-variant text-label-lg">
                      Best Visit: <strong className="text-on-surface">{place.bestTime}</strong>
                    </span>
                  </div>
                </div>

                {/* Highlights Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {place.highlights.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-sandstone-wash text-on-surface-variant font-label-caps text-label-caps font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action CTAs */}
                <div className="mt-auto pt-3 border-t border-border-warm/40 flex items-center justify-between gap-2">
                  <a
                    className="flex-1 min-h-[44px] py-2.5 px-3 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-xs font-semibold transition-all shadow-xs text-center active:scale-[0.98] inline-flex items-center justify-center gap-1"
                    href={
                      place.id === "taj-mahal" || place.id === "agra-fort"
                        ? `/book?category=local_package&product=agra-8h-80km`
                        : `/book?category=outstation&from=Agra&to=${encodeURIComponent(place.name)}`
                    }
                    aria-label={`Book cab from Agra to ${place.name}`}
                  >
                    <span className="text-white">Book Cab</span>
                    <Icon name="arrow_forward" className="text-icon-14 text-white" />
                  </a>

                  {/* WhatsApp CTA in Pure Black with Real WhatsApp Icon */}
                  <a
                    className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/20 text-white font-label-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shrink-0"
                    style={{ color: "#ffffff" }}
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      `Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about a taxi trip to ${place.name} (${place.distance}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Inquire about cab to ${place.name} on WhatsApp`}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-white" />
                    <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* High-Res Modal Lightbox Preview */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
              <PlacePhoto
                url={modalImage.url}
                alt={modalImage.caption}
                className="w-full h-full object-contain"
                eager
              />
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md"
                aria-label="Close high-res preview"
              >
                <Icon name="close" className="text-icon-20" />
              </button>
            </div>
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
              <div>
                <h2 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  {modalImage.title}
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  {modalImage.caption}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-900 border border-white/20 text-white font-label-lg text-xs font-semibold inline-flex items-center gap-2 active:scale-[0.98]"
                  style={{ color: "#ffffff" }}
                  href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                    `Hello Agra SK Baghel Tour and Travels, I am inquiring about visiting ${modalImage.title}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                  <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Desk</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FamousPlacesSection;
