/**
 * ContactCard — Architectural Contact Card Section (Phase R5.9)
 *
 * Architecture & Features:
 * - Architectural bento card with 4-corner plus cross markers (rotating 90° on card hover)
 * - Left column (1.3fr):
 *   - Fraunces display header with Taj Ganj dispatch desk description
 *   - 2-column contact tiles grid for Call (+91 97628 17598), WhatsApp, Email, and Google Maps
 *   - Full-width availability tile (24×7 Active Dispatch • Near Taj East Gate Rd)
 * - Right column (1fr):
 *   - Interactive inquiry form with name, phone, and trip details
 *   - Field validation with animated error shake state
 *   - Working submission state with floating feedback toast and in-card confirmation
 * - Solar Dusk dark mode adaptation and mobile responsive single-column collapse
 * - Reduced-motion safety with zero layout reflows
 */

import React, { useState } from "react";
import { contact } from "../../data/contact";
import { createInquiry, formatInquiryPhone, sanitizeInquiryName } from "../../services/api";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

export function ContactCard() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState<{
    name?: boolean;
    phone?: boolean;
    message?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = true;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      newErrors.phone = true;
    }
    if (!formData.message.trim() || formData.message.trim().length < 3) {
      newErrors.message = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedName = sanitizeInquiryName(formData.name);
      const sanitizedPhone = formatInquiryPhone(formData.phone);
      const rawMsg = formData.message.trim();
      const message = rawMsg.length >= 10
        ? rawMsg.slice(0, 2000)
        : `Website inquiry from ${sanitizedName}: ${rawMsg}`.slice(0, 2000);

      await createInquiry({
        name: sanitizedName,
        phone: sanitizedPhone,
        message,
        tripInterest: "Direct contact inquiry",
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      const successMsg = `Thank you, ${formData.name.trim()}! Your inquiry has been received. Our 24×7 dispatch desk will contact you at ${formData.phone.trim()} shortly.`;
      setToast({
        show: true,
        message: successMsg,
      });

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } catch (err: any) {
      setIsSubmitting(false);
      setToast({
        show: true,
        message: `Failed to submit inquiry: ${err?.message || "Please call us directly at +91 97628 17598."}`,
      });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const handleReset = () => {
    setFormData({ name: "", phone: "", message: "" });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <section
      className="home-section contact-section"
      id="contact"
      aria-labelledby="contact-heading"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start a conversation</p>
            <h2 id="contact-heading">
              Your driver is
              <br />
              <i>a call away.</i>
            </h2>
          </div>
          <a
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            style={{ color: "#ffffff" }}
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Agra SK Baghel Tour and Travels on WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
            <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp Desk ↗</span>
          </a>
        </div>

        <div className="contact-card-wrap">
          <div className="contact-card">
            {/* 4 Distinctive Architectural Corner Plus Markers */}
            <svg
              className="corner-plus corner-plus--tl"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <svg
              className="corner-plus corner-plus--tr"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <svg
              className="corner-plus corner-plus--bl"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <svg
              className="corner-plus corner-plus--br"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>

            {/* Left Info Column */}
            <div className="contact-card-info">
              <div className="contact-card-header">
                <h3 className="contact-card-title">
                  Direct Inquiries &amp; 24×7 Dispatch
                </h3>
                <p className="contact-card-desc">
                  Headquartered in Taj Ganj beside the Taj Mahal. Dedicated 24×7
                  dispatch desk for airport drops, outstation cabs, and custom
                  sightseeing across North India.
                </p>
              </div>

              <div className="contact-tiles-grid" role="list">
                {/* Tile 1: Phone */}
                <a
                  className="contact-tile"
                  href={`tel:${contact.phone}`}
                  aria-label={`Call direct: ${contact.phoneDisplay}`}
                  role="listitem"
                >
                  <div className="contact-tile-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="20"
                      height="20"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <span className="contact-tile-label">Call 24×7</span>
                    <span className="contact-tile-value">
                      {contact.phoneDisplay}
                    </span>
                  </div>
                </a>

                {/* Tile 2: WhatsApp */}
                <a
                  className="contact-tile"
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Message Agra SK Baghel Tour and Travels on WhatsApp"
                  role="listitem"
                >
                  <div className="contact-tile-icon" aria-hidden="true">
                    <WhatsAppIcon className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <span className="contact-tile-label">WhatsApp</span>
                    <span className="contact-tile-value">Chat on WhatsApp ↗</span>
                  </div>
                </a>

                {/* Tile 3: Email */}
                <a
                  className="contact-tile"
                  href={`mailto:${contact.email}`}
                  aria-label={`Email us at ${contact.email}`}
                  role="listitem"
                >
                  <div className="contact-tile-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="20"
                      height="20"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="contact-tile-label">Email Support</span>
                    <span className="contact-tile-value">{contact.email}</span>
                  </div>
                </a>

                {/* Tile 4: Office Location & Map */}
                <a
                  className="contact-tile"
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Google Maps directions to Taj Ganj, Agra"
                  role="listitem"
                >
                  <div className="contact-tile-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="20"
                      height="20"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <span className="contact-tile-label">Office &amp; Garage</span>
                    <span className="contact-tile-value">Taj Ganj, Agra ↗</span>
                  </div>
                </a>

                {/* Tile 5: Availability (Full Width) */}
                <div className="contact-tile col-span-full" role="listitem">
                  <div className="contact-tile-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="20"
                      height="20"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <span className="contact-tile-label">
                      Availability / Dispatch
                    </span>
                    <span className="contact-tile-value">
                      24×7 Active Dispatch • Near Taj East Gate Rd
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inquiry Form */}
            <div className="contact-card-form">
              {isSubmitted ? (
                <div
                  className="contact-success-state"
                  role="status"
                  aria-live="polite"
                >
                  <div className="contact-success-icon" aria-hidden="true">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3>Inquiry Received!</h3>
                  <p>
                    Thank you, <strong>{formData.name}</strong>. Our 24×7 Agra
                    dispatch desk will contact you at{" "}
                    <strong>{formData.phone}</strong> with vehicle options and
                    confirmed pricing shortly.
                  </p>
                  <div className="contact-success-actions">
                    <a
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-title-md text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                      style={{ color: "#ffffff" }}
                      href={`https://wa.me/${contact.whatsapp}?text=Hi%20SK%20Baghel,%20I%20just%20submitted%20an%20inquiry%20for%20${encodeURIComponent(
                        formData.name
                      )}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                      <span className="text-white" style={{ color: "#ffffff" }}>Chat on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={handleReset}
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  id="contact-form"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Travel Inquiry Form"
                >
                  <div
                    className={`contact-form-group ${
                      errors.name ? "has-error" : ""
                    }`}
                  >
                    <label className="contact-form-label" htmlFor="contact-name">
                      Your Name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      className={`contact-form-input ${
                        errors.name ? "input-error" : ""
                      }`}
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={
                        errors.name ? "name-error" : undefined
                      }
                    />
                    {errors.name && (
                      <span className="field-error" id="name-error">
                        Please enter your name.
                      </span>
                    )}
                  </div>

                  <div
                    className={`contact-form-group ${
                      errors.phone ? "has-error" : ""
                    }`}
                  >
                    <label
                      className="contact-form-label"
                      htmlFor="contact-phone"
                    >
                      Phone Number <span aria-hidden="true">*</span>
                    </label>
                    <input
                      className={`contact-form-input ${
                        errors.phone ? "input-error" : ""
                      }`}
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="e.g. +91 97628 17598"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      aria-invalid={errors.phone ? "true" : "false"}
                      aria-describedby={
                        errors.phone ? "phone-error" : undefined
                      }
                    />
                    {errors.phone && (
                      <span className="field-error" id="phone-error">
                        Please enter a valid phone number.
                      </span>
                    )}
                  </div>

                  <div
                    className={`contact-form-group ${
                      errors.message ? "has-error" : ""
                    }`}
                  >
                    <label
                      className="contact-form-label"
                      htmlFor="contact-message"
                    >
                      Trip Details or Message <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      className={`contact-form-textarea ${
                        errors.message ? "input-error" : ""
                      }`}
                      id="contact-message"
                      name="message"
                      rows={3}
                      placeholder="Travel dates, destination, number of passengers, or vehicle preference..."
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      aria-invalid={errors.message ? "true" : "false"}
                      aria-describedby={
                        errors.message ? "message-error" : undefined
                      }
                    />
                    {errors.message && (
                      <span className="field-error" id="message-error">
                        Please share your travel details or questions.
                      </span>
                    )}
                  </div>

                  <button
                    className="button button-primary contact-form-submit"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <span>Send Inquiry</span>
                        <span aria-hidden="true">↗</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Feedback Toast Notification */}
      {toast.show && (
        <div className="contact-toast" role="status" aria-live="polite">
          <div className="contact-toast-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="contact-toast-content">
            <p className="contact-toast-title">Inquiry Received</p>
            <p className="contact-toast-msg">{toast.message}</p>
          </div>
          <button
            type="button"
            className="contact-toast-close"
            onClick={() => setToast({ show: false, message: "" })}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
