import React from "react";
import Reveal from "../components/reveal";
import { MonumentCard, type MonumentCardContract } from "../components/cards";
import { SectionHeading } from "../components/badges";
import type { SupportedLanguage } from "../config";
import generatedPublishedContent from "../data/generated-published-content.json";

const MONUMENT_IMAGES: Record<string, { src: string; alt: string }> = {
  "taj-mahal": {
    src: "/assets/places/agra-taj-mahal.webp",
    alt: "Taj Mahal in Agra",
  },
  "agra-red-fort": {
    src: "/assets/places/agra-red-fort.webp",
    alt: "Agra Fort at sunset",
  },
  "fatehpur-sikri": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Buland Darwaza at Fatehpur Sikri",
  },
  "moti-masjid-pearl-mosque": {
    src: "/assets/places/agra-red-fort.webp",
    alt: "Agra Fort complex, where Moti Masjid is located",
  },
  "jodha-bai-ka-rauza": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Buland Darwaza at Fatehpur Sikri",
  },
  "mariam-uz-zamani-palace": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Buland Darwaza at Fatehpur Sikri",
  },
};

type PublishedMonument = {
  name?: string;
  slug?: string;
  monumentCode?: string;
  visitingHours?: string;
};

function slugifyMonumentName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const publishedMonuments = ((generatedPublishedContent as { monuments?: PublishedMonument[] }).monuments ?? [])
  .filter((item): item is PublishedMonument & { name: string } => Boolean(item?.name?.trim()))
  .map((item): MonumentCardContract => {
    const slug = item.slug || item.monumentCode || slugifyMonumentName(item.name);
    const image = MONUMENT_IMAGES[slug];
    return {
      slug,
      name: item.name,
      thumbnail: image?.src,
      thumbnailAlt: image?.alt,
      visitingHours: item.visitingHours,
    };
  });

export interface MonumentsPageProps {
  language?: SupportedLanguage;
}

export function MonumentsPage({ language = "en" }: MonumentsPageProps) {
  return (
    <main className="min-h-screen bg-ivory text-ink">
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
        <Reveal>
          <SectionHeading
            as="h1"
            index="M"
            kicker={`${publishedMonuments.length} published guides`}
            title={
              <>
                Stones that <em className="text-saffron italic">sing</em>
              </>
            }
          />
        </Reveal>
        <h2 className="sr-only">Published monument guides</h2>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
          {publishedMonuments.map((monument, index) => (
            <Reveal key={monument.slug} delay={index * 80}>
              <MonumentCard monument={monument} />
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MonumentsPage;
