import React, { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { createInquiry, formatInquiryPhone, sanitizeInquiryName } from "../services/api";

export interface ContactPageProps {
  language?: SupportedLanguage;
}

const FAQ_ITEMS = [
  {
    q: "How quickly will your dispatch team respond to my booking or inquiry?",
    a: "Our 24×7 Taj Ganj dispatch team responds within 2 to 5 minutes on WhatsApp (+91 97628 17598) or direct phone call. Inquiries submitted via the form are confirmed within 15 minutes with a transparent fare breakdown.",
  },
  {
    q: "Can I book a cab for a 5:00 AM Taj Mahal sunrise tour on short notice?",
    a: "Yes, absolutely. Sunrise Taj Mahal tours are our everyday specialty. We maintain standby chauffeur-driven sedans and MPVs in Taj Ganj and Fatehabad Road hotel areas, ready for 5:00 AM or 5:30 AM pickups.",
  },
  {
    q: "What exact information is required to confirm my outstation trip?",
    a: "To confirm, we only need: (1) Pickup date and exact time, (2) Pickup address or hotel name in Agra/Delhi, (3) Drop destination, (4) Passenger count, and (5) Preferred car tier. No complicated registrations required.",
  },
  {
    q: "Is there any waiting penalty if my train or flight is delayed?",
    a: "No. When you provide your train number (e.g., Gatimaan Express, Shatabdi at Agra Cantt) or flight number (at Delhi IGI Airport), our dispatch team tracks real-time arrivals. Chauffeurs wait at the exit gate with zero delay penalty.",
  },
  {
    q: "Do you issue official booking receipts for corporate expense claims?",
    a: "Yes. Every booking includes a verified booking receipt tax invoice ( ) with itemized kilometer logs, expressway tolls, and state passenger permits.",
  },
];

export function ContactPage({ language = "en" }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceType: "outstation-oneway",
    vehiclePreference: "sedan",
    tripDate: "",
    tripTime: "",
    pickupLocation: "",
    notes: "",
    companyReceiptRequested: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const sanitizedName = sanitizeInquiryName(formData.name);
      const formattedPhone = formatInquiryPhone(formData.phone);
      const rawNotes = formData.notes.trim();
      const message = `Service: ${formData.serviceType} | Vehicle: ${formData.vehiclePreference} | Date: ${formData.tripDate || "Flexible"} ${formData.tripTime || ""} | Pickup: ${formData.pickupLocation || "Agra"} | Receipt: ${formData.companyReceiptRequested ? "Yes" : "No"}${rawNotes ? ` | Notes: ${rawNotes}` : ""}`;

      await createInquiry({
        name: sanitizedName,
        phone: formattedPhone,
        email: formData.email.trim() || undefined,
        message,
        tripInterest: formData.serviceType,
      });

      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitting(false);
      setSubmitError(err?.message || "Failed to submit inquiry. Please call or WhatsApp us directly.");
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-surface-container-low/70 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold">Contact &amp; 24×7 Dispatch Desk</span>
          </nav>

          <div className="max-w-4xl">

            <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight mb-3">
              Your chauffeur is stationed. We&apos;re a ring away.
            </h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg leading-relaxed mb-4">
              Headquartered directly beside the Taj Mahal in Taj Ganj, Agra. Dedicated round-the-clock dispatch for airport drops,
              outstation cabs across North India, and bespoke heritage tours.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="size-2 rounded-full bg-success-jade animate-pulse shrink-0" />
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                24×7 Active Garage &amp; Dispatch (&lt; 3 mins response)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Direct WhatsApp Travel Desk (+91 97628 17598)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                verified_user
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Official booking receipt Billing &amp; Invoices
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                pin_drop
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Taj Ganj Physical Garage (Near Taj East Gate Rd)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE CONTACT CHANNELS (3 ELEVATED CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        <div>
          <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
            Direct Communication Channels
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
            Immediate Connectivity with Central Fleet Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {/* Card 1: Immediate Call Dispatch (Frosted Glass Bento) */}
          <div className="glass-card-frosted border border-white/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-terracotta-deep text-white font-label-caps text-label-caps px-3 py-1 rounded-bl-2xl uppercase tracking-wider font-semibold shadow-xs">
                Average Pick-up: 2 Rings
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-4 mt-2 shadow-xs">
                <span className="material-symbols-outlined text-2xl">phone_in_talk</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-lg mb-1 font-semibold">Immediate Call Dispatch (24×7)</h3>
              <p className="font-title-lg text-terracotta-sandstone mb-2 font-bold text-base sm:text-lg">+91 97628 17598</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6 text-body-md">
                Immediate taxi allocation, late-night expressway emergencies, 3:00 AM airport pickups, and instant driver
                assignment.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep hover:bg-primary text-white font-label-lg py-3 px-4 rounded-xl transition-all text-center text-xs font-semibold shadow-md active:scale-[0.98]"
              href="tel:+919762817598"
            >
              <span className="material-symbols-outlined text-icon-18">call</span>
              <span>Call Dispatch Now</span>
            </a>
          </div>

          {/* Card 2: WhatsApp Desk (Frosted Glass Bento) */}
          <div className="glass-card-frosted border border-white/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-success-jade text-white font-label-caps text-label-caps px-3 py-1 rounded-bl-2xl uppercase tracking-wider font-semibold shadow-xs">
                Typical Reply: &lt; 5 mins
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-4 mt-2 shadow-md">
                <WhatsAppIcon className="w-6 h-6 shrink-0 text-white" />
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-lg mb-1 font-semibold">
                WhatsApp Desk (Fastest)
              </h3>
              <p className="font-title-lg text-ink-charcoal mb-2 font-bold text-base sm:text-lg">+91 97628 17598</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6 text-body-md">
                Send itinerary details, receive vehicle photos, driver credentials, live location tracking, and instant quote
                cards with UPI advance links.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg py-3 px-4 rounded-xl transition-all text-center text-xs font-semibold shadow-md active:scale-[0.98]"
              style={{ color: "#ffffff" }}
              href="https://wa.me/919762817598"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>Chat on WhatsApp ↗</span>
            </a>
          </div>

          {/* Card 3: Corporate & Tour Desk (Frosted Glass Bento) */}
          <div className="glass-card-frosted border border-white/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-secondary text-white font-label-caps text-label-caps px-3 py-1 rounded-bl-2xl uppercase tracking-wider font-semibold shadow-xs">
                Corporate Rates &amp; booking receipt
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-4 mt-2 shadow-xs">
                <span className="material-symbols-outlined text-2xl">business_center</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-lg mb-1 font-semibold">Corporate &amp; Tour Desk</h3>
              <p className="font-title-md text-ink-charcoal mb-0.5 font-semibold text-xs break-all">
                bookings@agraskbagheltourandtravels.com
              </p>
              <p className="text-on-surface-variant font-body-sm mb-2 text-label-lg break-all">dispatch@agraskbagheltourandtravels.com</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6 text-body-md">
                Multi-day Golden Triangle itineraries, wedding group transit in Tempo Travellers/Urbania, and B2B booking receipt tax
                invoices.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-ink-charcoal font-label-lg py-3 px-4 rounded-xl transition-colors border border-outline-variant text-center text-xs font-semibold"
              href="mailto:bookings@agraskbagheltourandtravels.com"
            >
              <span className="material-symbols-outlined text-icon-18">mail</span>
              <span>Email Itinerary</span>
            </a>
          </div>
        </div>

        {/* Dual-Office Hub Showcase (Phase 24 NAP Alignment) */}
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
              Dual-Hub Physical Locations
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
              Our Dispatch Desk &amp; Commercial Fleet Garage
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-2xl">
              We operate two dedicated facilities in Agra to provide swift chauffeur response times at hotels and ensure rigorous commercial vehicle maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Tourism Dispatch Office */}
            <div className="rounded-3xl border border-white/60 glass-card-frosted p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sandstone-wash text-terracotta-deep font-label-caps text-xs font-bold mb-3 shadow-xs">
                  <span className="material-symbols-outlined text-sm">explore</span>
                  Primary Tourism Dispatch
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-ink-charcoal mb-1">
                  {contact.dispatchOffice.name}
                </h3>
                <p className="text-xs text-primary font-medium mb-3">
                  {contact.dispatchOffice.role}
                </p>
                <p className="text-body-md text-on-surface-variant mb-4">
                  <strong>Address:</strong> {contact.dispatchOffice.address}
                </p>
                <div className="space-y-1.5 text-xs text-on-surface-variant mb-4">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-terracotta-sandstone">schedule</span>
                    <span><strong>Operating Hours:</strong> {contact.dispatchOffice.hours}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-terracotta-sandstone">location_city</span>
                    <span><strong>Landmark:</strong> 450m from Taj Mahal Eastern Gate, Taj Ganj</span>
                  </p>
                </div>
              </div>
              <div>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.dispatchOffice.address)}&output=embed`}
                  title="Map of Primary Tourism Dispatch Office, Taj Ganj, Agra"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-video w-full rounded-2xl border border-white/60 mb-3 shadow-xs"
                />
                <a
                  href={contact.dispatchOffice.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-ink-charcoal font-label-lg text-xs font-semibold py-2 px-3 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">directions</span>
                  <span>Navigate to Taj Ganj Dispatch Desk</span>
                </a>
              </div>
            </div>

            {/* Registered Commercial Fleet Garage */}
            <div className="rounded-3xl border border-white/60 glass-card-frosted p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container text-ink-charcoal font-label-caps text-xs font-bold mb-3 shadow-xs">
                  <span className="material-symbols-outlined text-sm">build</span>
                  Commercial Fleet Garage
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-ink-charcoal mb-1">
                  {contact.registeredGarage.name}
                </h3>
                <p className="text-xs text-secondary font-medium mb-3">
                  {contact.registeredGarage.role}
                </p>
                <p className="text-body-md text-on-surface-variant mb-4">
                  <strong>Address:</strong> {contact.registeredGarage.address}
                </p>
                <div className="space-y-1.5 text-xs text-on-surface-variant mb-4">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-terracotta-sandstone">schedule</span>
                    <span><strong>Operating Hours:</strong> {contact.registeredGarage.hours}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-terracotta-sandstone">local_shipping</span>
                    <span><strong>Facility:</strong> Fleet Maintenance &amp; Commercial Vehicle Yard</span>
                  </p>
                </div>
              </div>
              <div>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.registeredGarage.address)}&output=embed`}
                  title="Map of 1Nandlalpur, Hathras Road, Nagla, Agra"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-video w-full rounded-2xl border border-white/60 mb-3 shadow-xs"
                />
                <a
                  href={contact.registeredGarage.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-ink-charcoal font-label-lg text-xs font-semibold py-2 px-3 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">directions</span>
                  <span>Navigate to Commercial Garage</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DISPATCH INQUIRY & RESERVATION FORM */}
        <div className="max-w-4xl mx-auto glass-card-frosted border border-white/60 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="mb-6">
            <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
              Dispatch Reservation Form
            </span>
            <h2 className="font-headline-md text-headline-sm sm:text-headline-md text-ink-charcoal font-semibold">
              Send Direct Booking Inquiry
            </h2>
            <p className="text-on-surface-variant font-body-sm text-body-md mt-1">
              Submissions persist directly into our central dispatch inbox in Taj Ganj, Agra. Our team reviews vehicle availability and confirms within 15 minutes.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-success-jade/10 border border-success-jade/30 text-ink-charcoal space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-success-jade text-3xl">check_circle</span>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-ink-charcoal">
                    Inquiry Received by Central Dispatch!
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Thank you, {formData.name}. Our 24×7 dispatch desk has logged your request and will contact you at <strong>{formData.phone}</strong> shortly.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`https://wa.me/919762817598?text=${encodeURIComponent(
                    `Hello Agra SK Baghel Tour & Travels, I just submitted an inquiry on your website for ${formData.serviceType} (${formData.name}, ${formData.phone}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-900 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  style={{ color: "#ffffff" }}
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                  <span className="text-white" style={{ color: "#ffffff" }}>Also Notify on WhatsApp ↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      phone: "",
                      email: "",
                      serviceType: "outstation-oneway",
                      vehiclePreference: "sedan",
                      tripDate: "",
                      tripTime: "",
                      pickupLocation: "",
                      notes: "",
                      companyReceiptRequested: false,
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-border-warm text-ink-charcoal hover:bg-sandstone-wash/40 text-xs font-semibold transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-name">
                    Full Name *
                  </label>
                  <input
                    id="inquiry-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-phone">
                    Mobile Number (WhatsApp preferred) *
                  </label>
                  <input
                    id="inquiry-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-email">
                    Email Address (Optional)
                  </label>
                  <input
                    id="inquiry-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-service">
                    Service Category *
                  </label>
                  <select
                    id="inquiry-service"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="outstation-oneway">01 / Outstation One-Way</option>
                    <option value="outstation-roundtrip">01 / Outstation Round-Trip</option>
                    <option value="local-sightseeing">02 / Local Sightseeing (8h / 80km)</option>
                    <option value="airport-transfer">03 / Airport &amp; Station Transfer</option>
                    <option value="tour-package">04 / Signature Tour Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-vehicle">
                    Vehicle Tier
                  </label>
                  <select
                    id="inquiry-vehicle"
                    value={formData.vehiclePreference}
                    onChange={(e) => setFormData({ ...formData, vehiclePreference: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sedan">Sedan (Dzire / Etios · 4 Passengers)</option>
                    <option value="ertiga">Ertiga (6+1 MPV · 6 Passengers)</option>
                    <option value="innova-crysta">Innova Crysta (Plush SUV · 6–7 Passengers)</option>
                    <option value="tempo-traveller">Tempo Traveller (12–17 Seater)</option>
                    <option value="urbania">Force Urbania (Luxury Van)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-date">
                    Travel Date
                  </label>
                  <input
                    id="inquiry-date"
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-time">
                    Preferred Pickup Time
                  </label>
                  <input
                    id="inquiry-time"
                    type="time"
                    value={formData.tripTime}
                    onChange={(e) => setFormData({ ...formData, tripTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-pickup">
                  Pickup Location &amp; Destination Details
                </label>
                <input
                  id="inquiry-pickup"
                  type="text"
                  placeholder="e.g. Hotel ITC Mughal, Agra to Delhi IGI Airport Terminal 3"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-charcoal mb-1" htmlFor="inquiry-notes">
                  Special Requirements / Notes
                </label>
                <textarea
                  id="inquiry-notes"
                  rows={2}
                  placeholder="e.g. Flight arrival at 11:30 AM, need child car seat, extra luggage..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-warm bg-white text-ink-charcoal text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inquiry-receipt"
                  checked={formData.companyReceiptRequested}
                  onChange={(e) => setFormData({ ...formData, companyReceiptRequested: e.target.checked })}
                  className="rounded border-border-warm text-primary focus:ring-primary"
                />
                <label htmlFor="inquiry-receipt" className="text-xs text-on-surface-variant font-medium cursor-pointer">
                  Require official corporate booking receipt tax invoice
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-terracotta-deep hover:bg-primary text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting to Central Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>Submit Dispatch Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="max-w-4xl mx-auto pt-6">
          <div className="text-center mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
              Dispatch Questions
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Dispatch Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-xs sm:text-title-lg font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-icon-18 shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-3 sm:p-3.5 pt-0 text-on-surface-variant font-body-sm text-body-md leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
