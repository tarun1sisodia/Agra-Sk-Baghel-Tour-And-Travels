import { useState, useEffect, useCallback, useRef } from "react";
import { BrandLogo } from "./BrandLogo";
import { MobileNavSheet } from "./MobileNavSheet";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { getCustomerDisplayName, getCustomerAvatarUrl, getCustomerInitials, useCustomerAuth } from "../../auth/customerAuth";

export interface HeaderProps {
  currentPath?: string;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export function Header({
  currentPath,
  onToggleMobileNav,
  isMobileNavOpen: controlledMobileNav,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalMobileNav, setInternalMobileNav] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { user, loading: authLoading, configured, signInWithGoogle, signOut } = useCustomerAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobileNavOpen = controlledMobileNav !== undefined ? controlledMobileNav : internalMobileNav;

  const [activePath, setActivePath] = useState<string>(
    currentPath || (typeof window !== "undefined" ? window.location.pathname : "/")
  );

  useEffect(() => {
    if (currentPath) {
      setActivePath(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLocationChange = () => {
      setActivePath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const toggleMobileNav = useCallback(() => {
    if (onToggleMobileNav) {
      onToggleMobileNav();
    } else {
      setInternalMobileNav((prev) => !prev);
    }
  }, [onToggleMobileNav]);

  const closeMobileNav = useCallback(() => {
    if (onToggleMobileNav) {
      onToggleMobileNav();
    } else {
      setInternalMobileNav(false);
    }
  }, [onToggleMobileNav]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/en/about/" },
    { label: "Services", href: "/en/services/" },
    { label: "Taxi Rental", href: "/en/taxis/rent/" },
    { label: "Routes", href: "/en/routes/" },
    { label: "Packages", href: "/en/packages/" },
    { label: "Fleet", href: "/en/fleet/" },
    { label: "Contact", href: "/en/contact/" },
  ];

  const normalizeNavPath = (path: string): string => {
    if (!path) return "/";
    const cleaned = path.split("?")[0].split("#")[0];
    const unlocalized = cleaned.replace(/^\/(?:en|hi)(?=\/|$)/, "");
    const trimmed = unlocalized.replace(/\.html$/, "").replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  };

  const isLinkActive = useCallback(
    (href: string) => {
      const current = normalizeNavPath(activePath);
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
    },
    [activePath]
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 ${isScrolled
            ? "bg-surface/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(159,60,22,0.08)] border-b border-border-warm/60"
            : "bg-surface/90 backdrop-blur-md border-b border-border-warm/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
          }`}
        id="site-header"
      >
        <div className="h-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Logo & Brand Mark */}
          <div className="flex items-center gap-2 shrink-0">
            <BrandLogo href="/" />
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => prefetchDocument(link.href)}
                  aria-current={active ? "page" : undefined}
                  style={
                    active
                      ? { backgroundColor: "#792410", color: "#ffffff" }
                      : undefined
                  }
                  className={`px-2.5 py-1 text-xs font-semibold transition-colors rounded-md ${active
                      ? "bg-[#792410] !text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-sandstone-wash"
                    }`}
                >
                  <span
                    style={active ? { color: "#ffffff" } : undefined}
                    className={active ? "!text-white" : undefined}
                  >
                    {link.label}
                  </span>
                </a>
              );
            })}
          </nav>

          {/* Actions: Phone, WhatsApp, and Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {!mounted ? (
              configured ? (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle().catch((error) => setAccountError(error instanceof Error ? error.message : "Sign-in could not start."))}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-sandstone-wash transition-colors shadow-xs cursor-pointer"
                >
                  <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-primary shadow-2xs">G</span>
                  <span>Sign in</span>
                </button>
              ) : null
            ) : (!authLoading && (user ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-sandstone-wash py-1 pl-1.5 pr-2.5 text-xs font-semibold text-primary hover:bg-surface-container-high transition-all shadow-xs cursor-pointer"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  title={user.email ?? "My account"}
                >
                  {getCustomerAvatarUrl(user) ? (
                    <img
                      src={getCustomerAvatarUrl(user)!}
                      alt={getCustomerDisplayName(user)}
                      className="h-6 w-6 rounded-full object-cover border border-primary/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {getCustomerInitials(user)}
                    </span>
                  )}
                  <span className="max-w-28 truncate">{getCustomerDisplayName(user)}</span>
                  <span className={`material-symbols-outlined text-[15px] text-primary/70 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-border-warm bg-white py-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                  >
                    <div className="px-4 py-2.5 border-b border-border-warm/60">
                      <p className="text-xs font-bold text-ink-midnight truncate">{getCustomerDisplayName(user)}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <a
                        href="/my-bookings/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-sandstone-wash transition-colors"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
                        <span>My Bookings</span>
                      </a>
                      <a
                        href="/book.html"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-sandstone-wash transition-colors"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">add_circle</span>
                        <span>New Booking</span>
                      </a>
                    </div>
                    <div className="border-t border-border-warm/60 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          void signOut().catch(() => {});
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[16px] text-red-600">logout</span>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : configured ? (
              <button
                type="button"
                onClick={() => void signInWithGoogle().catch((error) => setAccountError(error instanceof Error ? error.message : "Sign-in could not start."))}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-sandstone-wash transition-colors shadow-xs cursor-pointer"
              >
                <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-primary shadow-2xs">G</span>
                <span>Sign in</span>
              </button>
            ) : null))}
            {/* Phone Call CTA */}
            <a
              href={`tel:${contact.phone}`}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sandstone-wash hover:bg-surface-container-high transition-colors text-xs text-primary font-bold border border-primary/20"
              aria-label={`Call ${contact.phoneDisplay}`}
            >
              <span className="material-symbols-outlined text-primary text-icon-15">call</span>
              <span>{contact.phoneDisplay}</span>
            </a>

            {/* WhatsApp - Luxury black button with real WhatsApp icon */}
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels,%20I%20would%20like%20to%20inquire%20about%20a%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp for booking inquiry (opens in new window)"
              style={{ color: "#ffffff" }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all active:scale-[0.98] border border-white/15"
            >
              <WhatsAppIcon className="w-[15px] h-[15px] shrink-0 text-white" />
              <span className="text-white font-medium" style={{ color: "#ffffff" }}>WhatsApp</span>
            </a>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileNavOpen}
              className="xl:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-md text-on-surface hover:bg-sandstone-wash transition-colors flex items-center justify-center border border-border-warm/50"
            >
              <span className="material-symbols-outlined text-icon-20">
                {isMobileNavOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
          {accountError && <p role="status" className="absolute right-4 top-12 z-50 max-w-xs rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{accountError}</p>}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavSheet
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
        currentPath={activePath}
      />
    </>
  );
}

export default Header;
