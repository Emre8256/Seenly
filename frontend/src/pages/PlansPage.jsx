import React from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';

export default function PlansPage() {
  const { t } = useLocale();

  const handleSelectPlan = () => {
    sessionStorage.setItem('tensignal_currentIndex', '-2');
    window.location.hash = '#/';
  };

  return (
    <AppShell isLanding={true}>
      <div style={{
        backgroundColor: '#F8E6D9',
        minHeight: '100vh',
        padding: '8.5rem 1.5rem 4rem 1.5rem',
        animation: 'fadeIn 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          {/* Header/Title section */}
          <div className="plans-header">
            <h1 className="plans-title" dangerouslySetInnerHTML={{ __html: t('billing.sectionTitleHtml') }} />
            <p className="plans-subtitle">{t('billing.plansSubtitle')}</p>
          </div>

          {/* Pricing Section matching mockup design */}
          <div id="pricing" style={{ padding: 0, margin: 0, border: 'none', background: 'none' }}>
            <div className="pricing-inner" style={{ padding: 0 }}>
              <div className="pricing-grid">

                {/* Column 1 */}
                <div className="pricing-col">
                  <div className="pricing-card">
                    <h4 className="pricing-card-title">{t('billing.free.name')}</h4>
                    <div className="pricing-card-price">{t('billing.free.price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('billing.free.f1')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.free.f2')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.free.f3')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.free.f4')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.free.f5')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.free.f6')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-dark">
                      {t('billing.getStarted')}
                    </button>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="pricing-col">
                  <div className="pricing-card premium-card">
                    <div className="card-badge">{t('billing.badgePopular')}</div>
                    <h4 className="pricing-card-title">{t('billing.premium.name')}</h4>
                    <div className="pricing-card-price">{t('billing.premium.price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('billing.premium.f1')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f2')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f3')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f4')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f5')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f6')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.premium.f7')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-accent">
                      {t('billing.choosePlan')}
                    </button>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="pricing-col">
                  <div className="pricing-card">
                    <h4 className="pricing-card-title">{t('billing.pro.name')}</h4>
                    <div className="pricing-card-price">{t('billing.pro.price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('billing.pro.f1')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.pro.f2')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.pro.f3')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.pro.f4')}</li>
                      <li><span className="bullet-circle"></span>{t('billing.pro.f5')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-dark">
                      {t('billing.choosePlan')}
                    </button>
                  </div>
                </div>

              </div>

              {/* Pricing Footer Disclaimer */}
              <div className="pricing-disclaimer" style={{ marginTop: '3.5rem' }}>
                <p>{t('billing.disclaimer1')}</p>
                <p>{t('billing.disclaimer2')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .app-shell.landing-layout {
          background-image: none !important;
          background-color: #F8E6D9 !important;
        }

        .plans-header {
          text-align: center;
          margin-top: 1.5rem;
          margin-bottom: 4rem;
          animation: fadeIn 0.6s ease-out;
        }

        .plans-title {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 5vw, 3.25rem);
          color: var(--color-deep-ink);
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.02em;
        }

        .plans-subtitle {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: var(--color-text-muted);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .plans-header {
            margin-bottom: 2.5rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
