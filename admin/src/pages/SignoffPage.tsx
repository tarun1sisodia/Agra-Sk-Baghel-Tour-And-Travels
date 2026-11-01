import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import {
  fetchAdminCompanyProfile,
  fetchAdminDossierSignoffs,
  updateAdminCompanyProfile,
  updateAdminDossierSignoff,
} from "@/lib/api";
import { can, type AdminUser, type CompanyProfileItem, type DossierSignoffItem } from "@/lib/types";

export function SignoffPage({ user }: { user: AdminUser }) {
  const [signoffs, setSignoffs] = useState<DossierSignoffItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canEdit = can(user.role, "catalog:edit");

  const loadData = async () => {
    setLoading(true);
    try {
      const [signoffsData, profileData] = await Promise.all([
        fetchAdminDossierSignoffs(),
        fetchAdminCompanyProfile(),
      ]);
      setSignoffs(signoffsData);
      setCompanyProfile(profileData);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to load sign-off records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const approvedCount = signoffs.filter((s) => s.status === "approved").length;
  const totalCount = signoffs.length || 10;
  const progressPercentage = Math.round((approvedCount / totalCount) * 100);
  const allApproved = approvedCount === totalCount && totalCount > 0;

  const handleUpdateSignoff = async (
    id: string,
    patch: {
      status?: DossierSignoffItem["status"];
      clientNotes?: string;
      approvedBy?: string;
    }
  ) => {
    setBusyRow(id);
    setFeedback(null);
    try {
      const current = signoffs.find((s) => s.id === id);
      const isApproving = patch.status === "approved" || (patch.status === undefined && current?.status === "approved");
      const approvedAt = isApproving ? new Date().toISOString() : null;
      const approvedBy = patch.approvedBy !== undefined ? patch.approvedBy : (isApproving ? user.name : null);

      const updated = await updateAdminDossierSignoff(id, {
        ...patch,
        approvedAt,
        approvedBy,
      });

      const nextSignoffs = signoffs.map((s) => (s.id === id ? updated : s));
      setSignoffs(nextSignoffs);

      // Auto-trigger company profile status if all 10 approved
      const nextApprovedCount = nextSignoffs.filter((s) => s.status === "approved").length;
      if (nextApprovedCount === totalCount && companyProfile && companyProfile.dossierStatus !== "signed_off") {
        const updatedProfile = await updateAdminCompanyProfile({
          dossierStatus: "signed_off",
        });
        setCompanyProfile(updatedProfile);
        setFeedback("All 10 sections approved! Dossier marked as officially SIGNED OFF.");
      } else {
        setFeedback(`Section ${updated.sectionKey} updated.`);
      }
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to update sign-off record");
    } finally {
      setBusyRow(null);
    }
  };

  const handleFinalizeDossier = async () => {
    if (!companyProfile) return;
    setFinalizing(true);
    setFeedback(null);
    try {
      const updatedProfile = await updateAdminCompanyProfile({
        dossierStatus: "signed_off",
      });
      setCompanyProfile(updatedProfile);
      setFeedback("Dossier has been officially signed off and finalized.");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Failed to finalize dossier status");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verification & Compliance"
        title="Client Dossier Sign-Off (Dossier §12)"
        description="Verification checklist with Agra SK Baghel stakeholders for operational, commercial, and policy rules confirmation."
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

      {/* Progress & Milestone Overview */}
      <Card className="p-6 border-gold/20 bg-surface-elevated/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Client Approval Progress</h2>
              <Badge tone={allApproved ? "success" : "gold"}>
                {approvedCount} / {totalCount} Sections Approved
              </Badge>
              {companyProfile?.dossierStatus === "signed_off" && (
                <Badge tone="success" className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Dossier Signed Off
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Per commercial requirements, all 10 dossier sections must be approved before moving out of staging review.
            </p>
          </div>

          {allApproved && companyProfile?.dossierStatus !== "signed_off" && canEdit && (
            <Button variant="gold" onClick={() => void handleFinalizeDossier()} disabled={finalizing}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Finalize Official Sign-Off
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Overall Completion</span>
            <span className="font-mono font-medium text-gold">{progressPercentage}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-dark border border-hairline">
            <div
              className={`h-full transition-all duration-500 ${allApproved ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-gold"
                }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 10 Checklist Rows */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">Loading sign-off checklist...</div>
      ) : (
        <div className="space-y-4">
          {signoffs.map((item) => (
            <SignoffRow
              key={item.id}
              item={item}
              canEdit={canEdit}
              isBusy={busyRow === item.id}
              onUpdate={(patch) => handleUpdateSignoff(item.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SignoffRow({
  item,
  canEdit,
  isBusy,
  onUpdate,
}: {
  item: DossierSignoffItem;
  canEdit: boolean;
  isBusy: boolean;
  onUpdate: (patch: {
    status?: DossierSignoffItem["status"];
    clientNotes?: string;
    approvedBy?: string;
  }) => void;
}) {
  const [localStatus, setLocalStatus] = useState<DossierSignoffItem["status"]>(item.status);
  const [localNotes, setLocalNotes] = useState(item.clientNotes ?? "");
  const [localApprover, setLocalApprover] = useState(item.approvedBy ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalStatus(item.status);
    setLocalNotes(item.clientNotes ?? "");
    setLocalApprover(item.approvedBy ?? "");
    setHasChanges(false);
  }, [item]);

  const handleStatusChange = (newStatus: DossierSignoffItem["status"]) => {
    setLocalStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (text: string) => {
    setLocalNotes(text);
    setHasChanges(true);
  };

  const handleApproverChange = (text: string) => {
    setLocalApprover(text);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({
      status: localStatus,
      clientNotes: localNotes,
      approvedBy: localApprover || undefined,
    });
    setHasChanges(false);
  };

  return (
    <Card className={`p-4 transition-colors ${item.status === "approved" ? "border-emerald-500/30" : item.status === "modification_requested" ? "border-rose-500/30" : ""}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Section Details */}
        <div className="space-y-1 lg:max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-gold">{item.sectionKey}</span>
            <h3 className="font-semibold text-white text-base">{item.sectionTitle}</h3>
          </div>
          {item.approvedAt && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved by {item.approvedBy || "Client"} on {new Date(item.approvedAt).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>

        {/* Center: Status & Approver Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              value={localStatus}
              onChange={(e) => handleStatusChange(e.target.value as DossierSignoffItem["status"])}
              disabled={!canEdit || isBusy}
              className={
                localStatus === "approved"
                  ? "border-emerald-500 text-emerald-400 font-medium"
                  : localStatus === "modification_requested"
                    ? "border-rose-500 text-rose-400 font-medium"
                    : "text-amber-400"
              }
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="modification_requested">Modification Requested</option>
            </Select>
          </div>

          <div className="w-44">
            <Input
              value={localApprover}
              onChange={(e) => handleApproverChange(e.target.value)}
              placeholder="Approver Name"
              disabled={!canEdit || isBusy}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Client Notes / Feedback textarea */}
      <div className="mt-3 pt-3 border-t border-hairline flex flex-col md:flex-row gap-3 items-start justify-between">
        <div className="flex-1 w-full">
          <Input
            value={localNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Client notes / requested adjustments / meeting minutes..."
            disabled={!canEdit || isBusy}
            className="text-xs"
          />
        </div>

        {hasChanges && canEdit && (
          <Button
            variant="gold"
            size="sm"
            onClick={handleSave}
            disabled={isBusy}
            className="shrink-0 h-9 text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Save Status
          </Button>
        )}
      </div>
    </Card>
  );
}
