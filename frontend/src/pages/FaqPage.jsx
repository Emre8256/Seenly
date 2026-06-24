import React, { useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import faqIllustration from '../images/faq_contact_illustration.png';

export default function FaqPage() {
  const { t, faq } = useLocale();
  const [expandedId, setExpandedId] = useState(null);

  const toggleItem = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleStartQuiz = () => {
    window.location.hash = '#/';
  };

  const handleGoHome = () => {
    window.location.hash = '#/';
  };

  return (
    <AppShell isLanding={true}>
      <div className="faq-page-wrapper">
        <div className="faq-container">
          
          {/* Top Section: Contact Us (Bize Ulaşın) */}
          <section className="contact-hero">
            <div className="contact-image-wrapper">
              <div className="contact-image-card">
                <img 
                  src={faqIllustration} 
                  alt="Contact Illustration" 
                  className="contact-image-element"
                />
              </div>
            </div>
            
            <div className="contact-info-panel">
              <span className="contact-badge">{t('ui', 'faq_contact_label') || 'Bize Ulaşın'}</span>
              <h1 className="contact-title">{t('ui', 'faq_contact_title')}</h1>
              <p className="contact-description">
                {t('ui', 'faq_contact_desc')}
              </p>
              
              <div className="contact-action-box">
                <a href="mailto:hello@seenly.co" className="contact-option-card">
                  <div className="contact-icon-wrapper">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="contact-details">
                    <span className="contact-label">{t('ui', 'faq_contact_email_title') || 'E-posta Adresimiz'}</span>
                    <span className="contact-value">hello@seenly.co</span>
                  </div>
                </a>
                
                <div className="contact-socials-row">
                  <a href="https://instagram.com/seenly.co" target="_blank" rel="noopener noreferrer" className="contact-social-btn" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    <span>Instagram</span>
                  </a>
                  <a href="https://tiktok.com/@seenly.co" target="_blank" rel="noopener noreferrer" className="contact-social-btn" aria-label="TikTok">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                    </svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Elegant transition divider */}
          <div className="elegant-divider"></div>

          {/* Bottom Section: Sıkça Sorulan Sorular */}
          <section className="faq-section-wrapper">
            <div className="faq-header">
              <h2 className="faq-section-title">{t('ui', 'faq_title')}</h2>
              <p className="faq-section-subtitle">{t('ui', 'faq_subtitle')}</p>
            </div>

            <div className="faq-accordion">
              {(faq || []).map((item) => {
                const isOpen = expandedId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className={`faq-accordion-item ${isOpen ? 'open' : ''}`}
                  >
                    <button 
                      className="faq-item-header"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                    >
                      <h3 className="faq-question">{item.question}</h3>
                      <div className="faq-toggle-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ minHeight: 0 }}>
                        <div className="faq-answer-inner">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>



        </div>
      </div>
      
      <style>{`
        .app-shell.landing-layout {
          background-image: none !important;
          background-color: #F8E6D9 !important;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        .faq-page-wrapper {
          background-color: #F8E6D9;
          min-height: 100vh;
          padding: 8.5rem 1.5rem 4rem 1.5rem;
          animation: fadeIn 0.6s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }

        .faq-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 4rem;
        }

        /* Contact Us Section Styles */
        .contact-hero {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3rem;
          align-items: center;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 32px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(11, 27, 44, 0.02);
        }

        @media (max-width: 768px) {
          .contact-hero {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 2rem 1.5rem;
            text-align: center;
          }
        }

        .contact-image-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .contact-image-card {
          width: 100%;
          max-width: 320px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(11, 27, 44, 0.05);
          border: 4px solid #ffffff;
          animation: float 6s ease-in-out infinite;
          background: #ffffff;
          line-height: 0;
        }

        .contact-image-element {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .contact-image-card:hover .contact-image-element {
          transform: scale(1.04);
        }

        .contact-info-panel {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          .contact-info-panel {
            align-items: center;
          }
        }

        .contact-badge {
          background: rgba(217, 106, 83, 0.08);
          color: var(--color-burnt-coral);
          padding: 0.4rem 1.1rem;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .contact-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          color: var(--color-deep-ink);
          font-weight: 900;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .contact-description {
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--color-text-muted);
          margin: 0;
        }

        .contact-action-box {
          width: 100%;
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .contact-action-box {
            align-items: center;
          }
        }

        .contact-socials-row {
          display: flex;
          gap: 12px;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .contact-socials-row {
            justify-content: center;
          }
        }

        .contact-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid rgba(11, 27, 44, 0.05);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          text-decoration: none;
          color: var(--color-deep-ink);
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(11, 27, 44, 0.01);
          font-family: var(--font-sans), sans-serif;
        }

        .contact-social-btn:hover {
          background: var(--color-burnt-coral);
          color: #ffffff;
          border-color: var(--color-burnt-coral);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(217, 106, 83, 0.15);
        }

        .contact-social-btn svg {
          transition: transform 0.3s ease;
        }

        .contact-social-btn:hover svg {
          transform: scale(1.1);
        }

        .contact-option-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(11, 27, 44, 0.05);
          border-radius: 20px;
          padding: 1rem 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(11, 27, 44, 0.01);
          width: 100%;
          max-width: 420px;
          box-sizing: border-box;
        }

        .contact-option-card:hover {
          transform: translateY(-3px);
          border-color: var(--color-burnt-coral);
          box-shadow: 0 12px 24px rgba(217, 106, 83, 0.08);
        }

        .contact-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(217, 106, 83, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-burnt-coral);
          transition: all 0.3s ease;
        }

        .contact-option-card:hover .contact-icon-wrapper {
          background: var(--color-burnt-coral);
          color: #ffffff;
          transform: scale(1.05);
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .contact-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .contact-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-deep-ink);
          letter-spacing: -0.01em;
        }

        /* Elegant Section Divider */
        .elegant-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(217, 106, 83, 0) 0%, rgba(217, 106, 83, 0.2) 50%, rgba(217, 106, 83, 0) 100%);
          position: relative;
          width: 100%;
          margin: 0.5rem 0;
        }

        .elegant-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-burnt-coral);
          border: 3px solid #F8E6D9;
        }

        /* FAQ Section Styles */
        .faq-section-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          width: 100%;
        }

        .faq-header {
          text-align: center;
        }

        .faq-section-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          font-weight: 900;
          color: var(--color-deep-ink);
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }

        .faq-section-subtitle {
          font-size: 1.05rem;
          color: var(--color-text-muted);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .faq-accordion-item {
          background: #ffffff;
          border: 1px solid rgba(11, 27, 44, 0.05);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(11, 27, 44, 0.01);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-accordion-item:hover {
          transform: translateY(-2px);
          border-color: rgba(217, 106, 83, 0.12);
          box-shadow: 0 8px 20px rgba(11, 27, 44, 0.02);
        }

        .faq-accordion-item.open {
          border-color: rgba(217, 106, 83, 0.2);
          box-shadow: 0 12px 28px rgba(11, 27, 44, 0.04);
        }

        .faq-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          cursor: pointer;
          user-select: none;
          background: transparent;
          width: 100%;
          border: none;
          text-align: left;
          outline: none;
          gap: 1.5rem;
        }

        .faq-question {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-deep-ink);
          margin: 0;
          line-height: 1.4;
          transition: color 0.3s ease;
          font-family: var(--font-sans), sans-serif;
        }

        .faq-accordion-item.open .faq-question {
          color: var(--color-burnt-coral);
        }

        .faq-toggle-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(11, 27, 44, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .faq-accordion-item:hover .faq-toggle-icon {
          background: rgba(217, 106, 83, 0.08);
          color: var(--color-burnt-coral);
        }

        .faq-accordion-item.open .faq-toggle-icon {
          background: var(--color-burnt-coral);
          color: #ffffff;
          transform: rotate(180deg);
        }

        .faq-answer-inner {
          padding: 0 2.25rem 1.5rem 2.25rem;
          font-size: 1rem;
          line-height: 1.65;
          color: var(--color-text-muted);
        }



        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
