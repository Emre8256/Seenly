import React from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';

export default function PlansPage() {
  const { t } = useLocale();

  const handleSelectPlan = () => {
    sessionStorage.setItem('seenly_currentIndex', '-2');
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
            <h1 className="plans-title" dangerouslySetInnerHTML={{ __html: t('ui', 'pricing_section_title_html') }} />
            <p className="plans-subtitle">{t('ui', 'plans_subtitle')}</p>
          </div>

          {/* Pricing Section matching mockup design */}
          <div id="pricing" style={{ padding: 0, margin: 0, border: 'none', background: 'none' }}>
            <div className="pricing-inner" style={{ padding: 0 }}>
              <div className="pricing-grid">

                {/* Column 1 */}
                <div className="pricing-col">
                  <div className="pricing-card">
                    <h4 className="pricing-card-title">{t('ui', 'pricing_plan_free_name')}</h4>
                    <div className="pricing-card-price">{t('ui', 'pricing_plan_free_price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f1')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f2')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f3')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f4')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f5')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_free_f6')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-dark">
                      {t('ui', 'pricing_btn_get_started')}
                    </button>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="pricing-col">
                  <div className="pricing-card premium-card">
                    <div className="card-badge">{t('ui', 'pricing_badge_popular')}</div>
                    <h4 className="pricing-card-title">{t('ui', 'pricing_plan_premium_name')}</h4>
                    <div className="pricing-card-price">{t('ui', 'pricing_plan_premium_price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f1')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f2')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f3')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f4')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f5')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f6')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_premium_f7')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-accent">
                      {t('ui', 'pricing_btn_choose_plan')}
                    </button>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="pricing-col">
                  <div className="pricing-card">
                    <h4 className="pricing-card-title">{t('ui', 'pricing_plan_pro_name')}</h4>
                    <div className="pricing-card-price">{t('ui', 'pricing_plan_pro_price')}</div>
                    <ul className="pricing-features">
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_pro_f1')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_pro_f2')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_pro_f3')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_pro_f4')}</li>
                      <li><span className="bullet-circle"></span>{t('ui', 'pricing_plan_pro_f5')}</li>
                    </ul>
                    <button onClick={handleSelectPlan} className="btn-pricing btn-dark">
                      {t('ui', 'pricing_btn_choose_plan')}
                    </button>
                  </div>
                </div>

              </div>

              {/* Pricing Footer Disclaimer */}
              <div className="pricing-disclaimer" style={{ marginTop: '3.5rem' }}>
                <p>{t('ui', 'pricing_disclaimer_1')}</p>
                <p>{t('ui', 'pricing_disclaimer_2')}</p>
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
