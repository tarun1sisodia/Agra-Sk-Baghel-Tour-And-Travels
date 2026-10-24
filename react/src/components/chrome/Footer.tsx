import { BrandLogo } from "./BrandLogo";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

function SocialIcon({ name }: { name: "facebook" | "instagram" | "youtube" }) {
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v8h3.4Z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.5" cy="6.6" r="1" className="fill-current stroke-none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M21.6 7.1a2.9 2.9 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 1.9 12a30 30 0 0 0 .5 4.9 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2 30 30 0 0 0 .5-4.9 30 30 0 0 0-.5-4.9ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

export interface FooterProps {
  currentPath?: string;
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  const fleetLinks = [
    { name: "Explore our vehicles", href: "/fleet" },
    { name: "Vehicle comfort & capacity", href: "/fleet" },
    { name: "Chauffeur-driven travel", href: "/services" },
  ];
  const routeLinks = [
    { name: "Plan an intercity journey", href: "/routes" },
    { name: "Airport transfers", href: "/routes" },
    { name: "Local Agra travel", href: "/routes" },
  ];
  const tourLinks = [
    { name: "Explore sightseeing tours", href: "/en/packages/" },
    { name: "Heritage experiences", href: "/en/packages/" },
    { name: "Travel services & safety", href: "/services" },
  ];
  return (
    <footer
      className={`w-full bg-surface-container-low text-on-surface-variant border-t border-border-warm pb-24 md:pb-0 ${className}`.trim()}
      style={{ backgroundImage: "linear-gradient(rgba(32, 25, 20, 0.88), rgba(32, 25, 20, 0.92)), url('/assets/home-hero/agra-fort-1280.webp')", backgroundPosition: "center", backgroundSize: "cover", backgroundColor: "#201914" }}
      role="contentinfo"
    >

      {/* Main 4-Column Directory */}
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-2xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl">
          {/* Column 1: Brand & NAP */}
          <div className="flex flex-col gap-space-md">
            <BrandLogo href="/" />
            <p className="font-body-sm text-body-sm text-white/85 leading-relaxed">
              Reliable taxi service, outstation cabs, and guided sightseeing tours in Agra and across North India. Government-approved tourist fleet operator.
            </p>
            <div className="flex flex-col gap-space-xs mt-space-xs">
              <span className="font-label-caps text-label-caps text-amber-200 uppercase font-bold tracking-wider">
                Taj Ganj Office
              </span>
              <p className="font-body-sm text-body-sm text-white/85">
                {contact.address}
              </p>
            <div className="flex flex-col gap-1 pt-1 text-body-sm">
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`Call us at ${contact.phoneDisplay}`}
                  className="inline-flex items-center gap-2 text-white/85 hover:text-amber-200 transition-colors py-2 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-primary text-icon-18">call</span>
                  <span>{contact.phoneDisplay}</span>
                </a>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact WhatsApp customer support desk (opens in new window)"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-amber-200 transition-colors py-2 min-h-[44px]"
                >
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Taj Ganj office on Google Maps (opens in new window)"
                  className="inline-flex items-center gap-space-xs text-amber-200 hover:underline font-label-lg text-label-lg py-2 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-icon-16">map</span>
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
            <div className="pt-space-xs">
              <p className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider mb-2">
                Follow our travel desk
              </p>
              <div className="flex flex-wrap gap-2" aria-label="Social media links">
                <a
                  href="https://www.facebook.com/share/19Le5PLBDo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Agra SK Baghel Tour and Travels on Facebook"
                  title="Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white hover:border-amber-200 hover:bg-amber-200 hover:text-black transition-colors"
                >
                  <SocialIcon name="facebook" />
                </a>
                <a
                  href="https://www.instagram.com/agra_skbaghel_tourandtravels?stkn=dTZrMjU4bGYza3hx"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Agra SK Baghel Tour and Travels on Instagram"
                  title="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white hover:border-amber-200 hover:bg-amber-200 hover:text-black transition-colors"
                >
                  <SocialIcon name="instagram" />
                </a>
                <a
                  href="https://youtube.com/@agraskbaghel_tourandtravels?si=paXJ1oLHgGZvgXxN"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Agra SK Baghel Tour and Travels on YouTube"
                  title="YouTube"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white hover:border-amber-200 hover:bg-amber-200 hover:text-black transition-colors"
                >
                  <SocialIcon name="youtube" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Fleet Directory */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-white font-semibold">
              Our Fleet
            </h3>
            <ul className="flex flex-col gap-1 font-body-sm text-body-sm text-white/85">
              {fleetLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center hover:text-amber-200 transition-colors py-2 min-h-[44px]"
                  >
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Intercity Routes */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-white font-semibold">
              Popular Routes
            </h3>
            <ul className="flex flex-col gap-1 font-body-sm text-body-sm text-white/85">
              {routeLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center hover:text-amber-200 transition-colors py-2 min-h-[44px]"
                  >
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Tours */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-white font-semibold">
              Sightseeing Tours
            </h3>
            <nav className="flex flex-col gap-1 font-body-sm text-body-sm text-white/85">
              {tourLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onMouseEnter={() => prefetchDocument(item.href)}
                  className="flex items-center hover:text-amber-200 transition-colors py-2 min-h-[44px]"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sub-Footer & Legal Copyright */}
      <div className="border-t border-border-warm bg-surface-container/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
          <p className="font-body-sm text-body-sm text-on-surface-variant text-title-lg">
            © {new Date().getFullYear()} Agra SK Baghel Tour and Travels. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-title-lg">
            <a href="/privacy-policy/" className="hover:text-amber-200 transition-colors py-2 min-h-[44px] inline-flex items-center">Privacy Policy</a>
            <span className="text-border-warm">•</span>
            <a href="/terms-and-conditions/" className="hover:text-amber-200 transition-colors py-2 min-h-[44px] inline-flex items-center">Terms of Service</a>
            <span className="text-border-warm">•</span>
            <a href="/en/faq/" className="hover:text-amber-200 transition-colors py-2 min-h-[44px] inline-flex items-center">FAQ & Cancellation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
