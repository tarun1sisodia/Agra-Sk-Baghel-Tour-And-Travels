import type { ReactNode } from "react";
import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../../components/icons";

interface BookingAssistantProps {
  vehicleName: string;
  tripName: string;
  totalFare: number | null;
  advanceAmount: number | null;
  tourDate?: string;
}

export function BookingAssistant({ vehicleName, tripName, totalFare, advanceAmount, tourDate }: BookingAssistantProps) {
  const inr = (value: number | null | undefined) => `₹${(value ?? 0).toLocaleString("en-IN")}`;
  const message = `Hello Agra SK Baghel Tour & Travels, I would like help completing my booking: ${tripName} in the ${vehicleName}${tourDate ? ` on ${tourDate}` : ""}${totalFare ? ` (server quote ${inr(totalFare)})` : ""}.`;

  return (
    <aside aria-label="SK Concierge booking assistant" className="bg-surface-container-lowest rounded-xl border border-border-warm shadow-sm overflow-hidden flex flex-col">
      <div className="bg-ink-charcoal text-ivory-surface px-space-md py-space-sm flex items-center gap-space-sm">
        <span className="w-9 h-9 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-icon-20 text-gold-accent">support_agent</span>
        </span>
        <div className="min-w-0">
          <p className="font-title-md text-title-md text-ivory-surface font-semibold leading-tight">SK Concierge</p>
          <p className="font-label-caps text-label-caps uppercase tracking-wider text-surface-variant">Booking agent • online now</p>
        </div>
      </div>
      <div className="p-space-md flex flex-col gap-2.5">
        <AgentBubble>
          Review your <strong>{tripName}</strong> in the {vehicleName}
          {totalFare ? <> at the server-quoted total of <strong>{inr(totalFare)}</strong></> : null}.
        </AgentBubble>
        <AgentBubble>
          {advanceAmount && advanceAmount > 0
            ? <>The <strong>advance ({inr(advanceAmount)})</strong> is payable now; the remaining balance is payable after the trip.</>
            : "Complete the form and we’ll help lock your booking."}
        </AgentBubble>
      </div>
      <div className="px-space-md pb-space-md">
        <a
          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ffffff" }}
          className="w-full py-2.5 px-space-sm rounded-lg bg-success-jade text-white font-label-lg text-label-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
          <span className="text-white font-semibold" style={{ color: "#ffffff" }}>Let our agent help me book</span>
        </a>
        <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-center mt-1.5">24×7 Agra desk • replies in ~2 min</p>
      </div>
    </aside>
  );
}

function AgentBubble({ children }: { children: ReactNode }) {
  return <div className="bg-surface-container-low rounded-xl rounded-tl-sm px-3 py-2.5 border border-border-warm/60 font-body-md text-body-md text-on-surface-variant leading-relaxed">{children}</div>;
}

export default BookingAssistant;
