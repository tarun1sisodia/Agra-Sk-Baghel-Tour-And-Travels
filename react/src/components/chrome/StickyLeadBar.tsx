import { useState, useEffect } from "react";
import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

export interface StickyLeadBarProps {
  currentPath?: string;
}

export function StickyLeadBar({ currentPath }: StickyLeadBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const path =
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const isBookingPage = path.includes("book");

  // Auto-hide when near the bottom of page to prevent collision with footer
  useEffect(() => {
    if (isBookingPage) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const nearBottom = scrollHeight - (scrollTop + clientHeight) < 140;

      setIsVisible(!nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBookingPage]);

  // Don't show on the booking page itself
  if (isBookingPage || !isVisible) return null;

  return (
    <aside
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] border-t border-border-warm px-margin-mobile py-2 flex items-center justify-between gap-space-xs"
      aria-label="Quick contact and booking bar"
      data-nosnippet
    >
      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-surface-container text-on-surface font-label-caps text-label-md font-semibold hover:bg-surface-container-high transition-colors"
        href={`tel:${contact.phone}`}
        aria-label={`Call Desk: ${contact.phoneDisplay}`}
      >
        <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        <span className="mt-0.5">Call Desk</span>
      </a>

      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-black text-white font-label-caps text-label-md font-semibold hover:bg-neutral-900 transition-colors shadow-xs border border-white/10"
        style={{ color: "#ffffff" }}
        href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp: Chat with Support on WhatsApp"
      >
        <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" aria-hidden="true" />
        <span className="mt-0.5 text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
      </a>

      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-primary text-white font-label-caps text-label-md font-semibold hover:bg-primary-container transition-colors shadow-xs"
        href="/book.html"
        aria-label="Book Now: Reserve Cab or Tour Online"
      >
        <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <span className="mt-0.5 text-white">Book Now</span>
      </a>
    </aside>
  );
}

export default StickyLeadBar;
