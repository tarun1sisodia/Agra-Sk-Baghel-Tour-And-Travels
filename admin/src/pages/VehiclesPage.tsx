import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Edit3,
  Home,
  ImageIcon,
  Layers,
  Moon,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
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

export interface FleetPreset {
  vehicle_group_code: VehicleGroupCode;
  make: string;
  model_name: string;
  display_name: string;
  passenger_capacity: number;
  luggage_capacity: number;
  image_url: string;
  description: string;
}

export const FLEET_PRESETS: FleetPreset[] = [
  // SEDAN
  {
    vehicle_group_code: "sedan",
    make: "Maruti",
    model_name: "Dzire",
    display_name: "Maruti Dzire",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/sedan.webp",
    description: "Compact executive sedan, high fuel economy, perfect for Delhi-Agra Expressway & local sightseeing.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Honda",
    model_name: "Amaze",
    display_name: "Honda Amaze Sedan",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/honda-amaze-red-sedan-921x519.webp",
    description: "Comfortable legroom, deep 420L boot hold, chilled dual AC for executive drops.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Skoda",
    model_name: "Slavia",
    display_name: "Skoda Slavia Monte Carlo",
    passenger_capacity: 4,
    luggage_capacity: 3,
    image_url: "/assets/fleet/skoda-slavia-montecarlo-jodhpur-palace-921x519.jpg",
    description: "European touring sedan, cavernous 521L boot hold, German highway stability.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Toyota",
    model_name: "Belta",
    display_name: "Toyota Belta / Ciaz Executive",
    passenger_capacity: 4,
    luggage_capacity: 3,
    image_url: "/assets/fleet/toyota-belta-white-sedan-1000x650.png",
    description: "Spacious rear executive lounge bench, ideal for business delegates & airport transfers.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Maruti",
    model_name: "Swift",
    display_name: "Maruti Swift Touring",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/maruti-swift-red-hatchback-angle-360x536.jpg",
    description: "Agile city tourer and rapid Yamuna expressway hops for budget-conscious couples.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Toyota",
    model_name: "Glanza",
    display_name: "Toyota Glanza Executive",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/toyota-glanza-red-hatchback-studio-1537x1023.png",
    description: "Premium cabin with automatic climate control, great for nimble heritage city tours.",
  },
  {
    vehicle_group_code: "sedan",
    make: "Maruti",
    model_name: "WagonR",
    display_name: "Maruti WagonR Tallboy",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/maruti-wagonr-red-hatchback-360x536.jpg",
    description: "Tallboy stance with effortless senior-citizen ingress and ample headroom.",
  },

  // SUV
  {
    vehicle_group_code: "suv",
    make: "Maruti",
    model_name: "Ertiga",
    display_name: "Maruti Ertiga Hybrid",
    passenger_capacity: 6,
    luggage_capacity: 3,
    image_url: "/assets/fleet/ertiga.webp",
    description: "Family favorite 6-passenger transporter with dedicated roof-mounted AC blower.",
  },
  {
    vehicle_group_code: "suv",
    make: "Toyota",
    model_name: "Innova Crysta",
    display_name: "Toyota Innova Crysta",
    passenger_capacity: 6,
    luggage_capacity: 4,
    image_url: "/assets/fleet/innova.webp",
    description: "The undisputed emperor of Indian highway touring with plush captain seats.",
  },
  {
    vehicle_group_code: "suv",
    make: "Toyota",
    model_name: "Fortuner",
    display_name: "Toyota Fortuner 4x4",
    passenger_capacity: 7,
    luggage_capacity: 4,
    image_url: "/assets/fleet/toyota-fortuner-black-suv-360x536.jpg",
    description: "Commanding road presence, heavy expressway stability, and VIP dignitary security.",
  },
  {
    vehicle_group_code: "suv",
    make: "Hyundai",
    model_name: "Creta",
    display_name: "Hyundai Creta Facelift",
    passenger_capacity: 5,
    luggage_capacity: 3,
    image_url: "/assets/fleet/hyundai-creta-white-suv-921x519.jpg",
    description: "Panoramic glass roof, ventilated seats, plush highway suspension for small families.",
  },
  {
    vehicle_group_code: "suv",
    make: "Mahindra",
    model_name: "XUV700",
    display_name: "Mahindra XUV700",
    passenger_capacity: 6,
    luggage_capacity: 3,
    image_url: "/assets/fleet/mahindra-xuv700-blue-suv-360x536.jpg",
    description: "Skyroof panoramic glass, mStallion turbo power, and Sony 3D immersive sound.",
  },
  {
    vehicle_group_code: "suv",
    make: "Mahindra",
    model_name: "XUV 3XO",
    display_name: "Mahindra XUV 3XO",
    passenger_capacity: 5,
    luggage_capacity: 3,
    image_url: "/assets/fleet/mahindra-xuv-3xo-red-compact-suv-360x536.jpg",
    description: "Modern compact SUV with wide stance, expressway punch, and full safety suite.",
  },
  {
    vehicle_group_code: "suv",
    make: "Maruti",
    model_name: "Brezza",
    display_name: "Maruti Suzuki Brezza",
    passenger_capacity: 5,
    luggage_capacity: 3,
    image_url: "/assets/fleet/maruti-brezza-red-compact-suv-1260x564.png",
    description: "Smart hybrid economy, high ground clearance, rear AC vents for intercity tours.",
  },
  {
    vehicle_group_code: "suv",
    make: "Tata",
    model_name: "Nexon",
    display_name: "Tata Nexon Fearless",
    passenger_capacity: 5,
    luggage_capacity: 3,
    image_url: "/assets/fleet/tata-nexon-fearless-green-suv-1260x564.png",
    description: "5-Star Global NCAP crash safety rating with heavy-duty all-weather suspension.",
  },
  {
    vehicle_group_code: "suv",
    make: "Tata",
    model_name: "Punch",
    display_name: "Tata Punch SUV",
    passenger_capacity: 5,
    luggage_capacity: 2,
    image_url: "/assets/fleet/tata-punch-blue-suv-1260x564.png",
    description: "High ground clearance, 5-star crash safety, agile handling in crowded heritage lanes.",
  },
  {
    vehicle_group_code: "suv",
    make: "Honda",
    model_name: "Elevate",
    display_name: "Honda Elevate SUV",
    passenger_capacity: 5,
    luggage_capacity: 3,
    image_url: "/assets/fleet/honda-elevate-black-suv-front-930x620.jpg",
    description: "220mm ground clearance, airy glasshouse cabin, and Honda Sensing security.",
  },
  {
    vehicle_group_code: "suv",
    make: "MG",
    model_name: "Hector Plus",
    display_name: "MG Hector Plus 6-Seater",
    passenger_capacity: 6,
    luggage_capacity: 3,
    image_url: "/assets/fleet/mg-hector-plus-black-suv-480x360.webp",
    description: "Middle-row executive captain chairs, panoramic moonroof, and full passenger connectivity.",
  },

  // LUXURY
  {
    vehicle_group_code: "luxury",
    make: "Toyota",
    model_name: "Camry",
    display_name: "Toyota Camry Hybrid",
    passenger_capacity: 4,
    luggage_capacity: 3,
    image_url: "/assets/fleet/toyota-camry-hybrid-executive-luxury-360x536.jpg",
    description: "Whisper-quiet hybrid drive, executive reclining rear lounge, Nanoe air purification.",
  },
  {
    vehicle_group_code: "luxury",
    make: "Toyota",
    model_name: "Vellfire",
    display_name: "Toyota Vellfire VIP Lounge",
    passenger_capacity: 6,
    luggage_capacity: 4,
    image_url: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg",
    description: "Presidential MPV with powered ottoman seats, private acoustic cabin, and mood lighting.",
  },
  {
    vehicle_group_code: "luxury",
    make: "Audi",
    model_name: "S5",
    display_name: "Audi S5 Sportback",
    passenger_capacity: 4,
    luggage_capacity: 3,
    image_url: "/assets/fleet/audi-s5-sportback-luxury-sedan-1000x650.png",
    description: "German high-performance luxury sportback for VIP airport arrivals and corporate CXOs.",
  },
  {
    vehicle_group_code: "luxury",
    make: "Volvo",
    model_name: "EM90",
    display_name: "Volvo EM90 VIP MPV",
    passenger_capacity: 6,
    luggage_capacity: 4,
    image_url: "/assets/fleet/volvo-em90-luxury-electric-mpv-1000x650.png",
    description: "Scandinavian luxury living room on wheels with Bowers & Wilkins audio experience.",
  },

  // TEMPO TRAVELLER
  {
    vehicle_group_code: "tempo_traveller",
    make: "Force",
    model_name: "Tempo Traveller 12",
    display_name: "Tempo Traveller (12 Seater)",
    passenger_capacity: 12,
    luggage_capacity: 8,
    image_url: "/assets/fleet/tempo.webp",
    description: "High-roof 12-seater touring van with individual reclining seats and USB ports.",
  },
  {
    vehicle_group_code: "tempo_traveller",
    make: "Force",
    model_name: "Tempo Traveller 17",
    display_name: "Tempo Traveller (17 Seater)",
    passenger_capacity: 17,
    luggage_capacity: 10,
    image_url: "/assets/fleet/tempo.webp",
    description: "Spacious group transporter with heavy-duty roof carrier and individual AC louvers.",
  },
  {
    vehicle_group_code: "tempo_traveller",
    make: "Force",
    model_name: "Tempo Traveller 26",
    display_name: "Tempo Traveller (26 Seater)",
    passenger_capacity: 26,
    luggage_capacity: 15,
    image_url: "/assets/fleet/tempo.webp",
    description: "Heavy group transporter for wedding entourages and student heritage excursions.",
  },
  {
    vehicle_group_code: "tempo_traveller",
    make: "Force",
    model_name: "Urbania",
    display_name: "Force Urbania Luxury VIP",
    passenger_capacity: 10,
    luggage_capacity: 8,
    image_url: "/assets/fleet/urbania.webp",
    description: "European monocoque VIP van with plush captain chairs and panoramic UV-cut windows.",
  },
];

export const FLEET_IMAGE_OPTIONS = [
  { label: "Maruti Dzire / Sedan Standard (sedan.webp)", value: "/assets/fleet/sedan.webp" },
  { label: "Honda Amaze Sedan - Red (921x519)", value: "/assets/fleet/honda-amaze-red-sedan-921x519.webp" },
  { label: "Honda Amaze Sedan - Silver (1280x720)", value: "/assets/fleet/honda-amaze-silver-sedan-1280x720.webp" },
  { label: "Maruti Ertiga Hybrid (ertiga.webp)", value: "/assets/fleet/ertiga.webp" },
  { label: "Toyota Innova Crysta (innova.webp)", value: "/assets/fleet/innova.webp" },
  { label: "Toyota Fortuner 4x4 - Black SUV (360x536)", value: "/assets/fleet/toyota-fortuner-black-suv-360x536.jpg" },
  { label: "Toyota Camry Hybrid - Executive (360x536)", value: "/assets/fleet/toyota-camry-hybrid-executive-luxury-360x536.jpg" },
  { label: "Toyota Vellfire VIP Lounge - Luxury (360x536)", value: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg" },
  { label: "Hyundai Creta - White SUV (921x519)", value: "/assets/fleet/hyundai-creta-white-suv-921x519.jpg" },
  { label: "Hyundai Creta - Facelift Action (921x519)", value: "/assets/fleet/hyundai-creta-facelift-action-921x519.jpg" },
  { label: "Hyundai Creta - Highway Tour (360x536)", value: "/assets/fleet/hyundai-creta-highway-tour-360x536.jpg" },
  { label: "Hyundai Creta - Rear Angle (921x519)", value: "/assets/fleet/hyundai-creta-rear-angle-921x519.jpg" },
  { label: "Maruti Brezza - Red Compact SUV (1260x564)", value: "/assets/fleet/maruti-brezza-red-compact-suv-1260x564.png" },
  { label: "Skoda Slavia - Monte Carlo Jodhpur (921x519)", value: "/assets/fleet/skoda-slavia-montecarlo-jodhpur-palace-921x519.jpg" },
  { label: "Skoda Slavia - Front Angle (921x519)", value: "/assets/fleet/skoda-slavia-sedan-front-angle-921x519.jpg" },
  { label: "Tata Nexon - Fearless Green SUV (1260x564)", value: "/assets/fleet/tata-nexon-fearless-green-suv-1260x564.png" },
  { label: "Tata Nexon - Rear Quarter (921x519)", value: "/assets/fleet/tata-nexon-rear-quarter-921x519.png" },
  { label: "Tata Punch - Blue SUV (1260x564)", value: "/assets/fleet/tata-punch-blue-suv-1260x564.png" },
  { label: "Tata Punch - Side Profile (919x519)", value: "/assets/fleet/tata-punch-side-profile-blue-919x519.png" },
  { label: "Mahindra XUV700 - Blue SUV (360x536)", value: "/assets/fleet/mahindra-xuv700-blue-suv-360x536.jpg" },
  { label: "Mahindra XUV 3XO - Red SUV (360x536)", value: "/assets/fleet/mahindra-xuv-3xo-red-compact-suv-360x536.jpg" },
  { label: "Honda Elevate - Black SUV Front (930x620)", value: "/assets/fleet/honda-elevate-black-suv-front-930x620.jpg" },
  { label: "Honda Elevate - Heritage Fort Tour (840x545)", value: "/assets/fleet/honda-elevate-heritage-fort-tour-840x545.jpg" },
  { label: "Honda Elevate - Rear Three Quarter (930x620)", value: "/assets/fleet/honda-elevate-rear-three-quarter-930x620.jpg" },
  { label: "Toyota Glanza - Red Hatchback Studio (1537x1023)", value: "/assets/fleet/toyota-glanza-red-hatchback-studio-1537x1023.png" },
  { label: "Toyota Glanza - Mirror Blue (921x519)", value: "/assets/fleet/toyota-glanza-mirror-blue-921x519.jpg" },
  { label: "Toyota Glanza - City Night (840x376)", value: "/assets/fleet/toyota-glanza-city-night-840x376.jpg" },
  { label: "Toyota Glanza - Front Grille Blue (921x519)", value: "/assets/fleet/toyota-glanza-front-grille-blue-921x519.png" },
  { label: "MG Hector Plus 6-Seater (480x360)", value: "/assets/fleet/mg-hector-plus-black-suv-480x360.webp" },
  { label: "Maruti Swift - Red Hatchback Angle (360x536)", value: "/assets/fleet/maruti-swift-red-hatchback-angle-360x536.jpg" },
  { label: "Maruti Swift - Portrait (360x536)", value: "/assets/fleet/maruti-swift-red-hatchback-portrait-360x536.jpg" },
  { label: "Maruti WagonR - Tallboy (360x536)", value: "/assets/fleet/maruti-wagonr-red-hatchback-360x536.jpg" },
  { label: "Toyota Belta / Ciaz - White Sedan (1000x650)", value: "/assets/fleet/toyota-belta-white-sedan-1000x650.png" },
  { label: "Audi S5 Sportback - Luxury Sedan (1000x650)", value: "/assets/fleet/audi-s5-sportback-luxury-sedan-1000x650.png" },
  { label: "Volvo EM90 - VIP Electric MPV (1000x650)", value: "/assets/fleet/volvo-em90-luxury-electric-mpv-1000x650.png" },
  { label: "Volvo EX90 - Grey Electric SUV (1555x1011)", value: "/assets/fleet/volvo-ex90-grey-electric-suv-1555x1011.png" },
  { label: "Force Tempo Traveller (tempo.webp)", value: "/assets/fleet/tempo.webp" },
  { label: "Force Urbania VIP (urbania.webp)", value: "/assets/fleet/urbania.webp" },
];

function findPresetModel(preset: FleetPreset, existingModels: CleanVehicleModel[]): CleanVehicleModel | undefined {
  const pMake = preset.make.toLowerCase().trim();
  const pModel = preset.model_name.toLowerCase().trim();
  const pDisplay = preset.display_name.toLowerCase().trim();
  return existingModels.find((m) => {
    const mMake = m.make.toLowerCase().trim();
    const mModel = m.model_name.toLowerCase().trim();
    const mDisplay = m.display_name.toLowerCase().trim();
    return (
      (mMake === pMake && mModel === pModel) ||
      mDisplay === pDisplay ||
      mModel.includes(pModel) ||
      pModel.includes(mModel)
    );
  });
}
function isPresetInFleet(preset: FleetPreset, existingModels: CleanVehicleModel[]): boolean {
  return Boolean(findPresetModel(preset, existingModels));
}

export function VehiclesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEdit = user.role === "super_admin";

  const [groups, setGroups] = useState<CleanVehicleGroup[]>([]);
  const [models, setModels] = useState<CleanVehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Search & Catalog Filters
  const [tableSearch, setTableSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTab, setCatalogTab] = useState<"missing" | "all" | "active">("missing");

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
  const [imagePreviewError, setImagePreviewError] = useState(false);
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
    setImagePreviewError(false);
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
    setImagePreviewError(false);
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

  // Quick Onboard a Preset
  const handleOnboardPreset = (preset: FleetPreset) => {
    setEditingModel(null);
    setImagePreviewError(false);
    setModelForm({
      vehicle_group_code: preset.vehicle_group_code,
      make: preset.make,
      model_name: preset.model_name,
      display_name: preset.display_name,
      passenger_capacity: preset.passenger_capacity,
      luggage_capacity: preset.luggage_capacity,
      image_url: preset.image_url,
      sort_order: models.length + 1,
      is_active: true,
    });
    setModelError(null);
    setIsModelModalOpen(true);
  };

  const handleSelectTemplate = (presetDisplayName: string) => {
    if (!presetDisplayName) return;
    const preset = FLEET_PRESETS.find((p) => p.display_name === presetDisplayName);
    if (!preset) return;
    setImagePreviewError(false);
    setModelForm((f) => ({
      ...f,
      vehicle_group_code: preset.vehicle_group_code,
      make: preset.make,
      model_name: preset.model_name,
      display_name: preset.display_name,
      passenger_capacity: preset.passenger_capacity,
      luggage_capacity: preset.luggage_capacity,
      image_url: preset.image_url,
    }));
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

  // Filtered models for table
  const filteredModels = useMemo(() => {
    if (!tableSearch.trim()) return models;
    const q = tableSearch.toLowerCase().trim();
    return models.filter(
      (m) =>
        m.display_name.toLowerCase().includes(q) ||
        m.make.toLowerCase().includes(q) ||
        m.model_name.toLowerCase().includes(q) ||
        m.group_name.toLowerCase().includes(q) ||
        m.group_code.toLowerCase().includes(q)
    );
  }, [models, tableSearch]);

  // Catalog Presets computation
  const catalogStats = useMemo(() => {
    const missing = FLEET_PRESETS.filter((p) => !isPresetInFleet(p, models));
    const active = FLEET_PRESETS.filter((p) => findPresetModel(p, models)?.is_active === true);
    return { missing, active, all: FLEET_PRESETS };
  }, [models]);

  const displayedCatalog = useMemo(() => {
    let list = catalogStats.all;
    if (catalogTab === "missing") list = catalogStats.missing;
    if (catalogTab === "active") list = catalogStats.active;

    if (!catalogSearch.trim()) return list;
    const q = catalogSearch.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.make.toLowerCase().includes(q) ||
        p.model_name.toLowerCase().includes(q) ||
        p.vehicle_group_code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [catalogStats, catalogTab, catalogSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet Architecture"
        title="Vehicles & Vehicle Groups"
        description="Configure the 4 canonical vehicle groups, manage live car models with high-res photos, and easily onboard missing fleet cars from our catalog. Server-authoritative."
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
          {/* Section 1: 4 Canonical Vehicle Groups */}
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

          {/* Section 2: Fleet Model Catalog & Quick Onboarding */}
          <div className="mt-8">
            <Card className="overflow-hidden border-gold/30 bg-surface">
              <CardHeader className="border-b border-rule pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <CardTitle className="text-base font-semibold text-ink">
                        Fleet Asset Catalog & Quick Onboarding
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-ink-soft">
                      Pre-configured fleet library with high-resolution imagery. Click “+ Onboard to Fleet” to instantly activate any missing vehicle model.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Catalog tabs */}
                    <div className="flex rounded-md border border-hairline bg-surface-alt p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setCatalogTab("missing")}
                        className={cn(
                          "rounded px-2.5 py-1 font-medium transition-colors",
                          catalogTab === "missing"
                            ? "bg-gold text-white shadow-xs"
                            : "text-ink-soft hover:text-ink"
                        )}
                      >
                        Missing in Fleet ({catalogStats.missing.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogTab("all")}
                        className={cn(
                          "rounded px-2.5 py-1 font-medium transition-colors",
                          catalogTab === "all"
                            ? "bg-gold text-white shadow-xs"
                            : "text-ink-soft hover:text-ink"
                        )}
                      >
                        All Catalog ({catalogStats.all.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogTab("active")}
                        className={cn(
                          "rounded px-2.5 py-1 font-medium transition-colors",
                          catalogTab === "active"
                            ? "bg-gold text-white shadow-xs"
                            : "text-ink-soft hover:text-ink"
                        )}
                      >
                        Active ({catalogStats.active.length})
                      </button>
                    </div>

                    {/* Catalog search */}
                    <div className="relative w-44">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                      <Input
                        placeholder="Search catalog…"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {displayedCatalog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="mb-2 h-8 w-8 text-success" />
                    <p className="text-sm font-semibold text-ink">
                      {catalogTab === "missing"
                        ? "All catalog vehicles are already onboarded!"
                        : "No vehicles match your search filter."}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {catalogTab === "missing"
                        ? "Every vehicle in our catalog is active in your database."
                        : "Try a different search keyword or switch tabs."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayedCatalog.map((preset) => {
                      const matchedModel = findPresetModel(preset, models);
                      const inFleet = Boolean(matchedModel);
                      const isActiveInFleet = matchedModel?.is_active === true;
                      return (
                        <div
                          key={preset.display_name}
                          className={cn(
                            "group flex flex-col justify-between overflow-hidden rounded-md border border-hairline bg-surface transition-all hover:border-gold/50 hover:shadow-sm",
                            isActiveInFleet && "bg-surface-alt/40 opacity-80 hover:opacity-100"
                          )}
                        >
                          <div>
                            {/* Vehicle photo */}
                            <div className="relative aspect-video w-full overflow-hidden bg-surface-alt">
                              <img
                                src={preset.image_url}
                                alt={preset.display_name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/assets/fleet/sedan.webp";
                                }}
                              />
                              <div className="absolute left-2 top-2">
                                <Badge tone={preset.vehicle_group_code === "luxury" ? "gold" : "teal"}>
                                  {preset.vehicle_group_code.toUpperCase()}
                                </Badge>
                              </div>
                              {matchedModel && (
                                <div className="absolute right-2 top-2">
                                  <Badge tone={isActiveInFleet ? "success" : "neutral"} className={isActiveInFleet ? "bg-success text-white" : "bg-surface text-ink-soft"}>
                                    {isActiveInFleet ? <><Check className="mr-1 h-3 w-3" /> In Fleet</> : "Inactive in Fleet"}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <div className="flex items-baseline justify-between gap-1">
                                <h4 className="font-semibold text-ink text-sm leading-tight">
                                  {preset.display_name}
                                </h4>
                              </div>
                              <p className="text-[11px] font-mono text-ink-soft">
                                {preset.make} • {preset.model_name}
                              </p>

                              <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                                <span className="inline-flex items-center gap-1 rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[11px]">
                                  <Users className="h-3 w-3 text-gold" /> {preset.passenger_capacity} seats
                                </span>
                                <span className="inline-flex items-center gap-1 rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[11px]">
                                  {preset.luggage_capacity} bags
                                </span>
                              </div>

                              <p className="mt-2 line-clamp-2 text-[11px] text-ink-soft">
                                {preset.description}
                              </p>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="border-t border-hairline p-2.5">
                            {inFleet ? (
                              <div className="flex items-center justify-between text-xs text-ink-soft">
                                <span className="flex items-center gap-1 text-[11px] text-success">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Active in Fleet
                                </span>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const existing = models.find((m) =>
                                        m.model_name.toLowerCase().includes(preset.model_name.toLowerCase()) ||
                                        preset.model_name.toLowerCase().includes(m.model_name.toLowerCase())
                                      );
                                      if (existing) handleEditModel(existing);
                                    }}
                                  >
                                    <Edit3 className="mr-1 h-3 w-3" /> Edit
                                  </Button>
                                )}
                              </div>
                            ) : (
                              canEdit && (
                                <Button
                                  variant="gold"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => handleOnboardPreset(preset)}
                                >
                                  <Plus className="mr-1 h-3.5 w-3.5" /> Onboard to Fleet
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Active Vehicle Models Table */}
          <div className="mt-8">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Vehicle Models ({models.length})</CardTitle>
                  <CardDescription>
                    Models attached to groups. Deactivating a model hides it from new customer quotes without touching existing bookings.
                  </CardDescription>
                </div>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                  <Input
                    placeholder="Search active models…"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TRow>
                      <TH>Model & Vehicle</TH>
                      <TH>Group</TH>
                      <TH className="text-center">Seats</TH>
                      <TH className="text-center">Luggage</TH>
                      <TH className="text-center">Order</TH>
                      <TH className="text-center">Status</TH>
                      {canEdit && <TH className="text-right">Action</TH>}
                    </TRow>
                  </THead>
                  <TBody>
                    {filteredModels.map((m, i) => (
                      <motion.tr
                        key={m.id}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.02, duration: 0.2 }}
                        className={cn(
                          "transition-colors hover:bg-gold-wash/50",
                          !m.is_active && "opacity-50"
                        )}
                      >
                        <TD>
                          <div className="flex items-center gap-3">
                            {/* Vehicle photo thumbnail with fallback */}
                            <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-hairline bg-surface-alt">
                              {m.image_url ? (
                                <img
                                  src={m.image_url}
                                  alt={m.display_name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Car className="h-4 w-4 text-ink-faint" />
                              )}
                            </div>
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
        description="Configure vehicle details, seat capacity, catalog order, and vehicle photography."
        className="sm:max-w-xl"
      >
        <form onSubmit={handleSaveModel} className="space-y-4">
          {modelError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{modelError}</span>
            </div>
          )}

          {/* Preset auto-fill selector */}
          {!editingModel && (
            <div className="rounded-md border border-gold/30 bg-gold-wash/30 p-3">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Quick Template Auto-Fill (Optional)
              </label>
              <select
                className="w-full rounded-md border border-hairline bg-surface p-2 text-xs text-ink focus:outline-gold"
                defaultValue=""
                onChange={(e) => handleSelectTemplate(e.target.value)}
              >
                <option value="">-- Choose from Fleet Catalog Presets --</option>
                {FLEET_PRESETS.map((p) => (
                  <option key={p.display_name} value={p.display_name}>
                    {p.display_name} ({p.make} {p.model_name}) • {p.vehicle_group_code.toUpperCase()} • {p.passenger_capacity} seats
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-ink-soft">
                Selecting a preset will populate make, model, seat capacity, and high-resolution photo.
              </p>
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
                placeholder="e.g. Maruti, Toyota, Force"
                value={modelForm.make}
                required
                onChange={(e) => setModelForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Model Name</label>
              <Input
                placeholder="e.g. Dzire, Crysta, Fortuner"
                value={modelForm.model_name}
                required
                onChange={(e) => setModelForm((f) => ({ ...f, model_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Customer Display Name</label>
            <Input
              placeholder="e.g. Toyota Innova Crysta"
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

          {/* Image Library Selector & Preview */}
          <div className="space-y-2 rounded-md border border-hairline bg-surface-alt/40 p-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <ImageIcon className="h-3.5 w-3.5 text-gold" /> Vehicle Photo Asset
              </label>
              {modelForm.image_url && !imagePreviewError && (
                <span className="text-[11px] text-success">✓ Image linked</span>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-ink-soft">
                Select from Fleet Asset Library:
              </label>
              <select
                className="w-full rounded-md border border-hairline bg-surface p-2 text-xs text-ink focus:outline-gold"
                value={modelForm.image_url}
                onChange={(e) => {
                  setImagePreviewError(false);
                  setModelForm((f) => ({ ...f, image_url: e.target.value }));
                }}
              >
                <option value="">-- Choose High-Res Fleet Image --</option>
                {FLEET_IMAGE_OPTIONS.map((img) => (
                  <option key={img.value} value={img.value}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-ink-soft">
                Or enter custom image URL / path:
              </label>
              <Input
                placeholder="/assets/fleet/... or https://..."
                value={modelForm.image_url}
                onChange={(e) => {
                  setImagePreviewError(false);
                  setModelForm((f) => ({ ...f, image_url: e.target.value }));
                }}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Live Image Preview */}
            <div className="mt-2">
              <label className="mb-1 block text-[11px] text-ink-soft">Live Photo Preview:</label>
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-md border border-hairline bg-surface">
                {modelForm.image_url && !imagePreviewError ? (
                  <img
                    src={modelForm.image_url}
                    alt="Vehicle preview"
                    className="h-full w-full object-cover"
                    onError={() => setImagePreviewError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-ink-faint">
                    <Car className="mb-1 h-8 w-8" />
                    <span className="text-xs">
                      {imagePreviewError
                        ? "Could not load image at this path"
                        : "No image selected"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={modelForm.is_active}
              onChange={(e) => setModelForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            <span>Active model (available for selection on customer site)</span>
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
