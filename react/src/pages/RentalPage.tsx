import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Users,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  MapPin,
  RefreshCw,
  PhoneCall,
  Clock,
  Sparkles,
} from "lucide-react";
import { fetchPublishedCatalog, getApiBaseUrl } from "../services/cleanFareApi";
import type { PublishedCatalogResponse, VehicleGroupCode } from "../contracts/fare-system";
import "../styles/rental.css";

interface FormState {
  name: string;
  phone: string;
  email: string;
  vehicleGroupCode: VehicleGroupCode;
  vehicleModelId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  destinationOrItinerary: string;
  passengers: string;
  withDriver: boolean;
  note: string;
  website: string;
}

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  vehicleGroupCode: "sedan",
  vehicleModelId: "",
  pickupDate: "",
  returnDate: "",
  pickupLocation: "",
  destinationOrItinerary: "",
  passengers: "",
  withDriver: true,
  note: "",
  website: "",
};

function getVehicleFallbackImage(groupCode: string, modelName?: string): string {
  const name = (modelName || "").toLowerCase();
  if (name.includes("urbania")) return "/assets/fleet/urbania.webp";
  if (name.includes("ertiga")) return "/assets/fleet/ertiga.webp";
  if (name.includes("innova")) return "/assets/fleet/innova.webp";
  if (name.includes("dzire") || name.includes("city")) return "/assets/fleet/sedan.webp";
  if (name.includes("traveller")) return "/assets/fleet/tempo.webp";
  switch (groupCode) {
    case "sedan":
      return "/assets/fleet/sedan.webp";
    case "suv":
      return "/assets/fleet/innova.webp";
    case "luxury":
      return "/assets/fleet/urbania.webp";
    case "tempo_traveller":
      return "/assets/fleet/tempo.webp";
    default:
      return "/assets/fleet/sedan.webp";
  }
}

export function RentalPage({ language = "en" }: { language?: string }) {
  const isHi = language === "hi";

  const [catalog, setCatalog] = useState<PublishedCatalogResponse | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedGroupCode, setSelectedGroupCode] = useState<VehicleGroupCode>("sedan");
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    ref: string;
    phone: string;
    groupName: string;
    modelName: string;
    pickupDate: string;
    returnDate: string;
    pickupLocation: string;
  } | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const data = await fetchPublishedCatalog();
      setCatalog(data);
      if (data.groups && data.groups.length > 0) {
        const firstGroup = data.groups[0]!.group_code;
        setSelectedGroupCode((curr) => curr || firstGroup);
        setForm((prev) => ({ ...prev, vehicleGroupCode: prev.vehicleGroupCode || firstGroup }));
      }
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : isHi ? "कैटलॉग लोड करने में समस्या आई।" : "Unable to load vehicle catalogue."
      );
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  // Filter models belonging to active groups
  const activeGroups = useMemo(() => {
    if (!catalog?.groups) return [];
    return [...catalog.groups].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [catalog]);

  const allVehicles = useMemo(() => catalog?.vehicles || [], [catalog]);

  const modelsInSelectedGroup = useMemo(() => {
    return allVehicles.filter((v) => v.group_code === selectedGroupCode);
  }, [allVehicles, selectedGroupCode]);

  const modelsInFormGroup = useMemo(() => {
    return allVehicles.filter((v) => v.group_code === form.vehicleGroupCode);
  }, [allVehicles, form.vehicleGroupCode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "vehicleGroupCode") {
        // If group changed and previous model is not in new group, reset model to 'Any'
        const stillValid = allVehicles.some((v) => v.id === next.vehicleModelId && v.group_code === value);
        if (!stillValid) {
          next.vehicleModelId = "";
        }
        setSelectedGroupCode(value as VehicleGroupCode);
      }
      return next;
    });
  }

  function handleSelectModel(modelId: string, groupCode: VehicleGroupCode) {
    setForm((current) => ({
      ...current,
      vehicleGroupCode: groupCode,
      vehicleModelId: modelId,
    }));
    setSelectedGroupCode(groupCode);

    // Smoothly scroll to the enquiry form
    const formElement = document.getElementById("rental-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      return setError(isHi ? "कृपया अपना नाम दर्ज करें।" : "Please enter your full name.");
    }

    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return setError(isHi ? "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।" : "Please enter a valid 10-digit Indian mobile number.");
    }

    if (!form.pickupDate || !form.returnDate || form.returnDate < form.pickupDate) {
      return setError(
        isHi
          ? "वापसी की तारीख पिकअप तारीख के समान या उसके बाद होनी चाहिए।"
          : "Please choose a return date on or after your pickup date."
      );
    }

    if (!form.pickupLocation.trim()) {
      return setError(isHi ? "कृपया पिकअप स्थान दर्ज करें।" : "Please provide your pickup location.");
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: cleanPhone,
        email: form.email.trim() || undefined,
        vehicleGroupCode: form.vehicleGroupCode,
        vehicleModelId: form.vehicleModelId ? form.vehicleModelId : undefined,
        pickupDate: form.pickupDate,
        returnDate: form.returnDate,
        pickupLocation: form.pickupLocation.trim(),
        destinationOrItinerary: form.destinationOrItinerary.trim() || undefined,
        passengers: form.passengers ? Number(form.passengers) : undefined,
        withDriver: form.withDriver,
        note: form.note.trim() || undefined,
        website: form.website || undefined,
      };

      const response = await fetch(`${getApiBaseUrl()}/api/v1/rental-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error?.message || json?.message || (isHi ? "अनुरोध भेजने में असमर्थ। कृपया पुनः प्रयास करें।" : "We couldn't submit your enquiry. Please try again.")
        );
      }

      const activeGroupObj = activeGroups.find((g) => g.group_code === form.vehicleGroupCode);
      const activeModelObj = allVehicles.find((v) => v.id === form.vehicleModelId);

      setConfirmation({
        ref: json.data?.ref || "RNT-CONFIRMED",
        phone: json.data?.phone || `+91 ${cleanPhone}`,
        groupName: activeGroupObj?.name || form.vehicleGroupCode,
        modelName: activeModelObj?.display_name || (isHi ? "समूह का कोई भी उपयुक्त वाहन" : "Any suitable model in group"),
        pickupDate: form.pickupDate,
        returnDate: form.returnDate,
        pickupLocation: form.pickupLocation,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : isHi ? "अनुरोध भेजने में असमर्थ। कृपया पुनः प्रयास करें।" : "We couldn't submit your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="rental-page" id="main-content">
      {/* 1. Hero Section */}
      <section className="rental-hero">
        <div className="rental-hero-container">
          <p className="rental-eyebrow">
            <Sparkles className="w-3.5 h-3.5" />
            {isHi ? "आगरा एसके बघेल टूर एंड ट्रैवल्स · सत्यापित फ्लीट" : "Agra SK Baghel Tour & Travels · Verified Fleet & Chauffeurs"}
          </p>
          <h1>{isHi ? "अपनी यात्रा के लिए सही वाहन चुनें" : "Find the Right Vehicle for Your Journey"}</h1>
          <p className="rental-hero-lead">
            {isHi
              ? "आगरा और आउटस्टेशन यात्राओं के लिए हमारी सेडान, एसयूवी, लक्जरी और टेम्पो ट्रैवलर फ्लीट में से चुनें। सीधे कॉल द्वारा सत्यापित कोटेशन और समर्पित ड्राइवर सेवा।"
              : "Explore our canonical fleet of well-maintained sedans, SUVs, luxury cars, and Tempo Travellers in Agra. Call-first transparent rental quotes with dedicated commercial chauffeurs."}
          </p>
          <div className="rental-hero-badges">
            <span className="rental-pill">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              {isHi ? "सत्यापित वाणिज्यिक चालक" : "Verified Commercial Chauffeurs"}
            </span>
            <span className="rental-pill">
              <Clock className="w-4 h-4 text-amber-700" />
              {isHi ? "पारदर्शी कॉल पुष्टिकरण" : "Transparent Phone Confirmation"}
            </span>
            <span className="rental-pill">
              <MapPin className="w-4 h-4 text-rose-700" />
              {isHi ? "आगरा, होटल व एयरपोर्ट पिकअप" : "Agra Cantt, Hotels & Airport Pickup"}
            </span>
          </div>
          <a className="rental-hero-cta" href="#rental-form">
            {isHi ? "रेंटल कोटेशन का अनुरोध करें" : "Request a Rental Quote"}
          </a>
        </div>
      </section>

      <div className="rental-container">
        {/* 2. Vehicle Groups Navigation */}
        <section className="rental-groups-section" aria-labelledby="groups-heading">
          <div className="section-header">
            <h2 id="groups-heading">{isHi ? "वाहन श्रेणियां" : "Vehicle Categories"}</h2>
            <p>
              {isHi
                ? "अपनी आवश्यकता के अनुसार श्रेणी चुनें और उपलब्ध मॉडल देखें।"
                : "Select a canonical vehicle group to view available models."}
            </p>
          </div>

          {loadingCatalog ? (
            <div className="rental-tabs-nav" aria-label="Loading vehicle groups">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rental-tab-btn opacity-60">
                  <span>Loading category…</span>
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <div className="rental-state-card" role="alert">
              <h3>{isHi ? "फ्लीट डेटा लोड नहीं हो सका" : "Unable to load vehicle groups"}</h3>
              <p>{catalogError}</p>
              <button onClick={() => void loadCatalog()} className="btn-card-select" style={{ maxWidth: "200px", margin: "0 auto" }}>
                <RefreshCw className="w-4 h-4 mr-2" /> {isHi ? "पुनः प्रयास करें" : "Retry"}
              </button>
            </div>
          ) : (
            <div className="rental-tabs-nav" role="tablist" aria-label="Vehicle Groups">
              {activeGroups.map((group) => {
                const count = allVehicles.filter((v) => v.group_code === group.group_code).length;
                const isSelected = selectedGroupCode === group.group_code;
                return (
                  <button
                    key={group.group_code}
                    role="tab"
                    id={`tab-${group.group_code}`}
                    aria-selected={isSelected}
                    aria-controls={`panel-${group.group_code}`}
                    className={`rental-tab-btn ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setSelectedGroupCode(group.group_code);
                    }}
                  >
                    <span>{group.name}</span>
                    <span className="tab-count-badge" aria-label={`${count} available models`}>
                      {count} {count === 1 ? (isHi ? "मॉडल" : "model") : (isHi ? "मॉडल" : "models")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Model Showroom */}
        <section
          className="rental-showroom"
          id={`panel-${selectedGroupCode}`}
          role="tabpanel"
          aria-labelledby={`tab-${selectedGroupCode}`}
        >
          {loadingCatalog ? (
            <div className="skeleton-showroom" aria-label="Loading vehicle models">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card" />
              ))}
            </div>
          ) : modelsInSelectedGroup.length === 0 ? (
            <div className="rental-state-card">
              <h3>{isHi ? "इस श्रेणी में कोई वाहन उपलब्ध नहीं है" : "No vehicles currently listed in this category"}</h3>
              <p>
                {isHi
                  ? "कृपया अन्य श्रेणी चुनें या सीधे पूछताछ फॉर्म भरें।"
                  : "Please select another category or complete the enquiry form below."}
              </p>
            </div>
          ) : (
            <div className="rental-showroom-grid">
              {modelsInSelectedGroup.map((vehicle) => {
                const isSelected = form.vehicleModelId === vehicle.id;
                const activeGroup = activeGroups.find((g) => g.group_code === vehicle.group_code);
                const fallbackImg = getVehicleFallbackImage(vehicle.group_code, vehicle.model_name);

                return (
                  <article
                    key={vehicle.id}
                    className={`rental-vehicle-card ${isSelected ? "is-selected" : ""}`}
                  >
                    <div className="rental-card-media">
                      <img
                        src={vehicle.image_url || fallbackImg}
                        alt={`${vehicle.display_name} rental taxi in Agra`}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== fallbackImg) {
                            target.src = fallbackImg;
                          }
                        }}
                      />
                      {isSelected && (
                        <span className="selected-badge-pill">
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                          {isHi ? "चयनित" : "Selected"}
                        </span>
                      )}
                    </div>

                    <div className="rental-card-body">
                      <div className="card-header-row">
                        <span className="rental-group-tag">{activeGroup?.name || vehicle.group_code}</span>
                      </div>

                      <h3>{vehicle.display_name}</h3>

                      <div className="rental-specs-row">
                        <span className="spec-item" title={`${vehicle.passenger_capacity} Passenger Capacity`}>
                          <Users className="spec-icon" />
                          <strong>{vehicle.passenger_capacity}</strong> {isHi ? "सवारी" : "Seats"}
                        </span>
                        {vehicle.luggage_capacity !== null && vehicle.luggage_capacity > 0 && (
                          <span className="spec-item" title={`${vehicle.luggage_capacity} Luggage Bags`}>
                            <Briefcase className="spec-icon" />
                            <strong>{vehicle.luggage_capacity}</strong> {isHi ? "बैग" : "Bags"}
                          </span>
                        )}
                      </div>

                      <div className="rental-rate-banner">
                        <p>
                          <strong>{isHi ? "कॉल पर अंतिम कोटेशन" : "Custom quote confirmed on call"}</strong> ·{" "}
                          {isHi
                            ? "हमारी टीम आपकी तिथियों और दूरी के अनुसार उचित दर तय करती है।"
                            : "Final rental fare confirmed by our dispatch desk."}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn-card-select"
                        onClick={() => handleSelectModel(vehicle.id, vehicle.group_code)}
                      >
                        {isSelected
                          ? isHi
                            ? "✓ फॉर्म में चयनित"
                            : "✓ Selected in Form"
                          : isHi
                          ? "इस वाहन के लिए अनुरोध करें"
                          : "Rent this vehicle"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Rental Enquiry Form */}
        <section id="rental-form" className="rental-form-section" aria-labelledby="form-heading">
          {confirmation ? (
            <div className="rental-confirmation-card" role="status">
              <div className="confirmation-icon">
                <CheckCircle2 />
              </div>
              <h2 id="form-heading">{isHi ? "अनुरोध प्राप्त हुआ" : "Enquiry Received Successfully"}</h2>
              <p>
                {isHi
                  ? "धन्यवाद! हमारे संचालक श्री बघेल जल्द ही आपके विवरण की पुष्टि के लिए आपसे संपर्क करेंगे।"
                  : "Thank you! Our dispatch desk will call you shortly to confirm availability and provide your complete fare."}
              </p>

              <div className="confirmation-ref-box">
                {isHi ? "संदर्भ संख्या:" : "Reference:"} {confirmation.ref}
              </div>

              <dl className="confirmation-details-list">
                <dt>{isHi ? "वाहन वरीयता" : "Vehicle Selection"}</dt>
                <dd>{confirmation.groupName} — {confirmation.modelName}</dd>

                <dt>{isHi ? "संपर्क नंबर" : "Phone"}</dt>
                <dd>{confirmation.phone}</dd>

                <dt>{isHi ? "यात्रा तिथियां" : "Rental Dates"}</dt>
                <dd>{confirmation.pickupDate} → {confirmation.returnDate}</dd>

                <dt>{isHi ? "पिकअप स्थान" : "Pickup Location"}</dt>
                <dd>{confirmation.pickupLocation}</dd>
              </dl>

              <button
                type="button"
                className="btn-submit-enquiry"
                style={{ maxWidth: "300px", margin: "0 auto" }}
                onClick={() => {
                  setConfirmation(null);
                  setForm(initialForm);
                }}
              >
                {isHi ? "एक और अनुरोध भेजें" : "Send Another Enquiry"}
              </button>
            </div>
          ) : (
            <div className="rental-form-card">
              <div className="rental-form-header">
                <p className="rental-eyebrow">
                  <PhoneCall className="w-3.5 h-3.5" />
                  {isHi ? "कॉल-प्रथम रेंटल सेवा" : "Call-First Taxi Rental Enquiry"}
                </p>
                <h2 id="form-heading">{isHi ? "रेंटल कोटेशन का अनुरोध करें" : "Request Your Rental Quote"}</h2>
                <p>
                  {isHi
                    ? "अपनी यात्रा तिथियां, पिकअप स्थान और वाहन वरीयता साझा करें। हमारी टीम उपलब्धता और पूर्ण किराया फोन पर स्पष्ट करेगी।"
                    : "Share your travel schedule and preferred vehicle. Our dispatch manager will call you to confirm real-time availability and your all-inclusive rental quote."}
                </p>
              </div>

              <form onSubmit={submit} noValidate>
                {/* Fieldset 1: Customer Info */}
                <fieldset className="form-fieldset">
                  <legend className="fieldset-legend">
                    <span className="fieldset-number">1</span>
                    {isHi ? "संपर्क विवरण" : "Contact Details"}
                  </legend>
                  <div className="form-grid-2col">
                    <div className="form-field">
                      <label htmlFor="customer-name">
                        {isHi ? "पूरा नाम" : "Full Name"} *
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder={isHi ? "जैसे: राहुल शर्मा" : "e.g. Rahul Sharma"}
                        required
                        minLength={2}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="customer-phone">
                        {isHi ? "मोबाइल नंबर" : "Mobile Number"} *
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="10-digit mobile number"
                        required
                      />
                      <span className="field-hint">
                        {isHi ? "हमारे संचालक इसी नंबर पर कॉल करेंगे" : "Our team calls this number to confirm the quote"}
                      </span>
                    </div>

                    <div className="form-field full">
                      <label htmlFor="customer-email">
                        {isHi ? "ईमेल" : "Email Address"} <span className="optional">({isHi ? "वैकल्पिक" : "optional"})</span>
                      </label>
                      <input
                        id="customer-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="yourname@example.com"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Fieldset 2: Vehicle Preference */}
                <fieldset className="form-fieldset">
                  <legend className="fieldset-legend">
                    <span className="fieldset-number">2</span>
                    {isHi ? "वाहन वरीयता" : "Vehicle Preference"}
                  </legend>
                  <div className="form-grid-2col">
                    <div className="form-field">
                      <label htmlFor="vehicle-group">
                        {isHi ? "वाहन श्रेणी" : "Vehicle Group"} *
                      </label>
                      <select
                        id="vehicle-group"
                        value={form.vehicleGroupCode}
                        onChange={(e) => update("vehicleGroupCode", e.target.value as VehicleGroupCode)}
                      >
                        {activeGroups.map((g) => (
                          <option key={g.group_code} value={g.group_code}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="vehicle-model">
                        {isHi ? "विशिष्ट मॉडल" : "Specific Vehicle Model"}
                      </label>
                      <select
                        id="vehicle-model"
                        value={form.vehicleModelId}
                        onChange={(e) => update("vehicleModelId", e.target.value)}
                      >
                        <option value="">
                          {isHi ? "इस समूह का कोई भी उपयुक्त वाहन" : "Any suitable model in this group"}
                        </option>
                        {modelsInFormGroup.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.display_name} ({v.passenger_capacity} seats)
                          </option>
                        ))}
                      </select>
                      <span className="field-hint">
                        {isHi ? "आवश्यकतानुसार विशिष्ट मॉडल चुनें या लचीला विकल्प रखें" : "Choose a specific car or leave flexible"}
                      </span>
                    </div>
                  </div>
                </fieldset>

                {/* Fieldset 3: Dates & Itinerary */}
                <fieldset className="form-fieldset">
                  <legend className="fieldset-legend">
                    <span className="fieldset-number">3</span>
                    {isHi ? "तिथियां और यात्रा कार्यक्रम" : "Rental Dates & Itinerary"}
                  </legend>
                  <div className="form-grid-2col">
                    <div className="form-field">
                      <label htmlFor="pickup-date">
                        {isHi ? "पिकअप तिथि" : "Pickup Date"} *
                      </label>
                      <input
                        id="pickup-date"
                        type="date"
                        min={today}
                        value={form.pickupDate}
                        onChange={(e) => update("pickupDate", e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="return-date">
                        {isHi ? "वापसी तिथि" : "Return Date"} *
                      </label>
                      <input
                        id="return-date"
                        type="date"
                        min={form.pickupDate || today}
                        value={form.returnDate}
                        onChange={(e) => update("returnDate", e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="pickup-location">
                        {isHi ? "पिकअप स्थान" : "Pickup Location in Agra"} *
                      </label>
                      <input
                        id="pickup-location"
                        type="text"
                        value={form.pickupLocation}
                        onChange={(e) => update("pickupLocation", e.target.value)}
                        placeholder={isHi ? "जैसे: आगरा कैंट, ताजगंज होटल या आवास" : "e.g. Agra Cantt, Hotel in Taj Ganj, or Airport"}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="destination">
                        {isHi ? "गंतव्य / यात्रा कार्यक्रम" : "Destination or Itinerary"} <span className="optional">({isHi ? "वैकल्पिक" : "optional"})</span>
                      </label>
                      <input
                        id="destination"
                        type="text"
                        value={form.destinationOrItinerary}
                        onChange={(e) => update("destinationOrItinerary", e.target.value)}
                        placeholder={isHi ? "जैसे: आगरा लोकल, मथुरा-वृंदावन या दिल्ली" : "e.g. Agra local darshan, Mathura-Vrindavan, Jaipur"}
                      />
                    </div>

                    <div className="form-field full">
                      <label htmlFor="passengers-count">
                        {isHi ? "सवारियों की संख्या" : "Number of Passengers"} <span className="optional">({isHi ? "वैकल्पिक" : "optional"})</span>
                      </label>
                      <input
                        id="passengers-count"
                        type="number"
                        min={1}
                        max={50}
                        value={form.passengers}
                        onChange={(e) => update("passengers", e.target.value)}
                        placeholder={isHi ? "जैसे: 4" : "e.g. 4"}
                      />
                    </div>

                    <div className="form-field full">
                      <div className="checkbox-row">
                        <input
                          id="with-driver"
                          type="checkbox"
                          checked={form.withDriver}
                          onChange={(e) => update("withDriver", e.target.checked)}
                        />
                        <div className="checkbox-text">
                          <label htmlFor="with-driver">
                            <strong>{isHi ? "समर्पित चालक के साथ" : "With Verified Chauffeur"}</strong>
                          </label>
                          <span>
                            {isHi
                              ? "हमारी सभी टैक्सियां अनुभवी और सत्यापित ड्राइवरों द्वारा संचालित की जाती हैं।"
                              : "All our rental vehicles include an experienced, verified local commercial chauffeur."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-field full">
                      <label htmlFor="customer-note">
                        {isHi ? "विशेष निर्देश या आवश्यकताएं" : "Additional Notes or Special Requirements"} <span className="optional">({isHi ? "वैकल्पिक" : "optional"})</span>
                      </label>
                      <textarea
                        id="customer-note"
                        rows={3}
                        value={form.note}
                        onChange={(e) => update("note", e.target.value)}
                        placeholder={isHi ? "सामान, पिकअप समय या विशेष अनुरोध यहां लिखें..." : "Luggage details, flight/train numbers, or special timing..."}
                      />
                    </div>

                    {/* Anti-spam honeypot */}
                    <div className="honeypot-field" aria-hidden="true">
                      <label htmlFor="website-field">Website</label>
                      <input
                        id="website-field"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(e) => update("website", e.target.value)}
                      />
                    </div>
                  </div>
                </fieldset>

                {error && (
                  <div className="form-error-banner" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-submit-enquiry" disabled={submitting}>
                  {submitting
                    ? isHi
                      ? "अनुरोध भेजा जा रहा है…"
                      : "Sending Enquiry…"
                    : isHi
                    ? "रेंटल कोटेशन का अनुरोध करें"
                    : "Request My Rental Quote"}
                </button>

                <p className="form-disclaimer">
                  {isHi
                    ? "नोट: फॉर्म सबमिट करने से वाहन सीधे बुक नहीं होता है। हमारे प्रबंधक उपलब्धता की पुष्टि और अंतिम कोटेशन के लिए आपको कॉल करेंगे।"
                    : "Note: Submitting this form creates an enquiry. Vehicle availability and exact quotes are confirmed directly with you by phone."}
                </p>
              </form>
            </div>
          )}
        </section>

        {/* 5. How It Works Section */}
        <section className="rental-how-section" aria-labelledby="how-it-works-heading">
          <div className="section-header text-center" style={{ textAlign: "center" }}>
            <h2 id="how-it-works-heading">{isHi ? "यह कैसे काम करता है" : "How It Works"}</h2>
            <p>
              {isHi
                ? "सरल तीन-चरणीय प्रक्रिया द्वारा आगरा में सुगम टैक्सी रेंटल"
                : "A simple 3-step process to rent a taxi in Agra"}
            </p>
          </div>

          <div className="rental-steps-grid">
            <div className="rental-step-card">
              <span className="step-number">1</span>
              <h3>{isHi ? "वाहन और मॉडल चुनें" : "Choose Vehicle & Model"}</h3>
              <p>
                {isHi
                  ? "अपनी सवारी और सामान के अनुसार उपयुक्त श्रेणी (सेडान, एसयूवी, टेम्पो ट्रैवलर) चुनें।"
                  : "Select a vehicle group and preferred model suited for your party size and luggage."}
              </p>
            </div>

            <div className="rental-step-card">
              <span className="step-number">2</span>
              <h3>{isHi ? "तिथियां और स्थान साझा करें" : "Share Dates & Route"}</h3>
              <p>
                {isHi
                  ? "अपनी यात्रा तिथियां, पिकअप बिंदु और गंतव्य बताएं ताकि हम उचित योजना बना सकें।"
                  : "Tell us your pickup location, rental dates, and travel itinerary so we can plan accurately."}
              </p>
            </div>

            <div className="rental-step-card">
              <span className="step-number">3</span>
              <h3>{isHi ? "कॉल पर पुष्टि और यात्रा" : "Phone Confirmation & Quote"}</h3>
              <p>
                {isHi
                  ? "हमारे संचालक सीधे कॉल करके वास्तविक उपलब्धता और संपूर्ण किराया स्पष्ट करेंगे।"
                  : "Our team contacts you directly to confirm real-time availability and provide your complete quote."}
              </p>
            </div>
          </div>
        </section>

        {/* 6. Trust & FAQ Section */}
        <section className="rental-faq-section" aria-labelledby="faq-heading">
          <div className="section-header">
            <h2 id="faq-heading">{isHi ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}</h2>
            <p>
              {isHi
                ? "टैक्सी रेंटल और कोटेशन प्रक्रिया के बारे में स्पष्ट जानकारी।"
                : "Helpful details on how rental availability and quotes are managed."}
            </p>
          </div>

          <div className="faq-grid">
            <div className="faq-item-card">
              <h3>{isHi ? "क्या ऑनलाइन भुगतान अनिवार्य है?" : "Is online payment required to submit an enquiry?"}</h3>
              <p>
                {isHi
                  ? "नहीं। यह कॉल-प्रथम पूछताछ सेवा है। हमारे संचालक फोन पर उपलब्धता और किराया स्पष्ट करते हैं।"
                  : "No. This is a call-first enquiry workflow. Availability and quotes are confirmed directly with you by phone before any booking is finalized."}
              </p>
            </div>

            <div className="faq-item-card">
              <h3>{isHi ? "क्या मैं विशिष्ट वाहन मॉडल मांग सकता हूँ?" : "Can I request a specific car model like Innova Crysta or Dzire?"}</h3>
              <p>
                {isHi
                  ? "हाँ, आप विशिष्ट मॉडल चुन सकते हैं या समूह में लचीला विकल्प छोड़ सकते हैं।"
                  : "Yes. You can select a specific model from the dropdown or choose flexible assignment within that group."}
              </p>
            </div>

            <div className="faq-item-card">
              <h3>{isHi ? "क्या ड्राइवर शामिल है?" : "Are rental vehicles chauffeur-driven?"}</h3>
              <p>
                {isHi
                  ? "हाँ, हमारी सभी गाड़ियां आगरा और राजमार्ग मार्गों के अनुभवी चालकों के साथ आती हैं।"
                  : "Yes. All our vehicles come with experienced, verified commercial chauffeurs for a safe and comfortable journey."}
              </p>
            </div>

            <div className="faq-item-card">
              <h3>{isHi ? "पिकअप कहाँ से किया जा सकता है?" : "Where can I be picked up?"}</h3>
              <p>
                {isHi
                  ? "आगरा कैंट, आगरा फोर्ट स्टेशन, खेरिया एयरपोर्ट, ताजगंज होटल या आपके निवास से।"
                  : "We provide doorstep pickups across Agra including Agra Cantt Railway Station, Kheria Airport, local hotels, or residences."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RentalPage;
