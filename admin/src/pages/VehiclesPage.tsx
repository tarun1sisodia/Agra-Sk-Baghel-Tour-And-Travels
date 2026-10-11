import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Car,
  Edit3,
  Layers,
  Plus,
  RotateCw,
  ShieldCheck,
  Users,
  Moon,
  Home,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, NumberInput } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import {
  fetchVehicleGroups,
  fetchVehicleModels,
  patchVehicleGroup,
  createVehicleModel,
  patchVehicleModel,
  type CleanVehicleGroup,
  type CleanVehicleModel,
} from "@/services/cleanAdminApi";
import type { VehicleGroupCode } from "@/contracts/fare-system";
import type { AdminUser } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

export function VehiclesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEdit = user.role === "super_admin";

  const [groups, setGroups] = useState<CleanVehicleGroup[]>([]);
  const [models, setModels] = useState<CleanVehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit Group Modal
  const [selectedGroup, setSelectedGroup] = useState<CleanVehicleGroup | null>(null);
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    driver_allowance_per_day: 0,
    one_way_night_charge: 0,
    round_trip_halt_per_night: 0,
    is_active: true,
  });

  // Edit/Add Model Modal
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CleanVehicleModel | null>(null);
  const [modelSaving, setModelSaving] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState({
    vehicle_group_code: "sedan" as VehicleGroupCode,
    make: "",
    model_name: "",
    display_name: "",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "",
    sort_order: 1,
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [groupsData, modelsData] = await Promise.all([
        fetchVehicleGroups(),
        fetchVehicleModels(),
      ]);
      setGroups(groupsData);
      setModels(modelsData);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load vehicle groups and models.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  // Open Group Edit
  const handleEditGroup = (group: CleanVehicleGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      driver_allowance_per_day: group.driver_allowance_per_day,
      one_way_night_charge: group.one_way_night_charge,
      round_trip_halt_per_night: group.round_trip_halt_per_night,
      is_active: group.is_active,
    });
    setGroupError(null);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setGroupSaving(true);
    setGroupError(null);
    try {
      await patchVehicleGroup(selectedGroup.id, {
        driver_allowance_per_day: Number(groupForm.driver_allowance_per_day),
        one_way_night_charge: Number(groupForm.one_way_night_charge),
        round_trip_halt_per_night: Number(groupForm.round_trip_halt_per_night),
        is_active: groupForm.is_active,
      });
      setSelectedGroup(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setGroupError(err.message || "Failed to update vehicle group.");
    } finally {
      setGroupSaving(false);
    }
  };

  // Open Model Add/Edit
  const handleOpenAddModel = () => {
    setEditingModel(null);
    setModelForm({
      vehicle_group_code: (groups[0]?.code || "sedan") as VehicleGroupCode,
      make: "",
      model_name: "",
      display_name: "",
      passenger_capacity: 4,
      luggage_capacity: 2,
      image_url: "",
      sort_order: models.length + 1,
      is_active: true,
    });
    setModelError(null);
    setIsModelModalOpen(true);
  };

  const handleEditModel = (model: CleanVehicleModel) => {
    setEditingModel(model);
    setModelForm({
      vehicle_group_code: model.group_code as VehicleGroupCode,
      make: model.make,
      model_name: model.model_name,
      display_name: model.display_name,
      passenger_capacity: model.passenger_capacity,
      luggage_capacity: model.luggage_capacity ?? 0,
      image_url: model.image_url || "",
      sort_order: model.sort_order,
      is_active: model.is_active,
    });
    setModelError(null);
    setIsModelModalOpen(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setModelSaving(true);
    setModelError(null);
    try {
      if (editingModel) {
        await patchVehicleModel(editingModel.id, {
          make: modelForm.make.trim(),
          model_name: modelForm.model_name.trim(),
          display_name: modelForm.display_name.trim(),
          passenger_capacity: Number(modelForm.passenger_capacity),
          luggage_capacity: modelForm.luggage_capacity ? Number(modelForm.luggage_capacity) : undefined,
          image_url: modelForm.image_url.trim() || undefined,
          sort_order: Number(modelForm.sort_order),
          is_active: modelForm.is_active,
        });
      } else {
        await createVehicleModel({
          vehicle_group_code: modelForm.vehicle_group_code,
          make: modelForm.make.trim(),
          model_name: modelForm.model_name.trim(),
          display_name: modelForm.display_name.trim(),
          passenger_capacity: Number(modelForm.passenger_capacity),
          luggage_capacity: modelForm.luggage_capacity ? Number(modelForm.luggage_capacity) : undefined,
          image_url: modelForm.image_url.trim() || undefined,
          sort_order: Number(modelForm.sort_order),
        });
      }
      setIsModelModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setModelError(err.message || "Failed to save vehicle model.");
    } finally {
      setModelSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet Architecture"
        title="Vehicles & Vehicle Groups"
        description="Configure the 4 canonical vehicle groups and assign individual car models with passenger capacity and allowances. Server-authoritative."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Clean Schema
            </Badge>
            {canEdit && (
              <Button variant="gold" size="sm" onClick={handleOpenAddModel}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Vehicle Model
              </Button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading vehicles from clean catalog…
        </div>
      )}

      {loadError && (
        <div
          className="flex items-center justify-between rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Section 1: 4 Vehicle Groups */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">4 Canonical Vehicle Groups</h3>
                <p className="text-xs text-ink-soft">
                  Driver allowance (round trips), night charges (one-way pickups in night window), and halt charges.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {groups.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Card className={cn("h-full", !g.is_active && "opacity-60")}>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-gold" />
                        <CardTitle className="text-base">{g.name}</CardTitle>
                      </div>
                      <Badge tone={g.is_active ? "success" : "neutral"}>
                        {g.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Driver / Day:
                        </span>
                        <span className="font-mono font-semibold text-ink">
                          {formatINR(g.driver_allowance_per_day)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Moon className="h-3.5 w-3.5" /> Night (One-Way):
                        </span>
                        <span className="font-mono font-semibold text-ink">
                          {formatINR(g.one_way_night_charge)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5" /> Halt / Night:
                        </span>
                        <span className="font-mono font-semibold text-ink">
                          {formatINR(g.round_trip_halt_per_night)}
                        </span>
                      </div>

                      {canEdit && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleEditGroup(g)}
                          >
                            <Edit3 className="mr-1 h-3 w-3" /> Edit Group Rules
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 2: Vehicle Models Table */}
          <div className="mt-8">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Vehicle Models ({models.length})</CardTitle>
                  <CardDescription>
                    Models attached to groups. Deactivating a model hides it from new customer quotes without touching existing bookings.
                  </CardDescription>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TRow>
                      <TH>Model</TH>
                      <TH>Group</TH>
                      <TH className="text-center">Seats</TH>
                      <TH className="text-center">Luggage</TH>
                      <TH className="text-center">Order</TH>
                      <TH className="text-center">Status</TH>
                      {canEdit && <TH className="text-right">Action</TH>}
                    </TRow>
                  </THead>
                  <TBody>
                    {models.map((m, i) => (
                      <motion.tr
                        key={m.id}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.03, duration: 0.25 }}
                        className={cn(
                          "transition-colors hover:bg-gold-wash/50",
                          !m.is_active && "opacity-50"
                        )}
                      >
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                              <Car className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-ink">{m.display_name}</p>
                              <p className="text-[11px] text-ink-soft">
                                {m.make} {m.model_name}
                              </p>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <Badge tone="gold">
                            {m.group_name}
                          </Badge>
                        </TD>
                        <TD className="text-center font-mono text-xs">{m.passenger_capacity}</TD>
                        <TD className="text-center font-mono text-xs">
                          {m.luggage_capacity !== null ? `${m.luggage_capacity} bags` : "—"}
                        </TD>
                        <TD className="text-center font-mono text-xs">{m.sort_order}</TD>
                        <TD className="text-center">
                          <Badge tone={m.is_active ? "success" : "neutral"}>
                            {m.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TD>
                        {canEdit && (
                          <TD className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditModel(m)}
                              className="text-xs"
                            >
                              <Edit3 className="mr-1 h-3 w-3" /> Edit
                            </Button>
                          </TD>
                        )}
                      </motion.tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Edit Group Dialog */}
      <Dialog
        open={Boolean(selectedGroup)}
        onClose={() => !groupSaving && setSelectedGroup(null)}
        title={`Edit Group: ${selectedGroup?.name}`}
        description="Updates allowances and charges across all vehicle models in this group."
        className="sm:max-w-md"
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          {groupError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{groupError}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Group Name</label>
            <Input
              value={groupForm.name}
              required
              onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Driver Allowance / Day (₹)
            </label>
            <p className="mb-1 text-[11px] text-ink-soft">Applies to Round-Trip journeys only.</p>
            <NumberInput
              min={0}
              max={5000}
              required
              value={groupForm.driver_allowance_per_day}
              onChange={(val) => setGroupForm((f) => ({ ...f, driver_allowance_per_day: val }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              One-Way Night Charge (₹)
            </label>
            <p className="mb-1 text-[11px] text-ink-soft">
              Charged when one-way pickup time falls within the night window.
            </p>
            <NumberInput
              min={0}
              max={5000}
              required
              value={groupForm.one_way_night_charge}
              onChange={(val) => setGroupForm((f) => ({ ...f, one_way_night_charge: val }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Round-Trip Halt / Night (₹)
            </label>
            <p className="mb-1 text-[11px] text-ink-soft">
              Charged for every overnight stay on multi-day round trips.
            </p>
            <NumberInput
              min={0}
              max={5000}
              required
              value={groupForm.round_trip_halt_per_night}
              onChange={(val) => setGroupForm((f) => ({ ...f, round_trip_halt_per_night: val }))}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={groupForm.is_active}
              onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            <span>Active group on customer site</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedGroup(null)}
              disabled={groupSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={groupSaving}>
              {groupSaving ? "Saving…" : "Save Group"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add / Edit Model Dialog */}
      <Dialog
        open={isModelModalOpen}
        onClose={() => !modelSaving && setIsModelModalOpen(false)}
        title={editingModel ? `Edit Model: ${editingModel.display_name}` : "Add Vehicle Model"}
        description="Configure vehicle details, seat capacity, and catalog order."
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSaveModel} className="space-y-4">
          {modelError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{modelError}</span>
            </div>
          )}

          {!editingModel && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Vehicle Group</label>
              <select
                className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-gold"
                value={modelForm.vehicle_group_code}
                onChange={(e) => setModelForm((f) => ({ ...f, vehicle_group_code: e.target.value as VehicleGroupCode }))}
                required
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.code}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Make</label>
              <Input
                placeholder="e.g. Maruti, Toyota"
                value={modelForm.make}
                required
                onChange={(e) => setModelForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Model Name</label>
              <Input
                placeholder="e.g. Dzire, Crysta"
                value={modelForm.model_name}
                required
                onChange={(e) => setModelForm((f) => ({ ...f, model_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Customer Display Name</label>
            <Input
              placeholder="e.g. Sedan (Dzire / Etios)"
              value={modelForm.display_name}
              required
              onChange={(e) => setModelForm((f) => ({ ...f, display_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Passengers</label>
              <NumberInput
                min={1}
                max={50}
                required
                value={modelForm.passenger_capacity}
                onChange={(val) => setModelForm((f) => ({ ...f, passenger_capacity: val }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Luggage (Bags)</label>
              <NumberInput
                min={0}
                max={50}
                value={modelForm.luggage_capacity}
                onChange={(val) => setModelForm((f) => ({ ...f, luggage_capacity: val }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Sort Order</label>
              <NumberInput
                min={1}
                max={999}
                required
                value={modelForm.sort_order}
                onChange={(val) => setModelForm((f) => ({ ...f, sort_order: val }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Image URL (Optional)</label>
            <Input
              placeholder="https://... or /images/..."
              value={modelForm.image_url}
              onChange={(e) => setModelForm((f) => ({ ...f, image_url: e.target.value }))}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={modelForm.is_active}
              onChange={(e) => setModelForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            <span>Active model (available for selection)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModelModalOpen(false)}
              disabled={modelSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={modelSaving}>
              {modelSaving ? "Saving…" : editingModel ? "Update Model" : "Create Model"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
