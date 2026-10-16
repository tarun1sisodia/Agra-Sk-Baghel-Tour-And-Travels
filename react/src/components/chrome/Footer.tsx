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
    { name: "Dzire Sedan (4+1)", rate: "From ₹10/km", href: "/fleet" },
    { name: "Maruti Ertiga MPV (6+1)", rate: "From ₹14/km", href: "/fleet" },
    { name: "Innova Crysta VIP (6+1)", rate: "From ₹18/km", href: "/fleet" },
    { name: "Tempo Traveller (12–16s)", rate: "From ₹25/km", href: "/fleet" },
    { name: "Force Urbania Luxury (16s)", rate: "From ₹34/km", href: "/fleet" },
  ];

  const routeLinks = [
    { name: "Agra → Delhi / IGI Airport", fare: "₹3,499", href: "/routes" },
    { name: "Agra → Jaipur Pink City", fare: "₹3,499", href: "/routes" },
    { name: "Agra → Mathura Vrindavan", fare: "₹2,200", href: "/routes" },
    { name: "Agra → Gwalior Fort", fare: "₹3,000", href: "/routes" },
    { name: "Agra → Fatehpur Sikri", fare: "₹1,800", href: "/routes" },
  ];

  const tourLinks = [
    { name: "Taj Mahal Sunrise Tour", href: "/en/packages/taj-mahal-sunrise-tour/" },
    { name: "Mathura-Vrindavan Tour", href: "/en/packages/mathura-vrindavan/" },
    { name: "Golden Triangle 3-City Tour", href: "/en/packages/golden-triangle/" },
    { name: "Agra Local Sightseeing (8h/80km)", href: "/en/packages/agra-sightseeing/" },
    { name: "Driver Standards & Safety", href: "/services" },
  ];

  return (
    <footer
      className={`w-full bg-surface-container-low text-on-surface-variant border-t border-border-warm pb-24 md:pb-0 ${className}`.trim()}
      role="contentinfo"
    >

      {/* Main 4-Column Directory */}
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-2xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl">
          {/* Column 1: Brand & NAP */}
          <div className="flex flex-col gap-space-md">
            <BrandLogo href="/" />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Reliable taxi service, outstation cabs, and guided sightseeing tours in Agra and across North India. Government-approved tourist fleet operator.
            </p>
            <div className="flex flex-col gap-space-xs mt-space-xs">
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Taj Ganj Office
              </span>
              <p className="font-body-sm text-body-sm text-on-surface">
                {contact.address}
              </p>
            <div className="flex flex-col gap-1 pt-1 text-body-sm">
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`Call us at ${contact.phoneDisplay}`}
                  className="inline-flex items-center gap-2 text-on-surface hover:text-primary transition-colors py-2 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-primary text-icon-18">call</span>
                  <span>{contact.phoneDisplay}</span>
                </a>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact WhatsApp customer support desk (opens in new window)"
                  className="inline-flex items-center gap-2 text-on-surface hover:text-primary transition-colors py-2 min-h-[44px]"
                >
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Taj Ganj office on Google Maps (opens in new window)"
                  className="inline-flex items-center gap-space-xs text-primary hover:underline font-label-lg text-label-lg py-2 min-h-[44px]"
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-surface text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <SocialIcon name="facebook" />
                </a>
                <a
                  href="https://www.instagram.com/agra_skbaghel_tourandtravels?stkn=dTZrMjU4bGYza3hx"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Agra SK Baghel Tour and Travels on Instagram"
                  title="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-surface text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <SocialIcon name="instagram" />
                </a>
                <a
                  href="https://youtube.com/@agraskbaghel_tourandtravels?si=paXJ1oLHgGZvgXxN"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Agra SK Baghel Tour and Travels on YouTube"
                  title="YouTube"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-surface text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <SocialIcon name="youtube" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Fleet Directory */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Our Fleet
            </h3>
            <ul className="flex flex-col gap-1 font-body-sm text-body-sm">
              {fleetLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center justify-between hover:text-primary transition-colors py-2 min-h-[44px]"
                  >
                    <span>{item.name}</span>
                    <span className="font-label-caps text-label-caps text-primary font-semibold">{item.rate}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Intercity Routes */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Popular Routes
            </h3>
            <ul className="flex flex-col gap-1 font-body-sm text-body-sm">
              {routeLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center justify-between hover:text-primary transition-colors py-2 min-h-[44px]"
                  >
                    <span>{item.name}</span>
                    <span className="font-label-caps text-label-caps text-primary font-semibold">{item.fare}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Tours */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Sightseeing Tours
            </h3>
            <nav className="flex flex-col gap-1 font-body-sm text-body-sm">
              {tourLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onMouseEnter={() => prefetchDocument(item.href)}
                  className="flex items-center hover:text-primary transition-colors py-2 min-h-[44px]"
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
            <a href="/privacy" className="hover:text-primary transition-colors py-2 min-h-[44px] inline-flex items-center">Privacy Policy</a>
            <span className="text-border-warm">•</span>
            <a href="/terms" className="hover:text-primary transition-colors py-2 min-h-[44px] inline-flex items-center">Terms of Service</a>
            <span className="text-border-warm">•</span>
            <a href="/faq" className="hover:text-primary transition-colors py-2 min-h-[44px] inline-flex items-center">FAQ & Cancellation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
