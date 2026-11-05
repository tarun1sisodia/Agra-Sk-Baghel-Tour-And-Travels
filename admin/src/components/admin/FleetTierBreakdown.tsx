import type { LucideIcon } from "lucide-react";
import { Bus, BusFront, Car, CarFront, CircleHelp, Van } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { VehicleTier } from "@/lib/types";
import { FLEET_BUCKETS } from "@/lib/vehicleTierCounts";

/**
 * "Trips by vehicle tier" breakdown for the Operations Overview (issue #129).
 *
 * A dedicated horizontal-row layout (rather than VerticalBars) so each fleet
 * type carries an accessible icon alongside a readable label + count on mobile.
 * Icons are decorative (aria-hidden); the text label and count convey meaning.
 * An "Other" row appears only when there are records outside the five displayed
 * fleets (luxury, bare SUV group, unclassified or missing vehicle data) so no
 * booking is silently lost or counted as Sedan.
 */
const FLEET_ICONS: Record<string, LucideIcon> = {
  sedan: Car,
  ertiga: CarFront,
  "innova-crysta": Van,
  "tempo-traveller": Bus,
  urbania: BusFront,
  other: CircleHelp,
};

const easeExpo = [0.16, 1, 0.3, 1] as const;

interface FleetTierBreakdownProps {
  counts: Record<VehicleTier, number>;
}

export function FleetTierBreakdown({ counts }: FleetTierBreakdownProps) {
  const reduce = useReducedMotion();

  const otherCount = (counts.other ?? 0) + (counts.unknown ?? 0);
  const rows: { key: string; label: string; value: number; hint?: string }[] = [
    ...FLEET_BUCKETS.map((b) => ({ key: b.key as string, label: b.label, value: counts[b.key] ?? 0 })),
    ...(otherCount > 0
      ? [
          {
            key: "other",
            label: "Other",
            value: otherCount,
            hint: "Luxury, unclassified or missing vehicle data",
          },
        ]
      : []),
  ];

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="flex flex-col gap-3" aria-label="Trips by vehicle tier">
      {rows.map((row, i) => {
        const Icon = FLEET_ICONS[row.key] ?? CircleHelp;
        const pct = (row.value / max) * 100;
        return (
          <motion.li
            key={row.key}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeExpo, delay: 0.15 + i * 0.07 }}
            title={row.hint}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text"
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 truncate text-[13px] font-medium text-ink">{row.label}</span>
              <span className="font-mono text-sm tabular-nums text-ink">{row.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
              <motion.div
                className="h-full rounded-pill"
                style={{ background: "linear-gradient(90deg, var(--gold) 0%, var(--gold-deep) 100%)" }}
                initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: easeExpo, delay: 0.25 + i * 0.07 }}
              />
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
