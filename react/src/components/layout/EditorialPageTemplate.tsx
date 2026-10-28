import { useState, type ReactNode, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { contact } from "../../data/contact";

/* ═══════════════════════════════════════════════════════════════
   1. EDITORIAL TYPOGRAPHY STANDARDS (Font Sizes & Colors)
   Strictly standardized across all pages matching the Master Homepage:
   - Headlines: EB Garamond (serif), Ink Charcoal #181D27
   - Subheadings / Highlights: Terracotta Sandstone #C85A32 or Primary #9F3C16
   - Body Copy: Plus Jakarta Sans (sans), On-Surface Variant #52433D
   - Eyebrows & Badges: Plus Jakarta Sans, uppercase tracking-widest
   - Dark mode / contrast: Ivory Surface #FDF8F5 or White #FFFFFF
═══════════════════════════════════════════════════════════════ */

export const EDITORIAL_TYPOGRAPHY = {
  // Page Title H1 (Hero) — 26px desktop, 20px mobile
  heroH1: "font-headline-hero text-headline-hero text-ink-charcoal tracking-tight leading-[1.14]",
  heroH1Dark: "font-headline-hero text-headline-hero text-ivory-surface tracking-tight leading-[1.14]",
  heroAccent: "italic font-serif font-normal text-terracotta-sandstone",
  heroAccentGold: "italic font-serif font-normal text-gold-accent",

  // Section Heading H2 — 20px desktop, 17px mobile
  sectionH2: "font-headline-lg text-headline-lg text-ink-charcoal font-semibold leading-tight",
  sectionH2Dark: "font-headline-lg text-headline-lg text-ivory-surface font-semibold leading-tight",

  // Card Title H3 — 15px
  cardH3: "font-headline-md text-headline-md text-ink-charcoal font-semibold leading-snug",
  cardH3Dark: "font-headline-md text-headline-md text-ivory-surface font-semibold leading-snug",

  // Subsection / Accordion H4 — 13.5px
  subH4: "font-headline-sm text-headline-sm text-ink-charcoal font-semibold leading-snug",
  subH4Dark: "font-headline-sm text-headline-sm text-ivory-surface font-semibold leading-snug",

  // Body & Descriptions (Plus Jakarta Sans)
  lead: "font-body-lg text-body-lg text-on-surface-variant leading-relaxed",
  leadDark: "font-body-lg text-body-lg text-ivory-surface/85 leading-relaxed",
  body: "font-body-md text-body-md text-on-surface-variant leading-relaxed",
  bodyDark: "font-body-md text-body-md text-ivory-surface/75 leading-relaxed",
  compact: "font-body-sm text-body-sm text-on-surface-variant leading-relaxed",
  compactDark: "font-body-sm text-body-sm text-ivory-surface/70 leading-relaxed",

  // Eyebrows, Pills & Labels (Uppercase tracking-widest)
  eyebrow: "font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold block",
  eyebrowSandstone: "font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-wider font-bold block",
  eyebrowGold: "font-label-caps text-label-caps text-gold-accent uppercase tracking-widest font-bold block",

  // Currency & Fare Display (EB Garamond 18px)
  price: "font-price-display text-price-display text-primary font-bold",
  priceDark: "font-price-display text-price-display text-white font-bold",

  // Breadcrumbs
  breadcrumb: "flex items-center gap-space-xs text-on-surface-variant font-label-caps text-xs",
} as const;

/* ═══════════════════════════════════════════════════════════════
   2. EDITORIAL BUTTON STANDARDS (Button Sizes & Colors)
   Strictly standardized across all pages matching the Master Homepage:
   - Primary: Terracotta #9F3C16, text-white, px-4 py-2.5 rounded-lg
   - WhatsApp: Pure Black #000000, border-white/15, pure white text #ffffff
   - Secondary / Sandstone: Sandstone wash, border-primary/25, text-primary
   - Outline: Border warm, transparent, text-ink-charcoal
═══════════════════════════════════════════════════════════════ */

export const EDITORIAL_BUTTONS = {
  // Standard Size (Default for content sections, cards, and page actions)
  primary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  // Large Size (Hero section CTAs)
  primaryLarge:
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-label-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  // Compact Size (Table rows, small cards)
  primaryCompact:
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-label-md font-semibold shadow-xs active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  // Pure Black WhatsApp Button (Guaranteed #ffffff text and icon)
  whatsapp:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/15 text-white font-label-lg text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  whatsappLarge:
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-neutral-900 border border-white/20 text-white font-label-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  whatsappCompact:
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/15 text-white font-label-lg text-label-md font-semibold shadow-xs active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer",

  // Soft Sandstone / Secondary Button
  secondary:
    "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sandstone-wash hover:bg-primary/10 text-primary border border-primary/25 hover:border-primary/50 font-label-lg text-label-md font-semibold transition-all duration-200 whitespace-nowrap active:scale-[0.98] shadow-xs cursor-pointer",

  // Outline / Ghost Button
  outline:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-warm bg-transparent hover:bg-surface-container text-ink-charcoal font-label-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer",
} as const;

/* ═══════════════════════════════════════════════════════════════
   3. REUSABLE ACTION BUTTON COMPONENTS
═══════════════════════════════════════════════════════════════ */

export interface ButtonBaseProps {
  size?: "sm" | "md" | "lg";
  icon?: string | ReactNode;
  iconPosition?: "left" | "right";
  children: ReactNode;
  className?: string;
}

export type ActionButtonProps = ButtonBaseProps & (
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ onClick?: () => void } & ButtonHTMLAttributes<HTMLButtonElement>)
);

export function PrimaryButton({
  size = "md",
  icon = "arrow_forward",
  iconPosition = "right",
  children,
  className = "",
  ...props
}: ActionButtonProps) {
  const sizeClass =
    size === "lg"
      ? EDITORIAL_BUTTONS.primaryLarge
      : size === "sm"
      ? EDITORIAL_BUTTONS.primaryCompact
      : EDITORIAL_BUTTONS.primary;

  const iconElement =
    typeof icon === "string" ? (
      <span className="material-symbols-outlined text-icon-15 text-white shrink-0">{icon}</span>
    ) : (
      icon
    );

  if ("href" in props && props.href) {
    return (
      <a className={`${sizeClass} ${className}`} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {iconPosition === "left" && iconElement}
        <span className="text-white">{children}</span>
        {iconPosition === "right" && iconElement}
      </a>
    );
  }

  return (
    <button type="button" className={`${sizeClass} ${className}`} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {iconPosition === "left" && iconElement}
      <span className="text-white">{children}</span>
      {iconPosition === "right" && iconElement}
    </button>
  );
}

export interface WhatsAppButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  size?: "sm" | "md" | "lg";
  inquiryText?: string;
  phone?: string;
  label?: string;
  className?: string;
}

export function WhatsAppButton({
  size = "md",
  inquiryText = "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about cab bookings.",
  phone = contact.whatsapp,
  label = "WhatsApp Inquiry",
  className = "",
  style,
  ...props
}: WhatsAppButtonProps) {
  const sizeClass =
    size === "lg"
      ? EDITORIAL_BUTTONS.whatsappLarge
      : size === "sm"
      ? EDITORIAL_BUTTONS.whatsappCompact
      : EDITORIAL_BUTTONS.whatsapp;

  const iconSize = size === "lg" ? "w-4 h-4" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent(inquiryText)}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#ffffff", ...style }}
      className={`${sizeClass} ${className}`}
      {...props}
    >
      <WhatsAppIcon className={`${iconSize} shrink-0 text-white`} />
      <span className="text-white font-semibold" style={{ color: "#ffffff" }}>
        {label}
      </span>
    </a>
  );
}

export function SecondaryButton({
  size = "md",
  icon,
  iconPosition = "right",
  children,
  className = "",
  ...props
}: ActionButtonProps) {
  const iconElement =
    typeof icon === "string" ? (
      <span className="material-symbols-outlined text-icon-14 text-primary shrink-0">{icon}</span>
    ) : (
      icon
    );

  if ("href" in props && props.href) {
    return (
      <a className={`${EDITORIAL_BUTTONS.secondary} ${className}`} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {iconPosition === "left" && iconElement}
        <span>{children}</span>
        {iconPosition === "right" && iconElement}
      </a>
    );
  }

  return (
    <button type="button" className={`${EDITORIAL_BUTTONS.secondary} ${className}`} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {iconPosition === "left" && iconElement}
      <span>{children}</span>
      {iconPosition === "right" && iconElement}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. REUSABLE TYPOGRAPHY CAPSULE PILL
═══════════════════════════════════════════════════════════════ */

export interface EditorialPillProps {
  children: ReactNode;
  variant?: "primary" | "gold" | "jade" | "dark" | "sandstone";
  className?: string;
}

export function EditorialPill({
  children,
  variant = "primary",
  className = "",
}: EditorialPillProps) {
  const variantClass =
    variant === "gold"
      ? "bg-gold-accent/15 text-gold-accent border-gold-accent/30"
      : variant === "jade"
      ? "bg-success-jade/15 text-success-jade border-success-jade/30"
      : variant === "dark"
      ? "bg-ink-charcoal text-ivory-surface border-white/10"
      : variant === "sandstone"
      ? "bg-sandstone-wash text-terracotta-sandstone border-border-warm/60"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-label-caps text-label-caps uppercase tracking-wider font-bold ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. UNIFIED SECTION HEADER
═══════════════════════════════════════════════════════════════ */

export interface SectionHeaderProps {
  badge?: string;
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  className = "",
  actions,
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl ${className}`}>
      <div className="max-w-2xl">
        {badge && (
          <span className={EDITORIAL_TYPOGRAPHY.eyebrow}>
            {badge}
          </span>
        )}
        <h2 className={EDITORIAL_TYPOGRAPHY.sectionH2}>
          {title}
        </h2>
        {subtitle && (
          <p className={`${EDITORIAL_TYPOGRAPHY.body} mt-2`}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. LUXURY DARK BENTO CARD (Approved 'Why book with us' pattern)
═══════════════════════════════════════════════════════════════ */

export interface LuxuryDarkBentoCardProps {
  icon: string;
  badge: string;
  title: string;
  desc: string;
  className?: string;
}

export function LuxuryDarkBentoCard({
  icon,
  badge,
  title,
  desc,
  className = "",
}: LuxuryDarkBentoCardProps) {
  return (
    <div
      className={`p-5 rounded-xl border flex flex-col gap-3 group transition-all duration-300 bg-ink-charcoal text-ivory-surface border-border-warm/20 hover:border-gold-accent/40 shadow-sm hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 bg-primary text-white">
          <span className="material-symbols-outlined text-icon-20">{icon}</span>
        </div>
        <span className="font-label-caps text-label-caps uppercase font-bold px-2 py-0.5 rounded-full bg-gold-accent/15 text-gold-accent border border-gold-accent/30">
          {badge}
        </span>
      </div>
      <h3 className={EDITORIAL_TYPOGRAPHY.cardH3Dark}>
        {title}
      </h3>
      <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
        {desc}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. PROMO COUPON STRIP (Approved Interactive Strip)
═══════════════════════════════════════════════════════════════ */

export interface PromoCouponStripProps {
  code?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PromoCouponStrip({
  code,
  title = "Seasonal Promotional Discount",
  subtitle = "Valid on select one-way and local tour routes.",
  className = "",
}: PromoCouponStripProps) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-sandstone-wash rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-space-md border border-border-warm/60 shadow-xs hover:shadow-sm transition-all ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-icon-20 text-white">confirmation_number</span>
        </div>
        <div>
          <h4 className="font-title-md text-headline-sm text-on-surface font-bold">{title}</h4>
          <p className="font-body-sm text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg border border-border-warm/40 shadow-sm shrink-0">
        <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">Coupon:</span>
        <code className="font-title-md font-bold text-primary tracking-wider text-xs">{code}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="text-label-lg px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-caps transition-all font-bold shadow-xs active:scale-[0.98] inline-flex items-center gap-1 cursor-pointer"
        >
          {copied ? (
            <>
              <span className="material-symbols-outlined text-icon-13 text-white">check</span>
              <span className="text-white">Copied!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-icon-13 text-white">content_copy</span>
              <span className="text-white">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. OPTIONAL EDITORIAL HERO (For pages wanting atmospheric banner)
═══════════════════════════════════════════════════════════════ */

export interface EditorialHeroProps {
  badge?: string;
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  /** Optional override; defaults to the self-hosted hero image. Provide a plain URL (not a CSS url()). */
  backgroundImage?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    href: string;
    icon?: string;
  };
  whatsAppText?: string;
  trustRibbon?: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  children?: ReactNode;
}

/** Self-hosted default hero (AVIF/WebP); overrides should also be self-hosted. */
const DEFAULT_HERO_AVIF = "/images/hero-taj-sunrise.avif";
const DEFAULT_HERO_WEBP = "/images/hero-taj-sunrise.webp";

export function EditorialHero({
  badge,
  title,
  subtitle,
  backgroundImage,
  breadcrumbs = [{ label: "Home", href: "/" }],
  primaryAction,
  whatsAppText = "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about cab bookings.",
  trustRibbon,
  children,
}: EditorialHeroProps) {
  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-14 bg-ink-midnight text-on-primary overflow-hidden">
      {/* Real <img> (not CSS background) for early discovery. Decorative. */}
      <picture className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {!backgroundImage && (
          <>
            <source
              type="image/avif"
              srcSet="/images/hero-taj-sunrise-480.avif 480w, /images/hero-taj-sunrise-960.avif 960w, /images/hero-taj-sunrise.avif 1920w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              srcSet="/images/hero-taj-sunrise-480.webp 480w, /images/hero-taj-sunrise-960.webp 960w, /images/hero-taj-sunrise.webp 1920w"
              sizes="100vw"
            />
          </>
        )}
        <img
          src={backgroundImage || DEFAULT_HERO_WEBP}
          alt=""
          decoding="async"
          width={1920}
          height={1280}
          className="h-full w-full object-cover opacity-40 contrast-105 brightness-95"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-ink-midnight via-ink-midnight/85 to-ink-midnight/70 z-0 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-midnight to-transparent z-0 pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-margin-mobile lg:px-margin flex flex-col gap-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-body-sm text-xs text-ivory-surface/70 flex-wrap"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={crumb.label} className="inline-flex items-center gap-2">
                  {idx > 0 && <span className="text-ivory-surface/40">/</span>}
                  {crumb.href && !isLast ? (
                    <a
                      href={crumb.href}
                      className="hover:text-gold-accent transition-colors text-ivory-surface/80"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-ivory-surface font-semibold">{crumb.label}</span>
                  )}
                </span>
              );
            })}
          </nav>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl flex flex-col items-start gap-3">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-accent font-label-caps text-label-lg uppercase tracking-widest backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse" />
                <span>{badge}</span>
              </div>
            )}

            <h1 className={EDITORIAL_TYPOGRAPHY.heroH1Dark}>
              {title}
            </h1>

            {subtitle && (
              <p className={EDITORIAL_TYPOGRAPHY.leadDark}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {primaryAction && (
              <PrimaryButton href={primaryAction.href} size="lg" icon={primaryAction.icon || "arrow_forward"}>
                {primaryAction.label}
              </PrimaryButton>
            )}

            <WhatsAppButton size="lg" inquiryText={whatsAppText} label="WhatsApp Desk" />
          </div>
        </div>

        {trustRibbon && trustRibbon.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-2">
            {trustRibbon.map((item) => (
              <div
                key={item.title}
                className="bg-ink-charcoal/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-start gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-gold-accent flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-icon-18">{item.icon}</span>
                </div>
                <div>
                  <h4 className="font-title-md text-xs text-ivory-surface font-bold leading-tight">
                    {item.title}
                  </h4>
                  <p className="font-body-sm text-label-lg text-ivory-surface/75 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}


// Re-export modern semantic typography primitives for unified editorial authoring
export {
  PageHeroTitle,
  SectionHeading,
  CardTitle,
  SubSectionHeading,
  BodyLead,
  BodyText,
  BodySmall,
  Eyebrow,
  PriceDisplay,
  CtaButton,
  Typography,
} from "../ui/typography";
