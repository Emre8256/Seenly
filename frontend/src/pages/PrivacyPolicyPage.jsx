import React from 'react';
import AppShell from '../components/AppShell';
import './legal/LegalPage.css';

export default function PrivacyPolicyPage() {
  const handleBack = () => {
    window.location.hash = '#/';
  };

  return (
    <AppShell isDashboard={false} fullWidth>
      <div className="seenly-legal-container">
        <button
          type="button"
          onClick={handleBack}
          className="seenly-legal-back-btn"
          aria-label="Go Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Home</span>
        </button>

        <article className="seenly-legal-card seenly-privacy-card">
          <header className="seenly-legal-header">
            <h1 className="seenly-legal-title">
              Privacy Policy
            </h1>
            <p className="seenly-legal-meta">
              Last updated: September 4, 2026
            </p>
          </header>

          {/* Introductory Overview */}
          <section className="seenly-legal-section seenly-legal-intro">
            <p className="seenly-legal-text">
              Seenly (&quot;Seenly&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an independent social perception and self-reflection platform developed and operated by its creators.
            </p>
            <p className="seenly-legal-text">
              We care about privacy because Seenly processes personal reflections, assessment responses, social perceptions, and feedback submitted by people you invite.
            </p>
            <p className="seenly-legal-text">
              This Privacy Policy explains what information we collect, how we use it, when it may be shared, how long we keep it, and what choices you have.
            </p>

            <div className="seenly-legal-highlight-box is-success">
              <p className="seenly-legal-highlight-text">
                <strong>Our Privacy Commitment:</strong> Seenly is built around personal and interpersonal reflection. We do not sell personal information, self-assessment responses, or peer-assessment data to advertisers or data brokers. We use information entrusted to Seenly only to provide, protect, maintain, and improve the Service as described in this Privacy Policy.
              </p>
            </div>
          </section>

          {/* What Information We Collect */}
          <section className="seenly-legal-section" id="information-we-collect">
            <h2 className="seenly-legal-section-title">
              What Information We Collect
            </h2>
            <p className="seenly-legal-text">
              We collect information that you provide directly to Seenly and limited technical information generated when you use the Service.
            </p>

            <h3 className="seenly-legal-subtitle">Account and Profile Information</h3>
            <p className="seenly-legal-text">
              When you create an account, we may process:
            </p>
            <ul className="seenly-legal-list">
              <li>Display name;</li>
              <li>Email address;</li>
              <li>Account identifier;</li>
              <li>Selected avatar;</li>
              <li>Language and interface preferences;</li>
              <li>Authentication and account-security information.</li>
            </ul>
            <p className="seenly-legal-text">
              Your email address may be used for authentication, one-time verification codes, account recovery, security notices, purchase-related messages, and support.
            </p>

            <h3 className="seenly-legal-subtitle">Assessment Information</h3>
            <p className="seenly-legal-text">
              When you complete a Seenly assessment, we process the responses you voluntarily provide.
            </p>
            <p className="seenly-legal-text">
              These responses may relate to personality traits, interpersonal behavior, communication, social dynamics, self-perception, and similar characteristics. We use them to generate Seenly results such as scores, comparisons, perception gaps, archetypes, cards, and visual insights.
            </p>
            <p className="seenly-legal-text" style={{ fontStyle: 'italic', color: '#64748B' }}>
              Seenly assessments are intended for personal insight, entertainment, and social reflection. They are not medical, psychological, psychiatric, or clinical diagnoses.
            </p>

            <h3 className="seenly-legal-subtitle">Peer and Participant Feedback</h3>
            <p className="seenly-legal-text">
              Seenly allows people you invite to provide feedback through a participation link.
            </p>
            <p className="seenly-legal-text">
              Participant responses may be aggregated, subject to minimum-response thresholds, or otherwise presented in a way designed to protect individual participants from unnecessary identification.
            </p>
            <p className="seenly-legal-text">
              Unless a feature clearly states otherwise, Seenly does not intentionally reveal the identity of an anonymous participant to the profile owner.
            </p>

            <h3 className="seenly-legal-subtitle">Technical and Security Information</h3>
            <p className="seenly-legal-text">
              When you use Seenly, we may process limited technical information such as:
            </p>
            <ul className="seenly-legal-list">
              <li>IP address;</li>
              <li>Browser and device information;</li>
              <li>Timestamps;</li>
              <li>Authentication and security events;</li>
              <li>Rate-limit information;</li>
              <li>Error and performance information;</li>
              <li>Pseudonymous browser or device identifiers.</li>
            </ul>
            <p className="seenly-legal-text">
              Seenly may use hashed or pseudonymized browser/device fingerprint signals to prevent duplicate submissions, automated activity, manipulation, spam, and abuse. These identifiers are not used to create advertising profiles.
            </p>
          </section>

          {/* How We Use Information */}
          <section className="seenly-legal-section" id="how-we-use-information">
            <h2 className="seenly-legal-section-title">
              How We Use Information
            </h2>
            <p className="seenly-legal-text">
              We use information to:
            </p>
            <ul className="seenly-legal-list">
              <li>Create and maintain accounts;</li>
              <li>Authenticate users;</li>
              <li>Process assessments and generate results;</li>
              <li>Collect and aggregate participant feedback;</li>
              <li>Provide profile and sharing features;</li>
              <li>Provide paid features;</li>
              <li>Process and recognize purchases;</li>
              <li>Prevent fraud, abuse, spam, and duplicate submissions;</li>
              <li>Secure Seenly and user accounts;</li>
              <li>Provide support and essential communications;</li>
              <li>Troubleshoot and improve the Service.</li>
            </ul>
            <div className="seenly-legal-highlight-box is-success">
              <p className="seenly-legal-highlight-text">
                We do not sell or rent personal information. We do not sell self-assessment responses, peer feedback, personality-related results, or social-perception data to advertisers, advertising networks, or data brokers.
              </p>
            </div>
          </section>

          {/* Payments */}
          <section className="seenly-legal-section" id="payments">
            <h2 className="seenly-legal-section-title">
              Payments
            </h2>
            <p className="seenly-legal-text">
              Seenly may offer paid digital features or additional participation capacity.
            </p>
            <p className="seenly-legal-text">
              Payments may be processed by an independent payment provider or Merchant of Record. The payment provider may process billing, payment method, transaction, tax, and related information required to complete the purchase.
            </p>
            <p className="seenly-legal-text">
              Where payment information is entered directly through the payment provider, Seenly does not intentionally store full payment card numbers or card security codes on its own application servers.
            </p>
            <p className="seenly-legal-text">
              We may receive limited transaction information such as:
            </p>
            <ul className="seenly-legal-list">
              <li>Transaction ID;</li>
              <li>Product purchased;</li>
              <li>Amount and currency;</li>
              <li>Payment status;</li>
              <li>Purchase date;</li>
              <li>Refund or chargeback status.</li>
            </ul>
            <p className="seenly-legal-text">
              Payment providers process payment information according to their own privacy policies and legal obligations.
            </p>
          </section>

          {/* Anonymous Participation */}
          <section className="seenly-legal-section" id="anonymous-participation">
            <h2 className="seenly-legal-section-title">
              Anonymous Participation
            </h2>
            <p className="seenly-legal-text">
              Anonymous participation on Seenly means that a participant&apos;s identity is not intentionally shown to the profile owner through their submitted feedback.
            </p>
            <p className="seenly-legal-text">
              It does not mean that Seenly processes no technical information. Limited technical information may still be used to prevent:
            </p>
            <ul className="seenly-legal-list">
              <li>Duplicate submissions;</li>
              <li>Bots;</li>
              <li>Spam;</li>
              <li>Manipulation;</li>
              <li>Attempts to bypass participation limits.</li>
            </ul>
            <p className="seenly-legal-text">
              Seenly will not intentionally reveal an anonymous participant&apos;s identity merely because another user requests it, except where disclosure is legally required.
            </p>
          </section>

          {/* Public Profiles and Sharing */}
          <section className="seenly-legal-section" id="public-profiles">
            <h2 className="seenly-legal-section-title">
              Public Profiles and Sharing
            </h2>
            <p className="seenly-legal-text">
              Certain Seenly features allow users to share profiles, results, cards, or participation links.
            </p>
            <p className="seenly-legal-text">
              Information you intentionally make public or share through these features may be accessible to other people. People who receive such content may copy, screenshot, save, or redistribute it outside Seenly. We cannot control information that others independently copy or share outside the Service.
            </p>
          </section>

          {/* Cookies and Browser Storage */}
          <section className="seenly-legal-section" id="cookies">
            <h2 className="seenly-legal-section-title">
              Cookies and Browser Storage
            </h2>
            <p className="seenly-legal-text">
              Seenly may use essential cookies, localStorage, sessionStorage, or similar technologies to:
            </p>
            <ul className="seenly-legal-list">
              <li>Maintain authentication;</li>
              <li>Secure sessions;</li>
              <li>Remember language and interface preferences;</li>
              <li>Preserve assessments that are still in progress;</li>
              <li>Provide essential Service functionality.</li>
            </ul>
            <p className="seenly-legal-text">
              We do not use these technologies to sell your browsing activity to third-party advertising networks. If we introduce non-essential technologies that require consent, appropriate consent controls will be provided where required.
            </p>
          </section>

          {/* Service Providers and Information Sharing */}
          <section className="seenly-legal-section" id="information-sharing">
            <h2 className="seenly-legal-section-title">
              Service Providers and Information Sharing
            </h2>
            <p className="seenly-legal-text">
              We may use trusted third-party providers to operate Seenly, including providers of:
            </p>
            <ul className="seenly-legal-list">
              <li>Hosting and cloud infrastructure;</li>
              <li>Databases and storage;</li>
              <li>Transactional email;</li>
              <li>Security and abuse prevention;</li>
              <li>Error or performance monitoring;</li>
              <li>Customer support;</li>
              <li>Payment processing.</li>
            </ul>
            <p className="seenly-legal-text">
              These providers may process only the information reasonably necessary to provide their services to Seenly.
            </p>
            <p className="seenly-legal-text">
              We may also disclose information where reasonably necessary to comply with applicable law, valid legal process, fraud prevention, security investigations, or protection of our rights and users.
            </p>
            <p className="seenly-legal-text">
              We do not share personal information with third parties for their own behavioral advertising purposes.
            </p>
          </section>

          {/* International Processing */}
          <section className="seenly-legal-section" id="international-processing">
            <h2 className="seenly-legal-section-title">
              International Processing
            </h2>
            <p className="seenly-legal-text">
              Seenly is intended for users in multiple regions and may rely on service providers or infrastructure located in different jurisdictions. As a result, information may be processed or stored outside the location where you live.
            </p>
            <p className="seenly-legal-text">
              Where applicable privacy requirements impose restrictions on international transfers, appropriate safeguards will be used where required.
            </p>
          </section>

          {/* Data Retention and Deletion */}
          <section className="seenly-legal-section" id="data-retention">
            <h2 className="seenly-legal-section-title">
              Data Retention and Deletion
            </h2>
            <p className="seenly-legal-text">
              We keep personal information only for as long as reasonably necessary to provide Seenly, maintain security, prevent abuse, process transactions, comply with legal obligations, or resolve disputes.
            </p>
            <ul className="seenly-legal-list">
              <li>Account and assessment information may generally remain while your Seenly account is active.</li>
              <li>Temporary authentication information may expire automatically.</li>
              <li>Security and anti-abuse information may be retained for a limited period where necessary to prevent repeated misuse.</li>
              <li>Payment, refund, chargeback, tax, or accounting records may be retained where required or reasonably necessary.</li>
            </ul>
            <p className="seenly-legal-text">
              If you delete your Seenly account, information directly associated with the active account will be deleted or de-identified where reasonably possible.
            </p>
            <p className="seenly-legal-text">
              Certain limited information may remain temporarily where necessary for legal obligations, transaction records, security, fraud prevention, dispute resolution, or backup retention.
            </p>
          </section>

          {/* Your Privacy Rights */}
          <section className="seenly-legal-section" id="your-rights">
            <h2 className="seenly-legal-section-title">
              Your Privacy Rights
            </h2>
            <p className="seenly-legal-text">
              Depending on the privacy rules applicable to you, you may have rights to:
            </p>
            <ul className="seenly-legal-list">
              <li>Access personal information associated with you;</li>
              <li>Correct inaccurate information;</li>
              <li>Request deletion of eligible information;</li>
              <li>Object to or restrict certain processing;</li>
              <li>Withdraw consent where processing relies on consent;</li>
              <li>Request certain information in a portable format;</li>
              <li>Exercise other privacy rights available under applicable law.</li>
            </ul>
            <p className="seenly-legal-text">
              We may need to verify that you control the relevant Seenly account or email address before processing certain requests.
            </p>
            <p className="seenly-legal-text">
              Privacy requests can be sent to: <a href="mailto:privacy@seenly.app" className="seenly-legal-link">privacy@seenly.app</a>
            </p>
          </section>

          {/* Security */}
          <section className="seenly-legal-section" id="security">
            <h2 className="seenly-legal-section-title">
              Security
            </h2>
            <p className="seenly-legal-text">
              We use reasonable technical and organizational measures designed to protect information against unauthorized access, disclosure, alteration, loss, or misuse.
            </p>
            <p className="seenly-legal-text">
              These measures may include encryption in transit, authentication controls, restricted access, cryptographic protection of credentials, pseudonymization or hashing, rate limiting, anti-abuse controls, and security monitoring.
            </p>
            <p className="seenly-legal-text">
              No internet service can guarantee absolute security. If a security incident occurs and notification is required, we will take appropriate steps to investigate, mitigate the issue, and provide legally required notices.
            </p>
          </section>

          {/* Age Requirements */}
          <section className="seenly-legal-section" id="age-requirements">
            <h2 className="seenly-legal-section-title">
              Age Requirements
            </h2>
            <p className="seenly-legal-text">
              Seenly is not intended for individuals who are legally unable to provide the permissions required to use the Service in their jurisdiction.
            </p>
            <p className="seenly-legal-text">
              We do not knowingly seek to collect personal information in violation of applicable age or consent requirements. If you believe that information has been submitted without the authorization required by applicable law, contact us at: <a href="mailto:privacy@seenly.app" className="seenly-legal-link">privacy@seenly.app</a>
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="seenly-legal-section" id="third-party-services">
            <h2 className="seenly-legal-section-title">
              Third-Party Services
            </h2>
            <p className="seenly-legal-text">
              Seenly may link to or interact with third-party websites, payment services, or social platforms. Those services operate independently and process information according to their own privacy practices.
            </p>
            <p className="seenly-legal-text">
              This Privacy Policy applies only to information processed by or on behalf of Seenly.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="seenly-legal-section" id="policy-changes">
            <h2 className="seenly-legal-section-title">
              Changes to This Policy
            </h2>
            <p className="seenly-legal-text">
              We may update this Privacy Policy as Seenly, our service providers, or applicable privacy requirements change. The &quot;Last updated&quot; date at the top of this page will show when the Policy was most recently revised.
            </p>
            <p className="seenly-legal-text">
              Where a material change requires additional notice or consent, we will take appropriate steps.
            </p>
          </section>

          {/* Contact */}
          <section className="seenly-legal-section" id="contact">
            <h2 className="seenly-legal-section-title">
              Contact
            </h2>
            <p className="seenly-legal-text">
              Seenly is currently an independent project developed and operated by its creators.
            </p>
            <ul className="seenly-legal-list">
              <li>
                For privacy questions or requests: <a href="mailto:privacy@seenly.app" className="seenly-legal-link">privacy@seenly.app</a>
              </li>
              <li>
                For account or product support: <a href="mailto:support@seenly.app" className="seenly-legal-link">support@seenly.app</a>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </AppShell>
  );
}
