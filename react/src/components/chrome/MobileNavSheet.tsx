import { useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { getCustomerDisplayName, getCustomerAvatarUrl, getCustomerInitials, useCustomerAuth } from "../../auth/customerAuth";
import { useState } from "react";

export interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export function MobileNavSheet({
  isOpen,
  onClose,
  currentPath = "/",
}: MobileNavSheetProps) {
  const { user, configured, signInWithGoogle, signOut } = useCustomerAuth();
  const [accountError, setAccountError] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    { label: "Home", href: "/", icon: "home" },
    { label: "About Us", href: "/en/about/", icon: "info" },
    { label: "Services", href: "/en/services/", icon: "room_service" },
    { label: "Taxi Rental", href: "/en/taxis/rent/", icon: "local_taxi" },
    { label: "Outstation Routes", href: "/en/routes/", icon: "alt_route" },
    { label: "Tour Packages", href: "/en/packages/", icon: "explore" },
    { label: "Fleet Showroom", href: "/en/fleet/", icon: "directions_car" },
    { label: "Contact & Support", href: "/en/contact/", icon: "support_agent" },
    { label: "FAQs", href: "/en/faq/", icon: "help" },
  ];


  const normalizeNavPath = (path: string): string => {
    if (!path) return "/";
    const cleaned = path.split("?")[0].split("#")[0];
    const unlocalized = cleaned.replace(/^\/(?:en|hi)(?=\/|$)/, "");
    const trimmed = unlocalized.replace(/\.html$/, "").replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  };

  const isLinkActive = (href: string) => {
    const current = normalizeNavPath(currentPath);
    const target = normalizeNavPath(href);

    if (target === "/") {
      return current === "/";
    }
    if (target === "/taxis/rent") {
      return current === "/taxis/rent" || current === "/rent" || current === "/rental" || current === "/taxi-rental";
    }
    if (target === "/routes") {
      return current === "/routes" || current.startsWith("/routes/") || current.endsWith("-taxi");
    }
    if (target === "/packages") {
      return current === "/packages" || current.startsWith("/packages/");
    }
    if (target === "/fleet") {
      return current === "/fleet" || current === "/vehicles" || current.startsWith("/fleet/") || current.startsWith("/vehicles/");
    }
    return current === target || current.startsWith(target + "/");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-midnight/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-border-warm animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-space-md border-b border-border-warm bg-sandstone-wash/40">
            <BrandLogo href="/" onClick={onClose} />
            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={onClose}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-icon-20">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-space-md flex flex-col gap-1" aria-label="Mobile Primary">
            {links.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  onMouseEnter={() => prefetchDocument(link.href)}
                  aria-current={active ? "page" : undefined}
                  style={
                    active
                      ? { backgroundColor: "#792410", color: "#ffffff" }
                      : undefined
                  }
                  className={`flex items-center gap-space-sm px-3.5 py-3 rounded-lg text-title-md transition-colors ${
                    active
                      ? "bg-[#792410] !text-white font-semibold shadow-xs"
                      : "text-on-surface hover:bg-sandstone-wash"
                  }`}
                >
                  <span
                    style={active ? { color: "#ffffff" } : undefined}
                    className={`material-symbols-outlined text-icon-20 ${active ? "!text-white" : "text-terracotta-sandstone"}`}
                  >
                    {link.icon}
                  </span>
                  <span
                    style={active ? { color: "#ffffff" } : undefined}
                    className={active ? "!text-white font-semibold" : undefined}
                  >
                    {link.label}
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-space-md border-t border-border-warm bg-sandstone-wash/30 flex flex-col gap-space-sm">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white p-3 shadow-xs">
                {getCustomerAvatarUrl(user) ? (
                  <img
                    src={getCustomerAvatarUrl(user)!}
                    alt={getCustomerDisplayName(user)}
                    className="h-10 w-10 rounded-full object-cover border border-primary/30 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white shrink-0">
                    {getCustomerInitials(user)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-ink-midnight truncate">{getCustomerDisplayName(user)}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/my-bookings/"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-surface-container-lowest py-2.5 text-xs font-semibold text-primary hover:bg-sandstone-wash transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>My Bookings</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void signOut().catch(() => {});
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : configured ? (
            <button type="button" onClick={() => void signInWithGoogle().catch((error) => setAccountError(error instanceof Error ? error.message : "Sign-in could not start."))} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-xs cursor-pointer"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-primary" aria-hidden="true">G</span><span>Continue with Google</span></button>
          ) : null}
          {accountError && <p role="alert" className="rounded-md bg-red-50 p-2 text-xs text-red-800">{accountError}</p>}
          {/* Direct Call & WhatsApp Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-icon-18">call</span>
              <span>Call Desk</span>
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20Agra%20SK%20Baghel%20Tour%20and%20Travels`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff" }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-black text-white font-label-lg text-label-lg hover:bg-neutral-900 transition-colors shadow-sm border border-white/10 active:scale-[0.98]"
            >
              <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
            </a>
          </div>

          <div className="text-center text-body-sm text-secondary text-body-lg pt-1">
            24×7 Taj Ganj Agra Dispatch • Transparent Fares
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileNavSheet;
