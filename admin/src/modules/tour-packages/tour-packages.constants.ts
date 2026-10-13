import type { CatalogStatus, TourPackageGalleryImage, TourPackageFormState } from "./tour-packages.types";

export const HERITAGE_PHOTO_PRESETS: TourPackageGalleryImage[] = [
  { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
  { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal dome architecture" },
  { url: "/assets/places/gallery/taj-mahal-03.jpg", caption: "Intricate floral pietra dura marble inlay", alt: "Pietra dura marble inlay details" },
  { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Amar Singh Gate at Agra Red Fort", alt: "Agra Fort red sandstone entrance" },
  { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas marble royal pavilion", alt: "Diwan-i-Khas Agra Fort" },
  { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Mehtab Bagh sunset vantage point", alt: "Mehtab Bagh across Yamuna River" },
  { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir & Banke Bihari illumination", alt: "Prem Mandir illuminated at night" },
  { url: "/assets/places/gallery/fatehpur-sikri-01.jpg", caption: "Buland Darwaza imperial gate", alt: "Buland Darwaza Fatehpur Sikri" },
  { url: "/assets/places/gallery/jaipur-pink-city-01.jpg", caption: "Hawa Mahal Palace of Winds", alt: "Hawa Mahal facade Jaipur" },
];

export const INCLUSION_PRESETS: readonly string[] = [
  "Private AC Cab dedicated exclusively to your group",
  "Police-verified professional chauffeur & fuel charges",
  "All highway toll taxes & state border permits",
  "Parking charges at all monument sites",
  "Doorstep hotel / railway station pickup & drop",
  "Government approved ASI heritage guide assistance",
  "Chilled packaged drinking water bottles",
  "Prem Mandir & Krishna Janmabhoomi darshan coordination",
];

export const EXCLUSION_PRESETS: readonly string[] = [
  "Monument entry tickets & camera/drone permits",
  "Meals, buffet lunches & personal snacks/dining",
  "Chauffeur / guide discretionary tips & gratuities",
  "Special temple VIP pooja / express darshan passes",
  "Personal shopping & handicraft purchases",
  "Unscheduled out-of-route deviations & waiting halts",
];

export const EMPTY_TOUR_PACKAGE: TourPackageFormState = {
  name: "",
  packageCode: "",
  durationText: "1 Day",
  days: 1,
  nights: 0,
  baseTierCode: "sedan",
  startingPriceInr: 0,
  fleetPrices: {},
  nightChargeInr: 0,
  source: "Agra",
  destination: "",
  inclusions: [
    "Private AC Cab dedicated exclusively to your group",
    "Police-verified professional chauffeur & fuel charges",
    "All highway toll taxes & state border permits",
    "Doorstep hotel / railway station pickup & drop",
    "Chilled packaged drinking water bottles",
  ],
  exclusions: [
    "Monument entry tickets & camera/drone permits",
    "Meals, buffet lunches & personal snacks/dining",
    "Chauffeur / guide discretionary tips & gratuities",
  ],
  inclusionsHighlight: "Private AC Cab, Chauffeur Allowance, Fuel & State Taxes",
  inclusionsNote: "",
  imageUrl: "/assets/packages/taj-dawn.webp",
  gallery: [],
  status: "draft" as CatalogStatus,
  isActive: true,
};
