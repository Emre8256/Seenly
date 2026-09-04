import React from 'react';
import AppShell from '../components/AppShell';
import './legal/LegalPage.css';

const P = ({ children }) => <p className="seenly-legal-text">{children}</p>;
const List = ({ children }) => <ul className="seenly-legal-list">{children}</ul>;
const Section = ({ title, children, intro = false }) => (
  <section className={`seenly-legal-section${intro ? ' seenly-legal-intro' : ''}`}>
    {title && <h2 className="seenly-legal-section-title">{title}</h2>}
    {children}
  </section>
);
const Email = ({ children }) => <a className="seenly-legal-link" href={`mailto:${children}`}>{children}</a>;

export default function TermsOfUsePage() {
  const handleBack = () => {
    window.location.hash = '#/';
  };

  return (
    <AppShell isDashboard={false} fullWidth>
      <div className="seenly-legal-container">
        <button type="button" onClick={handleBack} className="seenly-legal-back-btn" aria-label="Go Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Home</span>
        </button>

        <article className="seenly-legal-card seenly-privacy-card">
          <header className="seenly-legal-header">
            <h1 className="seenly-legal-title">Terms &amp; Conditions</h1>
            <p className="seenly-legal-meta">Last updated: September 4, 2026</p>
          </header>

          <Section intro>
            <P>Welcome to Seenly.</P>
            <P>These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of Seenly, including our website, assessments, profiles, sharing features, digital products, and related services (collectively, the <strong>&quot;Service&quot;</strong>).</P>
            <P>By accessing or using Seenly, creating an account, submitting an assessment, participating through a shared link, or purchasing a digital product, you agree to these Terms and our Privacy Policy.</P>
            <P>If you do not agree with these Terms, please do not use the Service.</P>
          </Section>

          <Section title="1. About Seenly">
            <P>Seenly is an independent social perception and self-reflection platform developed and operated by its creators.</P>
            <P>The Service allows users to complete self-assessments, invite other people to provide feedback, compare self-perception with peer perception, and receive automatically generated scores, archetypes, cards, visualizations, and related insights.</P>
            <P>Seenly may change, add, remove, or improve features over time.</P>
          </Section>

          <Section title="2. Personal Insight — Not Professional Advice">
            <P>Seenly is designed for <strong>personal insight and social reflection</strong>.</P>
            <P>Assessment results, perception gaps, scores, archetypes, participant feedback, visualizations, and other outputs are generated from information submitted through the Service.</P>
            <P>Seenly does not provide medical, psychiatric, psychological, clinical, legal, employment, or other professional advice.</P>
            <P>Results should not be treated as a diagnosis or as a comprehensive or objectively accurate assessment of a person&apos;s personality, psychological condition, abilities, or suitability for any particular purpose.</P>
            <P>You remain responsible for any decisions or actions you take based on information obtained through Seenly.</P>
            <P>Seenly should not be used to make high-impact decisions about another person, including decisions relating to employment, recruitment, healthcare, credit, insurance, education, or similar matters.</P>
          </Section>

          <Section title="3. Eligibility">
            <P>You may use Seenly only if you are legally permitted to enter into these Terms and provide any consent required for use of the Service under the laws applicable to you.</P>
            <P>If you are not legally permitted to use the Service independently, you may use Seenly only where appropriate authorization has been obtained.</P>
          </Section>

          <Section title="4. Accounts and Security">
            <P>Some Seenly features require an account.</P>
            <P>You agree to provide accurate information and to maintain reasonable security over your account and authentication methods.</P>
            <P>You are responsible for activity performed through your account unless that activity results from circumstances reasonably outside your control.</P>
            <P>You must not:</P>
            <List>
              <li>Create accounts for fraudulent or abusive purposes;</li>
              <li>Impersonate another person;</li>
              <li>Attempt to obtain unauthorized access to another account;</li>
              <li>Share or misuse authentication credentials in a way that compromises account security;</li>
              <li>Deliberately circumvent account, participation, or usage restrictions.</li>
            </List>
            <P>If you believe your account has been compromised, contact us at <Email>support@seenly.app</Email>.</P>
            <P>We may temporarily restrict, suspend, or terminate an account where reasonably necessary to protect Seenly or its users, investigate abuse, comply with legal obligations, or address a material violation of these Terms.</P>
          </Section>

          <Section title="5. Participant Feedback and Shared Links">
            <P>Seenly allows users to invite other people to submit feedback through participation links.</P>
            <P>Participants are responsible for the responses they voluntarily submit.</P>
            <P>You agree not to use Seenly to:</P>
            <List>
              <li>Harass, threaten, intimidate, or abuse another person;</li>
              <li>Impersonate another individual;</li>
              <li>Deliberately submit false responses for the purpose of manipulating results;</li>
              <li>Coordinate fraudulent or artificial submissions;</li>
              <li>Use automated systems, bots, scripts, or similar tools to generate responses;</li>
              <li>Submit unlawful, defamatory, hateful, or otherwise abusive content.</li>
            </List>
            <P>Anonymous participation means that Seenly does not intentionally display the participant&apos;s identity to the profile owner through their submitted feedback, except as otherwise clearly disclosed by a particular feature or where disclosure is legally required.</P>
            <P>Seenly may use technical measures to detect duplicate submissions, automated activity, manipulation, or abuse.</P>
          </Section>

          <Section title="6. Acceptable Use">
            <P>You may use Seenly only for lawful purposes and in accordance with these Terms.</P>
            <P>You must not:</P>
            <List>
              <li>Attempt to gain unauthorized access to the Service or its infrastructure;</li>
              <li>Interfere with the normal operation or security of the Service;</li>
              <li>Deliberately bypass rate limits, participation limits, or security mechanisms;</li>
              <li>Introduce malware, malicious code, or automated attacks;</li>
              <li>Scrape or systematically extract substantial portions of the Service without permission;</li>
              <li>Reverse engineer or attempt to derive non-public source code except where such restriction is prohibited by applicable law;</li>
              <li>Use Seenly content, systems, or data to create a competing service through unauthorized copying or extraction;</li>
              <li>Use the Service in a way that violates another person&apos;s rights or applicable law.</li>
            </List>
            <P>We may take reasonable technical or account-level measures to prevent or respond to prohibited activity.</P>
          </Section>

          <Section title="7. Purchases and Digital Products">
            <P>Seenly may offer paid digital products or features, including premium functionality and additional participation capacity.</P>
            <P>The price, features, and applicable conditions of a purchase will be displayed before you complete the transaction.</P>
            <P>Payments may be processed by an independent payment processor or Merchant of Record. By completing a purchase, you also agree to any terms presented by the relevant payment provider where applicable.</P>
            <P>A purchase is considered completed once payment has been successfully confirmed and the relevant digital product or entitlement has been made available to your account.</P>
            <P>We reserve the right to:</P>
            <List>
              <li>Change prices for future purchases;</li>
              <li>Add, modify, or discontinue paid products;</li>
              <li>Refuse or cancel a transaction where reasonably necessary to prevent fraud, abuse, pricing errors, or technical mistakes.</li>
            </List>
            <P>A price change will not retroactively alter a purchase that has already been completed.</P>
            <P>If payment is successfully collected but we are unable to provide the purchased digital product, we will provide an appropriate remedy, which may include restoring access, replacement, account credit, or a refund.</P>
          </Section>

          <Section title="8. Refunds">
            <P>Unless otherwise stated at the time of purchase, Seenly offers a <strong>14-day refund period for eligible unused Response Capacity Packs</strong>.</P>
            <P>A Response Capacity Pack is generally eligible for a full refund where:</P>
            <List>
              <li>The request is submitted within 14 calendar days of purchase; and</li>
              <li>None of the purchased additional response capacity has been consumed.</li>
            </List>
            <P>Once purchased response capacity has been used to collect responses, the consumed digital capacity is generally non-refundable.</P>
            <P>Duplicate or clearly erroneous charges will be investigated and refunded where appropriate.</P>
            <P>Other digital products or premium features may have different refund conditions depending on the nature of the product and whether it has already been delivered, activated, accessed, or consumed.</P>
            <P>Nothing in this section limits any refund, cancellation, or consumer right that cannot lawfully be excluded.</P>
            <P>The policies or requirements of the payment provider or Merchant of Record may also apply to a transaction.</P>
            <P>Refund requests can be sent to:</P>
            <List>
              <li><Email>billing@seenly.app</Email></li>
              <li><Email>support@seenly.app</Email></li>
            </List>
            <P>Please include sufficient information to identify the relevant transaction, such as your Order ID and account email address.</P>
            <P>Approved refunds are returned through the original payment method where reasonably possible. Processing times may vary depending on the payment provider and financial institution.</P>
          </Section>

          <Section title="9. Intellectual Property">
            <P>Seenly and the original materials made available through the Service are protected by applicable intellectual property laws.</P>
            <P>This includes, where applicable:</P>
            <List>
              <li>The Seenly name and branding;</li>
              <li>Logos and visual identity;</li>
              <li>Original archetype artwork and illustrations;</li>
              <li>Assessment presentation and original written content;</li>
              <li>Scoring and analysis implementations;</li>
              <li>User-interface designs;</li>
              <li>Software and source code;</li>
              <li>Original graphics and other digital assets.</li>
            </List>
            <P>Except where expressly permitted, you may not reproduce, redistribute, sell, commercially exploit, systematically scrape, or create unauthorized derivative copies of protected Seenly materials.</P>
            <P>Using Seenly does not transfer ownership of Seenly intellectual property to you.</P>
            <P>Content or information that you personally submit to Seenly remains yours to the extent you have rights in it. You grant Seenly the limited rights necessary to process that content for operating and providing the Service in accordance with these Terms and our Privacy Policy.</P>
          </Section>

          <Section title="10. Service Availability and Changes">
            <P>We aim to provide Seenly reliably, but we do not guarantee uninterrupted or error-free availability.</P>
            <P>The Service may occasionally be unavailable because of:</P>
            <List>
              <li>Maintenance;</li>
              <li>Technical problems;</li>
              <li>Infrastructure failures;</li>
              <li>Security incidents;</li>
              <li>Third-party service interruptions;</li>
              <li>Updates or changes to the Service;</li>
              <li>Circumstances outside our reasonable control.</li>
            </List>
            <P>We may modify, suspend, or discontinue features where reasonably necessary.</P>
            <P>Where a change materially affects a paid product that has already been purchased, we will take reasonable steps to provide an appropriate solution consistent with applicable requirements.</P>
          </Section>

          <Section title="11. Disclaimers and Limitation of Liability">
            <P>Seenly is provided on an <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> basis.</P>
            <P>We do not guarantee that:</P>
            <List>
              <li>Assessment results will perfectly or objectively describe you or another person;</li>
              <li>Participant feedback will be accurate, truthful, complete, or representative;</li>
              <li>Scores, archetypes, perception gaps, or other outputs will meet your expectations;</li>
              <li>The Service will always be uninterrupted, error-free, or completely secure.</li>
            </List>
            <P>To the maximum extent permitted by applicable law, Seenly and its creators will not be responsible for indirect, incidental, special, consequential, or similar losses arising from use of or inability to use the Service.</P>
            <P>Nothing in these Terms excludes or limits liability or consumer rights that cannot legally be excluded or limited.</P>
          </Section>

          <Section title="12. Third-Party Services">
            <P>Seenly may rely on or link to third-party services, including payment providers, infrastructure providers, social platforms, or external websites.</P>
            <P>Those services operate independently and may be governed by their own terms and privacy policies.</P>
            <P>Seenly is not responsible for the independent operation or content of third-party services except to the extent responsibility cannot legally be excluded.</P>
          </Section>

          <Section title="13. Termination">
            <P>You may stop using Seenly at any time and may delete your account where account deletion functionality is available.</P>
            <P>We may restrict, suspend, or terminate access where reasonably necessary because of:</P>
            <List>
              <li>A material violation of these Terms;</li>
              <li>Fraudulent or abusive activity;</li>
              <li>Attempts to manipulate Seenly results;</li>
              <li>Security threats;</li>
              <li>Unlawful activity;</li>
              <li>Legal or regulatory requirements.</li>
            </List>
            <P>Where reasonable in the circumstances, we may provide notice or an opportunity to resolve the issue before permanent termination.</P>
            <P>Termination does not affect provisions that by their nature should continue to apply, including intellectual property, completed payment obligations, disclaimers, and limitations of liability.</P>
          </Section>

          <Section title="14. Changes to These Terms">
            <P>We may update these Terms when Seenly, our commercial practices, our service providers, or applicable requirements change.</P>
            <P>The <strong>&quot;Last updated&quot;</strong> date at the top of this page will indicate the latest revision.</P>
            <P>By continuing to use Seenly after revised Terms become effective, you agree to the updated Terms where permitted by applicable law.</P>
            <P>Where a material change requires additional notice or consent, we will take appropriate steps.</P>
          </Section>

          <Section title="15. Governing Language">
            <P>These Terms are written in English.</P>
            <P>Seenly may provide translations for convenience. If there is a material inconsistency between the English version and a translated version, the English version will govern to the extent permitted by applicable law.</P>
          </Section>

          <Section title="16. General Terms">
            <P>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in effect.</P>
            <P>Our failure to enforce a provision of these Terms does not waive our right to enforce it later.</P>
            <P>You may not transfer your rights or obligations under these Terms without our permission where such restriction is legally permitted.</P>
            <P>If Seenly&apos;s operation is transferred to another person or entity in the future, these Terms and the rights and obligations connected with the Service may be transferred as part of that transition, subject to applicable law.</P>
            <P>These Terms, together with our Privacy Policy and any refund or purchase terms presented to you, constitute the agreement governing your use of Seenly.</P>
            <P>Nothing in these Terms removes rights that cannot legally be waived or restricted.</P>
          </Section>

          <Section title="17. Contact">
            <P>Seenly is currently an independent project developed and operated by its creators.</P>
            <List>
              <li>For questions about these Terms: <Email>legal@seenly.app</Email></li>
              <li>For general support: <Email>support@seenly.app</Email></li>
              <li>For billing or refund inquiries: <Email>billing@seenly.app</Email></li>
            </List>
          </Section>
        </article>
      </div>
    </AppShell>
  );
}
