import React from 'react';
import AppShell from '../components/AppShell';
import './legal/LegalPage.css';

export default function RefundPolicyPage() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <AppShell isDashboard={false}>
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

        <article className="seenly-legal-card">
          <header className="seenly-legal-header">
            <h1 className="seenly-legal-title">
              Refund Policy
            </h1>
            <p className="seenly-legal-meta">
              Last Updated: September 2026
            </p>
          </header>

          <section className="seenly-legal-section">
            <h2 className="seenly-legal-section-title">
              <span className="seenly-legal-section-number">1</span>
              <span>Digital Goods & Immediate Delivery</span>
            </h2>
            <p className="seenly-legal-text">
              All commercial offerings available on Seenly—including the one-time Seenly Plus purchase and standalone Response Capacity Packs (100, 250, and 500 response capacity allotments)—are intangible digital goods delivered electronically and activated immediately upon successful transaction confirmation by our payment processing partners.
            </p>
          </section>

          <section className="seenly-legal-section">
            <h2 className="seenly-legal-section-title">
              <span className="seenly-legal-section-number">2</span>
              <span>14-Day Unused Pack Refund Guarantee</span>
            </h2>
            <div className="seenly-legal-highlight-box is-success">
              <p className="seenly-legal-highlight-text">
                ✅ Eligible Full Refund: If you purchase a Response Capacity Pack and ZERO (0) evaluations/responses have been recorded or consumed from that purchased pack, you are eligible to request a 100% full refund within 14 calendar days of the transaction date.
              </p>
            </div>
            <p className="seenly-legal-text">
              Additionally, if a technical error or network interruption results in an unintended duplicate charge for the same order, the redundant transaction will be fully refunded upon verification.
            </p>
          </section>

          <section className="seenly-legal-section">
            <h2 className="seenly-legal-section-title">
              <span className="seenly-legal-section-number">3</span>
              <span>Non-Refundable Scenarios</span>
            </h2>
            <p className="seenly-legal-text">
              Due to the immediate performance and irreversible consumption of digital capacity, refunds cannot be granted under the following conditions:
            </p>
            <ul className="seenly-legal-list">
              <li>
                <strong>Consumed Response Capacity: </strong>
                Once capacity is consumed or evaluations are gathered from your public reflection link, the purchase is strictly non-refundable.
              </li>
              <li>
                <strong>Utilized Seenly Plus Features: </strong>
                Seenly Plus purchases where premium analytical features, deep signal metrics, or extended perks have been accessed.
              </li>
              <li>
                <strong>Expired Time Window: </strong>
                Refund requests submitted more than 14 calendar days after the original purchase timestamp.
              </li>
              <li>
                <strong>Subjective Dissatisfaction: </strong>
                Personal disagreement with the ratings, perception feedback, or archetype classifications submitted by your peers.
              </li>
              <li>
                <strong>Policy Violations: </strong>
                Accounts suspended or permanently banned due to breaches of our Terms of Use or anti-spam rules.
              </li>
            </ul>
          </section>

          <section className="seenly-legal-section">
            <h2 className="seenly-legal-section-title">
              <span className="seenly-legal-section-number">4</span>
              <span>How to Request a Refund</span>
            </h2>
            <p className="seenly-legal-text">
              To initiate a refund request for an eligible unused pack or report a billing discrepancy, please contact our support team at <strong>support@seenly.app</strong> or <strong>billing@seenly.app</strong> from the email address associated with your Seenly account.
            </p>
            <p className="seenly-legal-text">
              Please include the following information in your request:
            </p>
            <ul className="seenly-legal-list">
              <li>Order ID / Merchant Transaction Reference</li>
              <li>Registered Seenly Account Email</li>
              <li>Detailed description of the issue or refund reason</li>
            </ul>
            <p className="seenly-legal-text">
              Approved refunds are reviewed within 3 to 5 business days and credited back to your original payment method within 5 to 10 business days, depending on your financial institution.
            </p>
          </section>
        </article>
      </div>
    </AppShell>
  );
}
