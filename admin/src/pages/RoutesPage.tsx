import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Car,
  CheckCircle2,
  Compass,
  Edit3,
  Navigation,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, NumberInput } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import {
  fetchRoutes,
  createRoute,
  patchRoute,
  fetchRouteWithVehicles,
  putRouteVehicles,
  calculateRouteDistance,
  updateProductStatus,
  fetchVehicleModels,
  type CleanRoute,
  type CleanRouteWithVehicles,
  type CleanVehicleModel,
} from "@/services/cleanAdminApi";
import { fetchLocationSuggestions, type LocationSuggestion } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const results = await fetchLocationSuggestions(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [value]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-ink">{label}</label>
      <Input
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-rule bg-surface py-1 shadow-lg text-xs">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              className="cursor-pointer px-3 py-1.5 hover:bg-gold-soft hover:text-gold-text text-ink transition-colors flex items-center justify-between"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item.displayName || item.city || value);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{item.displayName || item.city}</span>
              {item.state && <span className="text-[10px] text-muted ml-2 shrink-0">{item.state}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RoutesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEditPrices = user.role === "super_admin";
  const canEditContent = user.role === "super_admin" || user.role === "operator";

  const [routes, setRoutes] = useState<CleanRoute[]>([]);
  const [vehicleModels, setVehicleModels] = useState<CleanVehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Route Create / Edit Modal
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CleanRoute | null>(null);
  const [routeSaving, setRouteSaving] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcInfo, setCalcInfo] = useState<string | null>(null);

  const [routeForm, setRouteForm] = useState({
    code: "",
    origin_name: "",
    destination_name: "",
    distance_km: 0,
    duration_minutes: 0,
    description: "",
    image_url: "",
  });

  // Vehicle Pricing Matrix Modal
  const [matrixRoute, setMatrixRoute] = useState<CleanRoute | null>(null);
  const [matrixVehicles, setMatrixVehicles] = useState<CleanRouteWithVehicles["vehicles"]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [matrixSuccess, setMatrixSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [routesData, modelsData] = await Promise.all([
        fetchRoutes(),
        fetchVehicleModels(),
      ]);
      setRoutes(routesData);
      setVehicleModels(modelsData);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load routes from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  // Open Route Add / Edit
  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      code: "",
      origin_name: "",
      destination_name: "",
      distance_km: 0,
      duration_minutes: 0,
      description: "",
      image_url: "",
    });
    setRouteError(null);
    setCalcInfo(null);
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route: CleanRoute) => {
    setEditingRoute(route);
    setRouteForm({
      code: route.code,
      origin_name: route.origin_name,
      destination_name: route.destination_name,
      distance_km: route.distance_km ?? 0,
      duration_minutes: route.duration_minutes ?? 0,
      description: route.description || "",
      image_url: route.image_url || "",
    });
    setRouteError(null);
    setCalcInfo(null);
    setIsRouteModalOpen(true);
  };

  // LocationIQ Calculate Distance
  const handleCalculateDistance = async () => {
    if (!routeForm.origin_name || !routeForm.destination_name) {
      setRouteError("Please enter both Origin and Destination first.");
      return;
    }
    setCalcLoading(true);
    setRouteError(null);
    setCalcInfo(null);
    try {
      const res = await calculateRouteDistance(routeForm.origin_name, routeForm.destination_name);
      setRouteForm((f) => ({
        ...f,
        distance_km: res.distance_km,
        duration_minutes: res.duration_minutes,
      }));
      setCalcInfo(`LocationIQ: ${res.distance_km} km • ${Math.round(res.duration_minutes / 60)} hrs`);
    } catch (err: any) {
      setRouteError(err.message || "Distance lookup failed. You can enter km and duration manually.");
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteSaving(true);
    setRouteError(null);
    try {
      if (editingRoute) {
        await patchRoute(editingRoute.id, {
          origin_name: routeForm.origin_name.trim(),
          destination_name: routeForm.destination_name.trim(),
          distance_km: routeForm.distance_km > 0 ? Number(routeForm.distance_km) : null,
          duration_minutes: routeForm.duration_minutes > 0 ? Number(routeForm.duration_minutes) : null,
          description: routeForm.description.trim() || null,
          image_url: routeForm.image_url.trim() || null,
        });
      } else {
        await createRoute({
          code: routeForm.code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          origin_name: routeForm.origin_name.trim(),
          destination_name: routeForm.destination_name.trim(),
          distance_km: routeForm.distance_km > 0 ? Number(routeForm.distance_km) : null,
          duration_minutes: routeForm.duration_minutes > 0 ? Number(routeForm.duration_minutes) : null,
          description: routeForm.description.trim() || null,
          image_url: routeForm.image_url.trim() || null,
        });
      }
      setIsRouteModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setRouteError(err.message || "Failed to save route.");
    } finally {
      setRouteSaving(false);
    }
  };

  // Open Vehicle Pricing Matrix Modal
  const handleOpenMatrix = async (route: CleanRoute) => {
    setMatrixRoute(route);
    setMatrixLoading(true);
    setMatrixError(null);
    setMatrixSuccess(null);
    try {
      const data = await fetchRouteWithVehicles(route.id);
      // Map existing route vehicles with fallback for models not yet configured
      const existingMap = new Map(data.vehicles.map((v) => [v.vehicle_model_id, v]));
      const completeVehicles = vehicleModels.map((m, idx) => {
        const existing = existingMap.get(m.id);
        return {
          id: existing?.id || m.id,
          route_id: route.id,
          vehicle_model_id: m.id,
          display_name: m.display_name,
          group_code: m.group_code,
          passenger_capacity: m.passenger_capacity,
          luggage_capacity: m.luggage_capacity,
          one_way_amount: existing?.one_way_amount ?? null,
          round_trip_enabled: existing?.round_trip_enabled ?? true,
          terms: existing?.terms ?? { inclusions: ["Tolls", "State Tax"], exclusions: ["Parking"] },
          sort_order: existing?.sort_order ?? idx + 1,
          is_active: existing?.is_active ?? true,
        };
      });
      setMatrixVehicles(completeVehicles);
    } catch (err: any) {
      setMatrixError(err.message || "Failed to load route vehicle matrix.");
    } finally {
      setMatrixLoading(false);
    }
  };

  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrixRoute) return;
    setMatrixSaving(true);
    setMatrixError(null);
    setMatrixSuccess(null);
    try {
      const payload = matrixVehicles.map((v) => ({
        vehicle_model_id: v.vehicle_model_id,
        one_way_amount: v.one_way_amount ? Number(v.one_way_amount) : null,
        round_trip_enabled: Boolean(v.round_trip_enabled),
        terms: v.terms,
        sort_order: Number(v.sort_order),
        is_active: Boolean(v.is_active),
      }));
      await putRouteVehicles(matrixRoute.id, payload as any);
      setMatrixSuccess("Route vehicle rates and settings updated!");
      setTimeout(() => {
        setMatrixRoute(null);
        setReloadKey((k) => k + 1);
      }, 1000);
    } catch (err: any) {
      setMatrixError(err.message || "Failed to save route vehicle matrix.");
    } finally {
      setMatrixSaving(false);
    }
  };

  // Status toggle (Publish / Archive)
  const handleToggleStatus = async (route: CleanRoute, newStatus: "published" | "archived") => {
    try {
      await updateProductStatus("outstation_route", route.id, newStatus);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || "Failed to update route status.");
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.origin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Corridors & Logistics"
        title="Intercity Outstation Routes"
        description="Outstation route corridors with LocationIQ road geometry and per-vehicle model one-way / round-trip commercial pricing."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Clean Catalog
            </Badge>
            {canEditContent && (
              <Button variant="gold" size="sm" onClick={handleOpenAddRoute}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Outstation Route
              </Button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading outstation routes…
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
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(["all", "published", "draft", "archived"] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize text-xs"
                >
                  {s} ({routes.filter((r) => s === "all" || r.status === s).length})
                </Button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
              <Input
                placeholder="Search origin, destination, or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Corridors & Route Matrix ({filteredRoutes.length})</CardTitle>
                <CardDescription>
                  Routes connect origin and destination. Publishing requires distance and duration.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TRow>
                    <TH>Route Corridor</TH>
                    <TH>Code / Slug</TH>
                    <TH className="text-right">Distance</TH>
                    <TH className="text-right">Duration</TH>
                    <TH className="text-center">Status</TH>
                    <TH className="text-right">Actions</TH>
                  </TRow>
                </THead>
                <TBody>
                  {filteredRoutes.length === 0 ? (
                    <TRow>
                      <TD colSpan={6} className="py-8 text-center text-sm text-ink-soft">
                        No outstation routes match this filter.
                      </TD>
                    </TRow>
                  ) : (
                    filteredRoutes.map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.02, duration: 0.25 }}
                        className={cn(
                          "transition-colors hover:bg-gold-wash/50",
                          r.status === "archived" && "opacity-60"
                        )}
                      >
                        <TD>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                              <Navigation className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="font-semibold text-ink">
                                {r.origin_name} → {r.destination_name}
                              </p>
                              {r.description && (
                                <p className="truncate max-w-xs text-[11px] text-ink-soft">
                                  {r.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                            {r.code}
                          </code>
                        </TD>
                        <TD className="text-right font-mono text-xs">
                          {r.distance_km ? `${r.distance_km} km` : "—"}
                        </TD>
                        <TD className="text-right font-mono text-xs">
                          {r.duration_minutes
                            ? `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}m`
                            : "—"}
                        </TD>
                        <TD className="text-center">
                          <Badge
                            tone={
                              r.status === "published"
                                ? "success"
                                : r.status === "archived"
                                ? "neutral"
                                : "gold"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEditPrices && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleOpenMatrix(r)}
                              >
                                <Car className="mr-1 h-3 w-3 text-gold" /> Prices
                              </Button>
                            )}

                            {canEditContent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleOpenEditRoute(r)}
                              >
                                <Edit3 className="mr-1 h-3 w-3" /> Edit
                              </Button>
                            )}

                            {canEditContent && r.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-teal-600 hover:text-teal-700"
                                onClick={() => handleToggleStatus(r, "published")}
                              >
                                <UploadCloud className="mr-1 h-3 w-3" /> Publish
                              </Button>
                            )}

                            {canEditContent && r.status === "published" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-amber-600 hover:text-amber-700"
                                onClick={() => handleToggleStatus(r, "archived")}
                              >
                                <Archive className="mr-1 h-3 w-3" /> Archive
                              </Button>
                            )}
                          </div>
                        </TD>
                      </motion.tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Route Add/Edit Modal */}
      <Dialog
        open={isRouteModalOpen}
        onClose={() => !routeSaving && setIsRouteModalOpen(false)}
        title={editingRoute ? `Edit Route: ${editingRoute.origin_name} → ${editingRoute.destination_name}` : "Create Outstation Route"}
        description="Configure corridor cities, distance, duration, and URL code."
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSaveRoute} className="space-y-4">
          {routeError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{routeError}</span>
            </div>
          )}

          {calcInfo && (
            <div className="flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-xs text-teal-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{calcInfo}</span>
            </div>
          )}

          {!editingRoute && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Route Code / Slug</label>
              <Input
                placeholder="e.g. agra-to-delhi-taxi"
                value={routeForm.code}
                required
                onChange={(e) => setRouteForm((f) => ({ ...f, code: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LocationInput
              label="Origin City"
              placeholder="e.g. Agra, Uttar Pradesh"
              value={routeForm.origin_name}
              required
              onChange={(val) => setRouteForm((f) => ({ ...f, origin_name: val }))}
            />
            <LocationInput
              label="Destination City"
              placeholder="e.g. Delhi, NCR"
              value={routeForm.destination_name}
              required
              onChange={(val) => setRouteForm((f) => ({ ...f, destination_name: val }))}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCalculateDistance}
              disabled={calcLoading}
              className="text-xs"
            >
              <Compass className={cn("mr-1.5 h-3.5 w-3.5", calcLoading && "animate-spin")} />
              {calcLoading ? "Consulting LocationIQ…" : "Calculate Distance & Duration"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Road Distance (km)</label>
              <NumberInput
                min={1}
                max={5000}
                value={routeForm.distance_km}
                onChange={(val) => setRouteForm((f) => ({ ...f, distance_km: val }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Duration (Minutes)</label>
              <NumberInput
                min={1}
                max={5000}
                value={routeForm.duration_minutes}
                onChange={(val) => setRouteForm((f) => ({ ...f, duration_minutes: val }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Description</label>
            <Input
              placeholder="e.g. Direct expressway transfer via Yamuna Expressway"
              value={routeForm.description}
              onChange={(e) => setRouteForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Cover Image URL</label>
            <Input
              placeholder="https://... or /images/..."
              value={routeForm.image_url}
              onChange={(e) => setRouteForm((f) => ({ ...f, image_url: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="outline"
              disabled={routeSaving}
              onClick={() => setIsRouteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={routeSaving}>
              {routeSaving ? "Saving…" : editingRoute ? "Save Route Changes" : "Create Route"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Route Vehicle Pricing Matrix Modal */}
      <Dialog
        open={Boolean(matrixRoute)}
        onClose={() => !matrixSaving && setMatrixRoute(null)}
        title={`Pricing Matrix: ${matrixRoute?.origin_name} → ${matrixRoute?.destination_name}`}
        description="Set one-way fixed prices and round-trip eligibility per vehicle model. Billed at server rate."
        className="sm:max-w-3xl"
      >
        <form onSubmit={handleSaveMatrix} className="space-y-4">
          {matrixError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{matrixError}</span>
            </div>
          )}

          {matrixSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-xs text-teal-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{matrixSuccess}</span>
            </div>
          )}

          {matrixLoading ? (
            <div className="flex h-48 items-center justify-center text-xs text-ink-soft">
              Loading pricing matrix…
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {matrixVehicles.map((v, idx) => (
                <div
                  key={v.vehicle_model_id}
                  className="rounded-md border border-hairline bg-surface-2/40 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                    <div className="sm:col-span-4">
                      <p className="font-semibold text-xs text-ink">{v.display_name}</p>
                      <Badge tone="gold">{v.group_code}</Badge>
                      <span className="ml-2 font-mono text-[11px] text-ink-faint">
                        {v.passenger_capacity} seats
                      </span>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-ink mb-1">
                        One-Way Fare (₹)
                      </label>
                      <NumberInput
                        min={100}
                        max={100000}
                        placeholder="Leave blank if N/A"
                        value={v.one_way_amount ?? 0}
                        onChange={(val) => {
                          const updated = [...matrixVehicles];
                          updated[idx] = { ...v, one_way_amount: val > 0 ? val : null };
                          setMatrixVehicles(updated);
                        }}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={v.round_trip_enabled}
                          onChange={(e) => {
                            const updated = [...matrixVehicles];
                            updated[idx] = { ...v, round_trip_enabled: e.target.checked };
                            setMatrixVehicles(updated);
                          }}
                          className="h-4 w-4 accent-gold"
                        />
                        <span>Round-Trip Allowed</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 text-right">
                      <label className="flex items-center justify-end gap-1.5 cursor-pointer text-xs font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={v.is_active}
                          onChange={(e) => {
                            const updated = [...matrixVehicles];
                            updated[idx] = { ...v, is_active: e.target.checked };
                            setMatrixVehicles(updated);
                          }}
                          className="h-4 w-4 accent-gold"
                        />
                        <span>{v.is_active ? "Active" : "Off"}</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="outline"
              disabled={matrixSaving}
              onClick={() => setMatrixRoute(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={matrixSaving || matrixLoading}>
              {matrixSaving ? "Saving Matrix…" : "Save Route Pricing"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
