export interface RouteDestinationMedia {
  src: string;
  caption: string;
  alt: string;
  corridorBadge: string;
}

/**
 * Returns authentic destination photography and highway corridor intelligence
 * based on route identifiers, source, and destination.
 */
export function getRouteDestinationImage(
  routeId: string = "",
  from: string = "Agra",
  to: string = "Destination"
): RouteDestinationMedia {
  const text = `${routeId} ${from} ${to}`.toLowerCase();

  // 0. Agra Sightseeing & Taj Mahal Corridors
  if (
    text.includes("taj-mahal") ||
    text.includes("taj") ||
    text.includes("same-day-agra") ||
    text.includes("agra-local-sightseeing") ||
    text.includes("agra-darshan")
  ) {
    return {
      src: "/assets/places/gallery/taj-mahal-01.jpg",
      caption: "Taj Mahal Dawn & Agra Local Heritage Circuit",
      alt: "Agra local sightseeing private taxi covering Taj Mahal and Agra Fort",
      corridorBadge: "Agra Heritage Circuit • Taj Mahal, Red Fort & Mehtab Bagh",
    };
  }

  // 1. Delhi NCR Corridors (Yamuna Expressway)
  if (
    text.includes("delhi") ||
    text.includes("noida") ||
    text.includes("gurgaon") ||
    text.includes("gurugram") ||
    text.includes("ghaziabad") ||
    text.includes("faridabad") ||
    text.includes("ncr") ||
    text.includes("airport") ||
    text.includes("igi")
  ) {
    return {
      src: "/assets/destinations/delhi-india-gate.webp",
      caption: "Yamuna Expressway to India Gate & Delhi NCR",
      alt: "High-speed Yamuna Expressway corridor connecting Agra to Delhi NCR",
      corridorBadge: "Yamuna Expressway • 165 km Access-Controlled Corridor",
    };
  }

  // 2. Jaipur & Rajasthan Corridors (NH-21 / Golden Triangle)
  if (
    text.includes("jaipur") ||
    text.includes("rajasthan") ||
    text.includes("pushkar") ||
    text.includes("ajmer") ||
    text.includes("jodhpur") ||
    text.includes("udaipur")
  ) {
    return {
      src: "/assets/destinations/jaipur-hawa-mahal.webp",
      caption: "Jaipur Pink City & Hawa Mahal Heritage Highway",
      alt: "Scenic chauffeured drive along NH-21 from Agra to Jaipur Pink City",
      corridorBadge: "NH-21 Heritage Highway • Via Fatehpur Sikri & Bharatpur",
    };
  }

  // 3. Mathura & Vrindavan (Braj Pilgrimage Corridor - NH-19)
  if (
    text.includes("mathura") ||
    text.includes("vrindavan") ||
    text.includes("barsana") ||
    text.includes("govardhan") ||
    text.includes("gokul") ||
    text.includes("nandgaon")
  ) {
    return {
      src: "/assets/places/mathura-prem-mandir.webp",
      caption: "Braj Bhoomi & Prem Mandir Vrindavan Circuit",
      alt: "Chauffeured spiritual pilgrimage corridor from Agra to Mathura and Vrindavan",
      corridorBadge: "NH-19 Braj Corridor • 55 km Direct Sacred Transit",
    };
  }

  // 4. Gwalior & Madhya Pradesh (NH-44 Corridor)
  if (text.includes("gwalior") || text.includes("chambal") || text.includes("orchha") || text.includes("khajuraho")) {
    return {
      src: "/assets/places/gwalior-fort.jpg",
      caption: "Historic Gwalior Fort & Man Mandir Palace",
      alt: "Agra to Gwalior historic fortress and Chambal sanctuary corridor",
      corridorBadge: "NH-44 North-South Corridor • 120 km Historic Highway",
    };
  }

  // 5. Lucknow & Eastern UP (Agra-Lucknow Expressway)
  if (
    text.includes("lucknow") ||
    text.includes("ayodhya") ||
    text.includes("kanpur") ||
    text.includes("varanasi") ||
    text.includes("prayagraj")
  ) {
    return {
      src: "/assets/places/lucknow-imambara.jpg",
      caption: "Agra-Lucknow Expressway & Heritage Corridor",
      alt: "Fastest 6-lane greenfield expressway connecting Agra to Lucknow",
      corridorBadge: "Agra-Lucknow Expressway • 302 km High-Speed Corridor",
    };
  }

  // 6. Fatehpur Sikri Corridor
  if (text.includes("fatehpur")) {
    return {
      src: "/assets/destinations/fatehpur-sikri.webp",
      caption: "Fatehpur Sikri UNESCO Heritage Citadel",
      alt: "Imperial Mughal highway corridor to Emperor Akbar's ghost capital",
      corridorBadge: "Agra-Bikaner Highway • 37 km Royal Mughal Corridor",
    };
  }

  // 7. Agra Local Sightseeing
  if (
    text.includes("local") ||
    text.includes("sightseeing") ||
    text.includes("darshan") ||
    (from.toLowerCase() === "agra" && to.toLowerCase() === "agra")
  ) {
    return {
      src: "/assets/places/gallery/taj-mahal-01.jpg",
      caption: "Taj Mahal Dawn & Agra Local Heritage Circuit",
      alt: "Agra local sightseeing private taxi covering Taj Mahal and Agra Fort",
      corridorBadge: "Agra Heritage Circuit • Taj Mahal, Red Fort & Mehtab Bagh",
    };
  }

  // 8. General Authentic Highway Journey fallback
  return {
    src: "/assets/hero/hero-highway.webp",
    caption: `${from} to ${to} Highway Corridor`,
    alt: `Private AC chauffeur travel corridor from ${from} to ${to}`,
    corridorBadge: "National Highway / Expressway Corridor • Doorstep Transit",
  };
}
