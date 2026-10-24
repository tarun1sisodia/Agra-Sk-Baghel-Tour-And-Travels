import { motion, useReducedMotion } from "motion/react";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import "./about-page.css";

interface AboutPageProps {
  language?: "en" | "hi";
}

const SERVICES = [
  {
    number: "01",
    icon: "explore",
    title: "Agra sightseeing",
    description: "Visit Agra's famous landmarks at a pace that suits your day.",
    detail: "Local tours",
  },
  {
    number: "02",
    icon: "flight",
    title: "Airport & station transfers",
    description: "Plan convenient pickups and drop-offs around your travel schedule.",
    detail: "Direct transfers",
  },
  {
    number: "03",
    icon: "route",
    title: "Outstation journeys",
    description: "Travel from Agra to Delhi, Jaipur and destinations across North India.",
    detail: "One-way & round trips",
  },
] as const;

const EXPECTATIONS = [
  {
    icon: "receipt_long",
    title: "Clear trip details",
    description: "Review your route, vehicle choice and quoted fare before confirming.",
  },
  {
    icon: "directions_car",
    title: "Vehicles for your group",
    description: "Choose from cars, SUVs and larger vehicles based on passenger needs.",
  },
  {
    icon: "support_agent",
    title: "A local point of contact",
    description: "Speak directly with the Agra-based travel desk when you need help.",
  },
  {
    icon: "calendar_month",
    title: "Simple booking",
    description: "Share your journey details online or contact the desk on WhatsApp.",
  },
] as const;

export function AboutPage({ language = "en" }: AboutPageProps) {
  const reduceMotion = useReducedMotion();
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed&z=15`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    "Hello Agra SK Baghel Tour and Travels, I would like help planning a trip."
  )}`;

  return (
    <main className="about-refresh" lang={language}>
      <div className="about-refresh__breadcrumb">
        <nav aria-label="Breadcrumb" className="about-refresh__container">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">About Us</span>
        </nav>
      </div>

      <section className="about-refresh__hero">
        <div className="about-refresh__container about-refresh__hero-grid">
          <motion.div
            className="about-refresh__hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <span className="about-refresh__eyebrow">
              <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
              Agra-based travel team
            </span>
            <h1>
              Explore more.
              <span> Travel with confidence.</span>
            </h1>
            <p className="about-refresh__lead">
              Private, chauffeur-driven travel for Agra sightseeing, airport and station transfers,
              and journeys across North India — with a local team to help you plan.
            </p>

            <ul className="about-refresh__quick-points" aria-label="Our service highlights">
              <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span> Clear fare before you confirm</li>
              <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span> Doorstep pickup by arrangement</li>
              <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span> Direct local support</li>
            </ul>

            <div className="about-refresh__actions">
              <a className="about-refresh__button about-refresh__button--primary" href="/book/">
                <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                Plan a journey
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </a>
              <a className="about-refresh__button about-refresh__button--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp the travel desk
              </a>
            </div>
          </motion.div>

          <motion.div
            className="about-refresh__visual"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: "easeOut" }}
          >
            <img
              className="about-refresh__visual-image"
              src="/assets/fleet/elevate-fort.jpg"
              alt="Chauffeur-driven travel vehicle near a historic North Indian fort"
              loading="eager"
              onError={(event) => {
                const image = event.currentTarget;
                if (!image.src.endsWith("/assets/fleet/creta-tour.jpg")) {
                  image.src = "/assets/fleet/creta-tour.jpg";
                }
              }}
            />
            <div className="about-refresh__visual-shade" />
            <div className="about-refresh__visual-label">
              <span className="about-refresh__live-dot" />
              Local knowledge. Door-to-door travel.
            </div>
            <motion.div
              className="about-refresh__route-card"
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
            >
              <div className="about-refresh__route-card-heading">
                <span className="material-symbols-outlined" aria-hidden="true">alt_route</span>
                Your journey, planned around you
              </div>
              <div className="about-refresh__route-line">
                <span className="about-refresh__route-stop" />
                <span className="about-refresh__route-dash" />
                <span className="about-refresh__route-stop about-refresh__route-stop--end" />
              </div>
              <div className="about-refresh__route-cities">
                <span>Agra pickup</span>
                <span>North India</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="about-refresh__section about-refresh__services" aria-labelledby="about-services-heading">
        <div className="about-refresh__container">
          <motion.div
            className="about-refresh__section-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="about-refresh__eyebrow">Travel, made straightforward</span>
            <h2 id="about-services-heading">One local team. Three ways to travel.</h2>
            <p>Choose a service to get started. Your booking continues through the same shared booking flow.</p>
          </motion.div>

          <div className="about-refresh__service-grid">
            {SERVICES.map((service, index) => (
              <motion.article
                className="about-refresh__service-card"
                key={service.number}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              >
                <div className="about-refresh__service-top">
                  <span className="about-refresh__service-icon material-symbols-outlined" aria-hidden="true">{service.icon}</span>
                  <span className="about-refresh__service-number">{service.number}</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="about-refresh__service-footer">
                  <span>{service.detail}</span>
                  <a href="/book/" aria-label={`Start a booking for ${service.title}`}>
                    Book <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-refresh__section about-refresh__expectations" aria-labelledby="about-expectations-heading">
        <div className="about-refresh__container about-refresh__expectations-grid">
          <motion.div
            className="about-refresh__expectations-intro"
            initial={reduceMotion ? false : { opacity: 0, x: -14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="about-refresh__eyebrow">The Baghel standard</span>
            <h2 id="about-expectations-heading">The details that make travel easier.</h2>
            <p>Useful information, practical vehicle choices and a real team to contact — without the long explanations.</p>
            <a className="about-refresh__text-link" href="/fleet/">
              Explore our fleet <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </a>
          </motion.div>

          <div className="about-refresh__expectations-list">
            {EXPECTATIONS.map((item, index) => (
              <motion.article
                className="about-refresh__expectation"
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
              >
                <span className="about-refresh__expectation-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-refresh__location" aria-labelledby="about-location-heading">
        <div className="about-refresh__container about-refresh__location-grid">
          <motion.div
            className="about-refresh__location-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="about-refresh__eyebrow">Find our dispatch desk</span>
            <h2 id="about-location-heading">Local to Agra. Ready for the road.</h2>
            <p>Use the live Google Map to locate our dispatch desk or open directions in Google Maps.</p>
            <div className="about-refresh__address">
              <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
              <div>
                <strong>Agra SK Baghel Tour and Travels</strong>
                <p>{contact.address}</p>
              </div>
            </div>
            <a className="about-refresh__text-link" href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">
              Open directions in Google Maps
              <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
            </a>
          </motion.div>

          <motion.div
            className="about-refresh__map-card"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <iframe
              className="about-refresh__map"
              src={mapEmbedUrl}
              title="Google Map showing Agra SK Baghel Tour and Travels dispatch desk"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="about-refresh__map-footer">
              <span className="material-symbols-outlined" aria-hidden="true">map</span>
              <span>Dispatch desk · Agra, Uttar Pradesh</span>
              <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">Directions</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="about-refresh__closing">
        <motion.div
          className="about-refresh__container about-refresh__closing-inner"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div>
            <span className="about-refresh__eyebrow">Your next trip starts here</span>
            <h2>Where would you like to go?</h2>
            <p>Share your destination and travel date. We’ll help you choose the right service and vehicle.</p>
          </div>
          <div className="about-refresh__actions">
            <a className="about-refresh__button about-refresh__button--primary" href="/book/">
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              Start booking
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </a>
            <a className="about-refresh__button about-refresh__button--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp the travel desk
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

export default AboutPage;
