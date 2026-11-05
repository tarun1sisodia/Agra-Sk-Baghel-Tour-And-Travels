import { cn } from "@/lib/utils";

/**
 * Shared Agra SK Baghel brand mark for the admin shell.
 * Rendered inline for instant load, crisp vector fidelity, and theme adaptability (light & dark).
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Agra SK Baghel Tour &amp; Travels brand mark"
      className={cn("shrink-0 object-contain", className)}
    >
      <title>Agra SK Baghel Tour &amp; Travels</title>
      <g id="brand-mark" transform="translate(-62 38) scale(1.15)">
        {/* SK Silhouette adapting between dark teal in light mode and bright ivory in dark mode */}
        <path
          id="sk-silhouette"
          className="fill-[#0B3440] dark:fill-[#F7F3EA]"
          d="M 112 34 H 279 L 249 70 H 176 C 153 70 141 84 141 103 C 141 123 160 132 191 140 C 231 150 252 166 252 190 C 252 215 229 236 192 248 H 65 L 100 209 H 181 C 202 209 216 201 216 190 C 216 180 201 173 174 166 C 129 155 98 138 98 106 C 98 77 112 48 134 34 Z"
        />
        {/* Journey ribbon in signature copper/gold */}
        <path
          id="journey-ribbon"
          fill="#C77C4D"
          d="M 126 136 C 157 142 193 151 212 165 C 232 180 225 197 207 216 L 181 248 H 140 L 187 202 C 202 188 204 181 193 175 C 176 165 149 158 121 151 Z"
        />
        {/* Lower stroke of K */}
        <path
          id="k-lower-stroke"
          className="fill-[#0B3440] dark:fill-[#F7F3EA]"
          d="M 263 111 H 301 L 390 248 H 344 L 258 131 Z"
        />
        {/* Upper stroke of K in copper */}
        <path
          id="k-upper-stroke"
          fill="#C77C4D"
          d="M 272 34 H 319 L 284 76 H 237 Z"
        />
      </g>
    </svg>
  );
}
