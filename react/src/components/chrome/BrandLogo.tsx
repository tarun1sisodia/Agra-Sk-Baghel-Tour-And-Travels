export interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({
  href = "/",
  className = "",
  onClick,
}: BrandLogoProps) {
  return (
    <a
      href={href}
      className={`flex shrink-0 items-center select-none group ${className}`.trim()}
      aria-label="Agra SK Baghel Tour and Travels"
      onClick={onClick}
    >
      <img
        src="/assets/brand/agra-sk-baghel-logo.svg"
        alt="Agra SK Baghel Tour & Travels"
        width={845}
        height={230}
        decoding="async"
        className="block h-10 w-auto max-w-[min(58vw,250px)] object-contain sm:h-11"
      />
    </a>
  );
}

export default BrandLogo;
