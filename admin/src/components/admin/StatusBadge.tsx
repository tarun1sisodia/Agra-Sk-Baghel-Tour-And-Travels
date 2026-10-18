import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  PenSquare,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BookingStatus, CatalogStatus, InquiryStatus, PaymentStatus, ReviewStatus } from "@/lib/types";

const map: Record<string, { label: string; tone: "neutral" | "gold" | "success" | "error" | "teal" | "ink"; icon: LucideIcon }> = {
  // Booking status
  draft: { label: "Draft", tone: "neutral", icon: PenSquare },
  pending_payment: { label: "Pending payment", tone: "gold", icon: Clock },
  paid_confirmed: { label: "Paid", tone: "teal", icon: CreditCard },
  confirmed: { label: "Paid", tone: "teal", icon: CreditCard },
  driver_assigned: { label: "Driver Assigned", tone: "gold", icon: CalendarClock },
  in_transit: { label: "In transit", tone: "ink", icon: CalendarClock },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "error", icon: XCircle },
  refunded: { label: "Refunded", tone: "gold", icon: CreditCard },
  // Payment status
  captured: { label: "Captured", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "error", icon: XCircle },
  // Catalog
  published: { label: "Published", tone: "success", icon: CheckCircle2 },
  archived: { label: "Archived", tone: "neutral", icon: Clock },
  // Reviews
  pending: { label: "Pending", tone: "gold", icon: Clock },
  pending_review: { label: "Pending", tone: "gold", icon: Clock },
  approved: { label: "Approved", tone: "teal", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "error", icon: XCircle },
  // Inquiries
  new: { label: "New", tone: "gold", icon: Clock },
  contacted: { label: "Contacted", tone: "teal", icon: CalendarClock },
  quoted: { label: "Quoted", tone: "ink", icon: CalendarClock },
  converted: { label: "Converted", tone: "success", icon: CheckCircle2 },
  closed: { label: "Closed", tone: "neutral", icon: XCircle },
};

export type AnyStatus =
  | BookingStatus
  | PaymentStatus
  | CatalogStatus
  | ReviewStatus
  | InquiryStatus;

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const m = map[status] ?? { label: status, tone: "neutral" as const, icon: Clock };
  const Icon = m.icon;
  return (
    <Badge tone={m.tone} className={className}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {m.label}
    </Badge>
  );
}
