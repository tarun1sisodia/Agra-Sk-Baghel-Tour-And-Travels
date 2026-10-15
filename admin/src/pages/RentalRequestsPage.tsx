import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageCircle, Phone, Send, Car, Calendar, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { fetchAdminRentalEnquiries, updateAdminRentalEnquiry } from "@/lib/api";
import type { AdminUser, RentalEnquiry, RentalStatus } from "@/lib/types";

const FLOW: RentalStatus[] = ["new", "contacted", "quoted", "done", "closed"];

const GROUP_LABELS: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxury",
  tempo_traveller: "Tempo Traveller",
};

const LEGACY_CAR_LABELS: Record<string, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  "innova-crysta": "Innova Crysta",
  innova: "Innova Crysta",
  "tempo-traveller": "Tempo Traveller",
  tempo: "Tempo Traveller",
  urbania: "Urbania",
};

export function getVehicleSummary(item: RentalEnquiry): { group: string; model: string } {
  if (item.vehicleModelName) {
    const group = item.vehicleGroupName || (item.vehicleGroupCode ? GROUP_LABELS[item.vehicleGroupCode] : "Vehicle");
    return { group, model: item.vehicleModelName };
  }
  if (item.vehicleGroupCode) {
    const group = GROUP_LABELS[item.vehicleGroupCode] || item.vehicleGroupCode;
    return { group, model: "Any suitable model in group" };
  }
  if (item.carTier) {
    const label = LEGACY_CAR_LABELS[item.carTier] || item.carTier;
    return { group: label, model: "Legacy fleet request" };
  }
  return { group: "Standard Vehicle", model: "Any suitable model" };
}

export function RentalRequestsPage({ }: { user: AdminUser }) {
  const [items, setItems] = useState<RentalEnquiry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("new");
  const [car, setCar] = useState("all");
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const selected = items.find((i) => i.id === selectedId);

  const load = () =>
    fetchAdminRentalEnquiries({ status: status as RentalStatus | "all", car: car as any, q })
      .then((data) => {
        setItems(data);
        setSelectedId((id) => (data.some((i) => i.id === id) ? id : (data[0]?.id ?? "")));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load rental requests."));

  useEffect(() => {
    void load();
  }, [status, car, q]);

  const currentIndex = useMemo(() => (selected ? FLOW.indexOf(selected.status) : -1), [selected]);

  async function change(next: RentalStatus) {
    if (!selected) return;
    await updateAdminRentalEnquiry(selected.id, { status: next });
    await load();
  }

  async function addNote() {
    if (!selected || !note.trim()) return;
    await updateAdminRentalEnquiry(selected.id, { note: note.trim() });
    setNote("");
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Leads"
        title="Rental Requests"
        description="Call-first taxi rental enquiries from the customer site with canonical group & vehicle selection."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="new">New first</option>
          <option value="all">All statuses</option>
          <option value="contacted">Contacted</option>
          <option value="quoted">Quoted</option>
          <option value="done">Done</option>
          <option value="closed">Closed</option>
          <option value="spam">Spam</option>
        </Select>

        <Select value={car} onChange={(e) => setCar(e.target.value)} className="w-auto">
          <option value="all">All vehicle groups & models</option>
          <optgroup label="Canonical Vehicle Groups">
            <option value="sedan">Sedan Group</option>
            <option value="suv">SUV Group</option>
            <option value="luxury">Luxury Group</option>
            <option value="tempo_traveller">Tempo Traveller Group</option>
          </optgroup>
          <optgroup label="Legacy Tiers">
            {Object.entries(LEGACY_CAR_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </optgroup>
        </Select>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or ref (RNT-...)"
          className="max-w-xs"
        />
      </div>

      {error && <p className="mb-3 text-error">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="p-3">Received</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Vehicle Preference / Dates</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const vehicle = getVehicleSummary(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer border-b border-hairline last:border-0 hover:bg-surface-2 ${
                      item.id === selectedId ? "bg-gold-wash" : ""
                    }`}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-ink-faint">{item.ref}</span>
                      <br />
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <strong>{item.name}</strong>
                      <br />
                      <span className="text-ink-soft">{item.pickupLocation}</span>
                      {item.destinationOrItinerary && (
                        <span className="block text-xs text-ink-faint">
                          → {item.destinationOrItinerary}
                        </span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <a
                        href={`tel:${item.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2 inline-flex text-gold-text"
                        title="Call Customer"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      {item.phone}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-ink">{vehicle.group}</span>
                      <br />
                      <span className="text-xs text-ink-soft">{vehicle.model}</span>
                      <br />
                      <span className="text-xs font-mono text-ink-faint">
                        {item.pickupDate} → {item.returnDate}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={item.status as any} />
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-faint">
                    No rental requests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {selected ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                  {selected.ref}
                </p>
                <h2 className="mt-1 font-display text-xl text-ink">{selected.name}</h2>
                {(() => {
                  const veh = getVehicleSummary(selected);
                  return (
                    <p className="mt-1 text-sm font-medium text-ink-soft">
                      {veh.group}: {veh.model}
                    </p>
                  );
                })()}
              </div>
              <StatusBadge status={selected.status as any} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                className="button button-primary inline-flex items-center gap-2"
                href={`tel:${selected.phone}`}
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
              <a
                className="button button-whatsapp inline-flex items-center gap-2"
                href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm border-t border-hairline pt-4">
              <div>
                <dt className="text-ink-faint flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Travel Dates
                </dt>
                <dd className="font-medium text-ink">
                  {selected.pickupDate} to {selected.returnDate}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" /> Driver Preference
                </dt>
                <dd className="font-medium text-ink">
                  {selected.withDriver ? "Yes (Dedicated Chauffeur)" : "Self / No Driver Requested"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Pickup Point
                </dt>
                <dd className="text-ink">{selected.pickupLocation}</dd>
              </div>
              <div>
                <dt className="text-ink-faint flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Passengers
                </dt>
                <dd className="text-ink">
                  {selected.passengers ? `${selected.passengers} passenger(s)` : "Not specified"}
                </dd>
              </div>
              {selected.destinationOrItinerary && (
                <div className="col-span-2">
                  <dt className="text-ink-faint">Destination / Itinerary</dt>
                  <dd className="text-ink font-medium">{selected.destinationOrItinerary}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-faint">Email</dt>
                <dd className="text-ink">{selected.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Submitted</dt>
                <dd className="text-ink font-mono text-xs">
                  {new Date(selected.createdAt).toLocaleString("en-IN")}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ink-faint">Customer Note</dt>
                <dd className="text-ink bg-surface-2 p-2 rounded text-xs mt-1">
                  {selected.note || "No additional requirements noted."}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-4">
              {FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="h-3 w-3 text-ink-faint" />}
                  <Badge tone={i === currentIndex ? "gold" : i < currentIndex ? "success" : "neutral"}>
                    {step}
                  </Badge>
                </span>
              ))}
            </div>

            {currentIndex >= 0 && currentIndex < FLOW.length - 1 && (
              <Button
                className="mt-4"
                variant="gold"
                size="sm"
                onClick={() => void change(FLOW[currentIndex + 1])}
              >
                Move to {FLOW[currentIndex + 1]} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            <div className="mt-5 flex gap-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log internal note or quote details..."
              />
              <Button size="sm" variant="secondary" onClick={() => void addNote()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>

            {selected.notes.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selected.notes.map((n, i) => (
                  <li key={i} className="rounded-sm bg-surface-2 p-2 text-sm text-ink-soft">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : (
          <Card className="p-8 text-center text-ink-faint">Select a request to view details.</Card>
        )}
      </div>
    </div>
  );
}
export default RentalRequestsPage;
