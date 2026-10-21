import React from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

export interface PrivacyPageProps {
  language?: SupportedLanguage;
}

const LAST_UPDATED = "22 October 2026";

export function PrivacyPage({ language = "en" }: PrivacyPageProps) {
  return (
    <main lang={language} className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <header className="bg-sandstone-wash/60 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-4 text-on-surface-variant">
            <a className="text-primary hover:underline" href="/">Home</a>
            <span aria-hidden="true">/</span>
            <span>Privacy Policy</span>
          </nav>
          <p className="font-label-caps text-xs uppercase tracking-widest text-primary font-bold mb-2">Privacy and Data Use</p>
          <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight">Privacy Policy</h1>
          <p className="max-w-3xl mt-4 text-on-surface-variant leading-relaxed">
            This policy explains how Agra SK Baghel Tour and Travels handles information when you visit our website, contact our travel desk,
            ask about a journey, make a booking, or sign in with Google.
          </p>
          <p className="mt-4 text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <section id="operator" className="scroll-mt-28 space-y-3">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">1. Who we are and how to contact us</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Agra SK Baghel Tour and Travels provides taxi, chauffeur-driven transport, sightseeing, and tour enquiry and booking services in and around
            Agra and other destinations in North India. For this policy, "we" means Agra SK Baghel Tour and Travels and "you" means a visitor, customer,
            or person contacting us.
          </p>
          <address className="not-italic rounded-xl border border-border-warm bg-surface-container-lowest p-4 space-y-1 text-on-surface-variant">
            <p><strong className="text-ink-charcoal">Privacy and customer support contact</strong></p>
            <p>Agra SK Baghel Tour and Travels</p>
            <p>{contact.address}</p>
            <p>Email: <a className="text-primary underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>
            <p>Telephone: <a className="text-primary underline" href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a></p>
          </address>
        </section>

        <section id="information" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">2. Information we collect</h2>
          <p className="text-on-surface-variant leading-relaxed">Depending on the feature you use, we may handle these categories of information:</p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed">
            <li><strong className="text-ink-charcoal">Contact and identity details:</strong> name, email address, phone number, and account identifiers you provide or authorise through sign-in.</li>
            <li><strong className="text-ink-charcoal">Journey and booking details:</strong> pickup and destination, dates and times, vehicle or tour requested, passenger count, booking reference, trip instructions, and messages sent to our travel desk.</li>
            <li><strong className="text-ink-charcoal">Payment and receipt details:</strong> transaction reference, payment status, amount, and refund or reconciliation information returned by the payment provider. Payment-provider services handle payment credentials according to their own terms and controls.</li>
            <li><strong className="text-ink-charcoal">Communications:</strong> emails, telephone or WhatsApp messages, and the information needed to respond to a request or manage a booking.</li>
            <li><strong className="text-ink-charcoal">Technical and security information:</strong> basic request logs, device or browser information, IP address, authentication/session state, and error or security events where collected by the website or its infrastructure providers.</li>
          </ul>
          <p className="text-on-surface-variant leading-relaxed">Please do not send passwords, one-time passcodes, full payment-card numbers, CVV codes, or other authentication secrets to our support desk.</p>
        </section>

        <section id="google-sign-in" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">3. Google Sign-In and Google user data</h2>
          <p className="text-on-surface-variant leading-relaxed">
            If you choose "Continue with Google", the sign-in flow uses Google OAuth through our authentication provider. The flow is intended to obtain
            the basic identity information necessary to authenticate you, such as the Google account identifier and the email address, name, or profile image
            made available by Google and the configured sign-in scopes.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            We use this information to create or maintain your sign-in session, secure the account, associate your account with bookings or payment-status
            records where relevant, and provide customer support. We do not use Google user data for advertising, sell it, or rent it to marketers.
            The website sign-in flow does not request Gmail, Google Drive, Google Calendar, or Google Contacts access.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Google account information is processed by Google and our authentication provider as needed to operate sign-in. We limit our use of Google user
            data to the purposes explained here and follow the Google API Services User Data Policy, including its Limited Use requirements where applicable.
            Personnel access to account data should be limited to what is necessary for support, security, or operation and appropriately authorised.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            You can stop using Google Sign-In at any time. You may also review third-party app access in your Google Account settings. Revoking sign-in
            access may not remove booking, tax, transaction, or safety records that we are required or otherwise permitted to retain.
          </p>
        </section>

        <section id="purposes" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">4. How we use information</h2>
          <p className="text-on-surface-variant leading-relaxed">We use information only as reasonably needed for purposes such as:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-on-surface-variant leading-relaxed">
            <li>responding to enquiries and preparing or managing transport and tour bookings;</li>
            <li>authenticating accounts and associating signed-in customers with their bookings;</li>
            <li>sending booking confirmations, vouchers, service updates, invoices, payment or refund notifications, and responses to your requests;</li>
            <li>coordinating a trip with an assigned driver or transport partner, sharing only the necessary journey details;</li>
            <li>protecting the website, preventing misuse, debugging errors, and maintaining service reliability; and</li>
            <li>meeting accounting, tax, safety, legal, or regulatory obligations, or establishing and responding to legal claims.</li>
          </ul>
          <p className="text-on-surface-variant leading-relaxed">We will update this policy if we introduce a materially different use of personal information and provide notices or obtain consent where applicable law requires it.</p>
        </section>

        <section id="sharing" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">5. When information is shared</h2>
          <p className="text-on-surface-variant leading-relaxed">We do not sell personal information. Information may be shared only when needed for the purposes above, including with:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-on-surface-variant leading-relaxed">
            <li>Google and our authentication provider to complete sign-in and maintain account sessions;</li>
            <li>website, application, database, hosting, content delivery, and security providers that help operate the service;</li>
            <li>a payment provider to process or reconcile a payment, refund, or transaction;</li>
            <li>transactional email providers to deliver booking confirmations, receipts, and vouchers;</li>
            <li>drivers or transport partners, only with journey details required to provide the requested service; and</li>
            <li>authorities, courts, regulators, or other parties where disclosure is required by law or necessary to protect rights, safety, and security.</li>
          </ul>
          <p className="text-on-surface-variant leading-relaxed">
            Third-party providers process data under their own service terms and privacy notices as well as any applicable contractual protections.
            If a provider processes information in another jurisdiction, that processing is subject to applicable law and the provider's relevant safeguards.
          </p>
        </section>

        <section id="retention" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">6. Retention, access, correction, and deletion requests</h2>
          <p className="text-on-surface-variant leading-relaxed">
            We keep personal information for as long as it is reasonably needed to provide services, maintain accounts and booking histories, resolve disputes,
            protect against misuse, and satisfy applicable tax, accounting, recordkeeping, or legal requirements. Different records may have different retention
            periods. We do not promise immediate deletion of every record when a trip ends or an account is closed.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            You may contact us to request access to or correction of information associated with you, ask about deletion, withdraw consent where processing
            relies on consent, or raise a privacy concern. We may ask for reasonable information to verify your identity before acting. We may retain records
            where the law permits or requires us to do so, and will explain any applicable limitation when responding.
          </p>
        </section>

        <section id="cookies" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">7. Cookies, browser storage, and logs</h2>
          <p className="text-on-surface-variant leading-relaxed">
            The website may use essential browser storage, cookies, or similar mechanisms for authentication, session continuity, security, saved preferences,
            and booking-form functionality. Infrastructure providers may maintain operational and security logs. Blocking such storage can affect sign-in or
            other site features. If optional analytics or advertising tools are introduced, this policy will be updated and any legally required choices or
            notices will be provided.
          </p>
        </section>

        <section id="security" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">8. Security and third-party links</h2>
          <p className="text-on-surface-variant leading-relaxed">
            We use reasonable technical and organisational measures intended to protect information from unauthorised access, loss, misuse, or alteration.
            No website or transmission method can be guaranteed completely secure. Links to Google, payment services, map services, WhatsApp, or other third-party
            websites are governed by those services' own privacy terms when you leave our website.
          </p>
        </section>

        <section id="children-and-law" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">9. Children and applicable law</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Our website is intended for people arranging or enquiring about travel, not for children to create independent accounts. A parent or lawful
            guardian should provide information needed to arrange travel for a child and should contact us with any related privacy concern.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            We aim to handle personal information in line with the laws applicable to our services in India, including relevant requirements under the
            Information Technology Act, 2000, consumer-protection laws, and the Digital Personal Data Protection Act, 2023 and Rules, 2025 to the extent
            applicable and as their provisions take effect. This policy describes our stated practices; the policy by itself does not replace any operational
            steps, notices, consents, security controls, or appointments that applicable law may require.
          </p>
        </section>

        <section id="updates" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">10. Changes to this policy and privacy complaints</h2>
          <p className="text-on-surface-variant leading-relaxed">
            We may revise this policy when the service or applicable requirements change. The date at the top shows the latest revision. For a privacy request,
            complaint, or question, contact us using the email, phone, or postal details in Section 1. Please include enough context for us to locate the
            relevant account or booking, but do not include passwords, one-time passcodes, or full payment credentials.
          </p>
        </section>

        <div className="border-t border-border-warm pt-6 flex flex-wrap gap-4 text-sm">
          <a className="text-primary underline" href="/terms-and-conditions/">Terms and Conditions</a>
          <a className="text-primary underline" href="/contact/">Contact the travel desk</a>
        </div>
      </article>
    </main>
  );
}

export default PrivacyPage;
