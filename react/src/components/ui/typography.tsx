import React from "react";
import { cn } from "../../lib/utils";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

/**
 * Production-Ready Editorial Typography & UI Primitives
 * Conforms to FRONTEND_RULES.md (Law 2: Google Mobile Usability & Refined Editorial Hierarchy)
 * Single Source of Truth: Tailwind v4 @theme in react/src/styles/theme.css
 */

/* ─────────────────────────────────────────────────────────────
   1. HERO PAGE TITLE (H1)
   Desktop: 36px (2.25rem), Mobile: 28px (1.75rem), Line-Height: 44px / 34px
   Strictly exactly ONE per page for Googlebot compliance.
   ───────────────────────────────────────────────────────────── */
export interface PageHeroTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  dark?: boolean;
  accent?: string;
  className?: string;
}

export function PageHeroTitle({
  children,
  dark = false,
  accent,
  className,
  ...props
}: PageHeroTitleProps) {
  return (
    <h1
      className={cn(
        "font-headline-hero text-headline-hero-mobile sm:text-headline-hero font-bold tracking-tight leading-tight",
        dark ? "text-ivory-surface" : "text-ink-charcoal",
        className
      )}
      {...props}
    >
      {children}
      {accent && (
        <>
          {" "}
          <span className="italic font-serif font-normal text-terracotta-sandstone">
            {accent}
          </span>
        </>
      )}
    </h1>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. SECTION HEADING (H2)
   Desktop: 28px (1.75rem), Mobile: 24px (1.5rem), Line-Height: 36px / 30px
   Used for major routes, chapters, and primary catalog categories.
   ───────────────────────────────────────────────────────────── */
export interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function SectionHeading({
  children,
  dark = false,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "font-headline-lg text-headline-lg-mobile sm:text-headline-lg font-semibold tracking-tight leading-tight",
        dark ? "text-ivory-surface" : "text-ink-charcoal",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. SUBSECTION & CARD TITLE (H3)
   Desktop: 22px (1.375rem), Mobile: 20px (1.25rem), Line-Height: 30px / 26px
   Used for vehicle fleet specs, itinerary stops, and bento cards.
   ───────────────────────────────────────────────────────────── */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function CardTitle({
  children,
  dark = false,
  className,
  ...props
}: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-headline-md text-headline-md font-semibold tracking-tight leading-snug",
        dark ? "text-ivory-surface" : "text-ink-charcoal",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. SUB-HEADING (H4)
   Size: 18px (1.125rem), Line-Height: 26px
   Used for table headers, minor card headers, and spec labels.
   ───────────────────────────────────────────────────────────── */
export interface SubSectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function SubSectionHeading({
  children,
  dark = false,
  className,
  ...props
}: SubSectionHeadingProps) {
  return (
    <h4
      className={cn(
        "font-headline-sm text-headline-sm font-semibold leading-snug",
        dark ? "text-ivory-surface" : "text-ink-charcoal",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. BODY LEAD PARAGRAPH
   Size: 18px (1.125rem), Line-Height: 28px (1.55)
   Hero introductions and section overview ledes.
   ───────────────────────────────────────────────────────────── */
export interface BodyLeadProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function BodyLead({
  children,
  dark = false,
  className,
  ...props
}: BodyLeadProps) {
  return (
    <p
      className={cn(
        "font-body-lg text-body-lg leading-relaxed",
        dark ? "text-ivory-surface/85" : "text-on-surface-variant",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. STANDARD BODY TEXT
   Size: 16px (1.0rem) baseline, Line-Height: 1.6 (26px)
   Crucial Googlebot requirement: eliminates "Text too small to read".
   ───────────────────────────────────────────────────────────── */
export interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function BodyText({
  children,
  dark = false,
  className,
  ...props
}: BodyTextProps) {
  return (
    <p
      className={cn(
        "font-body-md text-body-md leading-[1.6]",
        dark ? "text-ivory-surface/75" : "text-on-surface-variant",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. COMPACT / METADATA TEXT
   Size: 14px (0.875rem), Line-Height: 22px
   Never drops below 14px in accordance with Google guidelines.
   ───────────────────────────────────────────────────────────── */
export interface BodySmallProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "p" | "span" | "div";
  dark?: boolean;
  className?: string;
}

export function BodySmall({
  children,
  as: Component = "p",
  dark = false,
  className,
  ...props
}: BodySmallProps) {
  return (
    <Component
      className={cn(
        "font-body-sm text-body-sm leading-relaxed",
        dark ? "text-ivory-surface/70" : "text-on-surface-variant",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. EYEBROW / CATEGORY PILL
   Size: 12px (0.75rem), uppercase tracking-wider, font-bold
   ───────────────────────────────────────────────────────────── */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "primary" | "sandstone" | "gold" | "jade" | "dark" | "bare";
  icon?: string | React.ReactNode;
  className?: string;
}

export function Eyebrow({
  children,
  variant = "primary",
  icon,
  className,
  ...props
}: EyebrowProps) {
  const variantStyles = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    sandstone: "bg-sandstone-wash text-terracotta-deep border border-border-warm",
    gold: "bg-sandstone-wash text-gold-bronze border border-border-warm",
    jade: "bg-success-jade/10 text-success-jade border border-success-jade/20",
    dark: "bg-white/10 text-terracotta-sunlit border border-white/15",
    bare: "bg-transparent text-primary p-0 border-0",
  };

  const isBare = variant === "bare";

  return (
    <span
      className={cn(
        "font-label-caps text-label-caps uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
        !isBare && "px-3 py-1 rounded-full shadow-2xs",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {typeof icon === "string" ? (
        <span className="material-symbols-outlined text-icon-14 shrink-0">{icon}</span>
      ) : (
        icon
      )}
      <span>{children}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. PRICE DISPLAY
   EB Garamond 24px (1.5rem), line-height 28px, font-bold
   Indian currency format helper.
   ───────────────────────────────────────────────────────────── */
export interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string;
  currencyPrefix?: string;
  suffix?: string;
  dark?: boolean;
  className?: string;
}

export function PriceDisplay({
  amount,
  currencyPrefix = "₹",
  suffix,
  dark = false,
  className,
  ...props
}: PriceDisplayProps) {
  const formatted =
    typeof amount === "number"
      ? `${currencyPrefix}${amount.toLocaleString("en-IN")}`
      : `${currencyPrefix}${amount}`;

  return (
    <span
      className={cn(
        "font-price-display text-price-display font-bold whitespace-nowrap",
        dark ? "text-white" : "text-primary",
        className
      )}
      {...props}
    >
      {formatted}
      {suffix && (
        <span className="font-body-sm text-body-sm font-normal text-on-surface-variant ml-1">
          {suffix}
        </span>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   10. CTA BUTTON / TAP TARGET
   Guaranteed minimum 48px × 48px bounding box to prevent Google
   "Clickable elements too close together" mobile penalties.
   ───────────────────────────────────────────────────────────── */
export interface CtaButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "whatsapp" | "secondary" | "outline" | "gold";
  size?: "default" | "large" | "compact";
  icon?: string | React.ReactNode;
  iconPosition?: "left" | "right";
  href?: string;
  onClick?: () => void;
  className?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export function CtaButton({
  children,
  variant = "primary",
  size = "default",
  icon,
  iconPosition = "right",
  href,
  onClick,
  className,
  target,
  rel,
  disabled = false,
  type = "button",
  ariaLabel,
}: CtaButtonProps) {
  // Base classes enforce minimum 48px height across all variants
  const baseClasses =
    "cta-button min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl font-label-lg font-semibold transition-all duration-200 select-none cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  const sizeClasses = {
    default: "py-3 px-5 text-sm sm:text-base",
    large: "py-3.5 px-6 text-base sm:text-lg shadow-md hover:shadow-lg",
    compact: "py-2.5 px-4 text-xs sm:text-sm",
  };

  const variantClasses = {
    primary:
      "bg-primary hover:bg-primary-container text-white shadow-xs hover:shadow-sm",
    whatsapp:
      "bg-black hover:bg-neutral-900 border border-white/15 text-white shadow-xs hover:shadow-sm",
    secondary:
      "bg-sandstone-wash hover:bg-primary/10 text-primary border border-primary/25 shadow-xs",
    outline:
      "border border-border-warm bg-surface-container-lowest hover:bg-surface-container text-ink-charcoal shadow-xs",
    gold:
      "bg-gold-accent hover:bg-gold text-ink-midnight font-bold shadow-xs hover:shadow-sm",
  };

  const resolvedIcon =
    variant === "whatsapp" && !icon ? (
      <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
    ) : typeof icon === "string" ? (
      <span className="material-symbols-outlined text-icon-18 shrink-0">{icon}</span>
    ) : (
      icon
    );

  const content = (
    <>
      {iconPosition === "left" && resolvedIcon}
      <span>{children}</span>
      {iconPosition === "right" && resolvedIcon}
    </>
  );

  const combinedClass = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  if (href) {
    const isExternal = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
    const effectiveTarget = target || (href.startsWith("https://wa.me") ? "_blank" : undefined);
    const finalRel = rel || (effectiveTarget === "_blank" ? "noopener noreferrer" : undefined);

    return (
      <a
        href={href}
        className={combinedClass}
        target={effectiveTarget}
        rel={finalRel}
        aria-label={ariaLabel}
        style={variant === "whatsapp" ? { color: "#ffffff" } : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClass}
      aria-label={ariaLabel}
      style={variant === "whatsapp" ? { color: "#ffffff" } : undefined}
    >
      {content}
    </button>
  );
}

/**
 * Composite Typography Namespace for clean grouped access:
 * `import { Typography } from "@/components/ui/typography";`
 */
export const Typography = {
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
};

