import { cn } from "@/lib/utils";

/**
 * Shared Agra SK Baghel brand mark for the admin shell.
 * The logo artwork is maintained in the root logo assets and served locally by the admin app.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/assets/brand/agra-sk-baghel-mark.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
