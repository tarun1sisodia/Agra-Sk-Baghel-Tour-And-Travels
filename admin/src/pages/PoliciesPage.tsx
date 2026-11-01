import { useEffect, useState, type ChangeEvent } from "react";
import { AlertTriangle, Building, Check, Dog, Landmark, Pencil, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  fetchAdminCancellationPolicies,
  fetchAdminCompanyProfile,
  fetchAdminMonuments,
  fetchAdminPetPolicy,
  updateAdminCancellationPolicy,
  updateAdminCompanyProfile,
  updateAdminMonument,
  updateAdminPetPolicy,
} from "@/lib/api";
import {
  can,
  type AdminUser,
  type CancellationPolicyItem,
  type CompanyProfileItem,
  type MonumentItem,
  type PetPolicyItem,
} from "@/lib/types";

type PolicyTab = "cancellation" | "pet" | "company" | "monuments";

export function PoliciesPage({ user }: { user: AdminUser }) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("cancellation");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Tab 1: Cancellation Slabs
  const [cancellationPolicies, setCancellationPolicies] = useState<CancellationPolicyItem[]>([]);
  const [editingCancellation, setEditingCancellation] = useState<CancellationPolicyItem | null>(null);

  // Tab 2: Pet Policy
  const [petPolicy, setPetPolicy] = useState<PetPolicyItem | null>(null);
  const [petForm, setPetForm] = useState<Partial<PetPolicyItem>>({});

  // Tab 3: Company Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileItem | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<CompanyProfileItem>>({});

  // Tab 4: Monuments
  const [monuments, setMonuments] = useState<MonumentItem[]>([]);
  const [editingMonument, setEditingMonument] = useState<MonumentItem | null>(null);

  const canEdit = can(user.role, "catalog:edit");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [canc, pet, comp, mon] = await Promise.all([
        fetchAdminCancellationPolicies(),
        fetchAdminPetPolicy(),
        fetchAdminCompanyProfile(),
        fetchAdminMonuments(),
      ]);
      setCancellationPolicies(canc);
      setPetPolicy(pet);
      setPetForm(pet);
      setCompanyProfile(comp);
      setCompanyForm(comp);
      setMonuments(mon);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to load policy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleSaveCancellation = async () => {
    if (!editingCancellation) return;
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await updateAdminCancellationPolicy(editingCancellation.id, {
        noticePeriodText: editingCancellation.noticePeriodText,
        feeRetainedPercent: Number(editingCancellation.feeRetainedPercent),
        refundPercent: Number(editingCancellation.refundPercent),
        ruleText: editingCancellation.ruleText,
        refundTimelineNote: editingCancellation.refundTimelineNote,
      });
      setCancellationPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingCancellation(null);
      setFeedback("Cancellation policy slab updated successfully.");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to update cancellation policy");
    } finally {
      setBusy(false);
    }
  };

  const handleSavePetPolicy = async () => {
    if (!petPolicy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await updateAdminPetPolicy({
        isOffered: Boolean(petForm.isOffered),
        seatProtectionNote: petForm.seatProtectionNote ?? "",
        breedRestrictionNote: petForm.breedRestrictionNote ?? "",
        comfortStopNote: petForm.comfortStopNote ?? "",
        bookingInstruction: petForm.bookingInstruction ?? "",
      });
      setPetPolicy(updated);
      setPetForm(updated);
      setFeedback("Pet taxi policy saved successfully.");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to save pet policy");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCompanyProfile = async () => {
    if (!companyProfile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await updateAdminCompanyProfile({
        brandName: companyForm.brandName ?? "",
        officeAddress: companyForm.officeAddress ?? "",
        primaryPhone: companyForm.primaryPhone ?? "",
        whatsappNumber: companyForm.whatsappNumber ?? "",
        email: companyForm.email ?? "",
        gstin: companyForm.gstin ?? "",
        operatingHours: companyForm.operatingHours ?? "",
        mapsLocation: companyForm.mapsLocation ?? "",
        dossierVersion: companyForm.dossierVersion ?? "v1.0",
        dossierStatus: companyForm.dossierStatus ?? "pending_review",
      });
      setCompanyProfile(updated);
      setCompanyForm(updated);
      setFeedback("Company NAP profile updated successfully.");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to update company profile");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMonument = async () => {
    if (!editingMonument) return;
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await updateAdminMonument(editingMonument.id, {
        name: editingMonument.name,
        visitingHours: editingMonument.visitingHours,
        closedNote: editingMonument.closedNote,
        historicalContext: editingMonument.historicalContext,
        sortOrder: Number(editingMonument.sortOrder),
      });
      setMonuments((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMonument(null);
      setFeedback("Monument information updated successfully.");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to update monument");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Policies & Content"
        title="Policies & Company Content"
        description="Manage cancellation slabs, pet taxi rules, monuments knowledge base, and official NAP profile."
      />

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase tracking-wider underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("cancellation")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "cancellation"
              ? "bg-gold text-surface-dark font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-surface-elevated"
            }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Cancellation Slabs ({cancellationPolicies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pet")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "pet"
              ? "bg-gold text-surface-dark font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-surface-elevated"
            }`}
        >
          <Dog className="h-4 w-4" />
          Pet Taxi Policy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "company"
              ? "bg-gold text-surface-dark font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-surface-elevated"
            }`}
        >
          <Building className="h-4 w-4" />
          Company NAP Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("monuments")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "monuments"
              ? "bg-gold text-surface-dark font-semibold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-surface-elevated"
            }`}
        >
          <Landmark className="h-4 w-4" />
          Monuments Knowledge Base ({monuments.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">Loading policy data...</div>
      ) : (
        <>
          {/* TAB 1: CANCELLATION POLICIES */}
          {activeTab === "cancellation" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white">Cancellation & Refund Slabs</h2>
                <p className="text-xs text-slate-400">
                  Defined per Dossier §6 & §8. These slabs govern booking cancellations and customer refunds.
                </p>
              </div>

              {/* Cab policies */}
              <Card className="overflow-hidden">
                <div className="border-b border-hairline bg-surface-elevated px-4 py-3">
                  <span className="text-sm font-semibold text-white">Cab / Outstation Transfers Slabs</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="border-b border-hairline bg-surface-dark text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Notice Window</th>
                        <th className="px-4 py-3">Fee Retained</th>
                        <th className="px-4 py-3">Refund Amount</th>
                        <th className="px-4 py-3">Rule Description</th>
                        <th className="px-4 py-3">Refund Timeline</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {cancellationPolicies
                        .filter((p) => p.policyType === "cab")
                        .map((policy) => (
                          <tr key={policy.id} className="hover:bg-surface-elevated/40">
                            <td className="px-4 py-3 font-medium text-white">{policy.noticePeriodText}</td>
                            <td className="px-4 py-3">
                              <Badge tone={policy.feeRetainedPercent === 0 ? "success" : policy.feeRetainedPercent === 100 ? "error" : "gold"}>
                                {policy.feeRetainedPercent}% Fee
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-gold">{policy.refundPercent}% Refund</td>
                            <td className="px-4 py-3 text-xs text-slate-300 max-w-xs">{policy.ruleText}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{policy.refundTimelineNote}</td>
                            <td className="px-4 py-3 text-right">
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCancellation({ ...policy })}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Tour package policies */}
              <Card className="overflow-hidden">
                <div className="border-b border-hairline bg-surface-elevated px-4 py-3">
                  <span className="text-sm font-semibold text-white">Tour Packages Cancellation Slabs</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="border-b border-hairline bg-surface-dark text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Notice Window</th>
                        <th className="px-4 py-3">Fee Retained</th>
                        <th className="px-4 py-3">Refund Amount</th>
                        <th className="px-4 py-3">Rule Description</th>
                        <th className="px-4 py-3">Refund Timeline</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {cancellationPolicies
                        .filter((p) => p.policyType === "tour_package")
                        .map((policy) => (
                          <tr key={policy.id} className="hover:bg-surface-elevated/40">
                            <td className="px-4 py-3 font-medium text-white">{policy.noticePeriodText}</td>
                            <td className="px-4 py-3">
                              <Badge tone={policy.feeRetainedPercent === 0 ? "success" : policy.feeRetainedPercent === 100 ? "error" : "gold"}>
                                {policy.feeRetainedPercent}% Fee
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-gold">{policy.refundPercent}% Refund</td>
                            <td className="px-4 py-3 text-xs text-slate-300 max-w-xs">{policy.ruleText}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{policy.refundTimelineNote}</td>
                            <td className="px-4 py-3 text-right">
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCancellation({ ...policy })}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: PET TAXI POLICY */}
          {activeTab === "pet" && (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">Pet Taxi Policy (Dossier §9)</h2>
                    {!Boolean(petForm.isOffered) && (
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                        Discontinued / Not Offered
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Official rules and guidelines for passengers traveling with pets in Agra SK Baghel cabs.
                  </p>
                </div>
                {canEdit && (
                  <Button variant="gold" onClick={() => void handleSavePetPolicy()} disabled={busy}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Save Pet Policy
                  </Button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-elevated p-4">
                    <input
                      type="checkbox"
                      id="petIsOffered"
                      checked={Boolean(petForm.isOffered)}
                      onChange={(e) => setPetForm((p) => ({ ...p, isOffered: e.target.checked }))}
                      disabled={!canEdit}
                      className="h-4 w-4 rounded border-hairline bg-surface-dark text-gold focus:ring-gold"
                    />
                    <label htmlFor="petIsOffered" className="text-sm font-medium text-white cursor-pointer">
                      Pet Taxi Service is currently offered to customers
                    </label>
                  </div>

                  <div>
                    <Label>Seat Protection Guidance Note</Label>
                    <Textarea
                      rows={3}
                      value={petForm.seatProtectionNote ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPetForm((p) => ({ ...p, seatProtectionNote: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="e.g. Passenger must bring waterproof sheet or mat..."
                    />
                  </div>

                  <div>
                    <Label>Breed & Size Restrictions</Label>
                    <Textarea
                      rows={3}
                      value={petForm.breedRestrictionNote ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPetForm((p) => ({ ...p, breedRestrictionNote: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="e.g. Small to medium pets allowed; muzzle required for dogs..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Comfort Stop Rules (Long Trips)</Label>
                    <Textarea
                      rows={3}
                      value={petForm.comfortStopNote ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPetForm((p) => ({ ...p, comfortStopNote: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="e.g. 10-minute comfort break every 2 hours on highway runs..."
                    />
                  </div>

                  <div>
                    <Label>Customer Booking Instructions</Label>
                    <Textarea
                      rows={4}
                      value={petForm.bookingInstruction ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPetForm((p) => ({ ...p, bookingInstruction: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="e.g. Mention pet travel in special requirements during booking checkout..."
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: COMPANY NAP PROFILE */}
          {activeTab === "company" && (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Company Identity & NAP Profile (Dossier §11)</h2>
                  <p className="text-xs text-slate-400">
                    Official business details for SEO, structured data, and customer touchpoints. Fields with [TBD] indicate pending client confirmation.
                  </p>
                </div>
                {canEdit && (
                  <Button variant="gold" onClick={() => void handleSaveCompanyProfile()} disabled={busy}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Save Company Profile
                  </Button>
                )}
              </div>

              {(companyForm.primaryPhone?.includes("[TBD") || companyForm.gstin?.includes("[TBD")) && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Pending Client Confirmation: </span>
                    Some contact and tax details contain <code className="text-amber-300 font-mono text-xs">[TBD]</code> markers. Once confirmed by the client, update them here to propagate into website footers and schema.
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Public Brand Name</Label>
                  <Input
                    value={companyForm.brandName ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, brandName: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Registered Office Address</Label>
                  <Input
                    value={companyForm.officeAddress ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, officeAddress: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Primary Phone Number</Label>
                  <Input
                    value={companyForm.primaryPhone ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, primaryPhone: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>WhatsApp Support Number</Label>
                  <Input
                    value={companyForm.whatsappNumber ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, whatsappNumber: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Primary Support Email</Label>
                  <Input
                    value={companyForm.email ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>GSTIN Tax Identification</Label>
                  <Input
                    value={companyForm.gstin ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, gstin: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Operating Hours</Label>
                  <Input
                    value={companyForm.operatingHours ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, operatingHours: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Google Maps Location / Place Link</Label>
                  <Input
                    value={companyForm.mapsLocation ?? ""}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, mapsLocation: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Dossier Review Status</Label>
                  <Select
                    value={companyForm.dossierStatus ?? "pending_review"}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, dossierStatus: e.target.value as CompanyProfileItem["dossierStatus"] }))}
                    disabled={!canEdit}
                  >
                    <option value="pending_review">Pending Review (Client Working)</option>
                    <option value="modifications_needed">Modifications Needed</option>
                    <option value="signed_off">Signed Off (Approved)</option>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: MONUMENTS KNOWLEDGE BASE */}
          {activeTab === "monuments" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Monuments Knowledge Base (Dossier §10.2)</h2>
                <p className="text-xs text-slate-400">
                  Curated Agra monuments details used by customer tour pages, itineraries, and SEO rich snippets.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {monuments.map((mon) => (
                  <Card key={mon.id} className="p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white text-base">{mon.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">Order #{mon.sortOrder}</span>
                        </div>
                        {mon.closedNote && (
                          <Badge tone="error" className="shrink-0 text-xs">
                            {mon.closedNote}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {mon.historicalContext}
                      </p>

                      <div className="pt-2 border-t border-hairline text-xs">
                        <span className="text-slate-400 block">Visiting Hours:</span>
                        <span className="font-medium text-slate-200">{mon.visitingHours}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-hairline flex justify-end">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMonument({ ...mon })}
                          className="h-7 text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit Monument
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Cancellation Modal */}
      {editingCancellation && (
        <Dialog
          open={Boolean(editingCancellation)}
          onClose={() => setEditingCancellation(null)}
          title={`Edit Cancellation Slab (${editingCancellation.policyType.toUpperCase()})`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <Label>Notice Period Window Description</Label>
              <Input
                value={editingCancellation.noticePeriodText}
                onChange={(e) => setEditingCancellation((p) => (p ? { ...p, noticePeriodText: e.target.value } : null))}
                placeholder="e.g. > 24 hours before pickup"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fee Retained (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editingCancellation.feeRetainedPercent}
                  onChange={(e) =>
                    setEditingCancellation((p) =>
                      p
                        ? {
                          ...p,
                          feeRetainedPercent: Number(e.target.value),
                          refundPercent: 100 - Number(e.target.value),
                        }
                        : null
                    )
                  }
                />
              </div>

              <div>
                <Label>Refund to Customer (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editingCancellation.refundPercent}
                  onChange={(e) =>
                    setEditingCancellation((p) =>
                      p
                        ? {
                          ...p,
                          refundPercent: Number(e.target.value),
                          feeRetainedPercent: 100 - Number(e.target.value),
                        }
                        : null
                    )
                  }
                />
              </div>
            </div>

            <div>
              <Label>Policy Rule Text</Label>
              <Textarea
                rows={3}
                value={editingCancellation.ruleText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingCancellation((p) => (p ? { ...p, ruleText: e.target.value } : null))}
              />
            </div>

            <div>
              <Label>Refund Timeline Note</Label>
              <Input
                value={editingCancellation.refundTimelineNote}
                onChange={(e) => setEditingCancellation((p) => (p ? { ...p, refundTimelineNote: e.target.value } : null))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
              <Button variant="outline" onClick={() => setEditingCancellation(null)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handleSaveCancellation()} disabled={busy}>
                <Check className="mr-1 h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Monument Modal */}
      {editingMonument && (
        <Dialog
          open={Boolean(editingMonument)}
          onClose={() => setEditingMonument(null)}
          title={`Edit Monument: ${editingMonument.name}`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <Label>Monument Name</Label>
              <Input
                value={editingMonument.name}
                onChange={(e) => setEditingMonument((p) => (p ? { ...p, name: e.target.value } : null))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Visiting Hours</Label>
                <Input
                  value={editingMonument.visitingHours}
                  onChange={(e) => setEditingMonument((p) => (p ? { ...p, visitingHours: e.target.value } : null))}
                  placeholder="e.g. Sunrise to Sunset"
                />
              </div>

              <div>
                <Label>Closed Note</Label>
                <Input
                  value={editingMonument.closedNote}
                  onChange={(e) => setEditingMonument((p) => (p ? { ...p, closedNote: e.target.value } : null))}
                  placeholder="e.g. Closed on Fridays"
                />
              </div>
            </div>

            <div>
              <Label>Historical Context & Tour Narrative</Label>
              <Textarea
                rows={4}
                value={editingMonument.historicalContext ?? ""}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingMonument((p) => (p ? { ...p, historicalContext: e.target.value } : null))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
              <Button variant="outline" onClick={() => setEditingMonument(null)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handleSaveMonument()} disabled={busy}>
                <Check className="mr-1 h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
