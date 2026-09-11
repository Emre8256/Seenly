import React, { memo, useCallback, useMemo, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import faqIllustration from '../images/illustrations/faq_contact_illustration.avif';

const FaqAccordionItem = memo(function FaqAccordionItem({ item, isOpen, onToggle }) {
  return (
    <div
      className="w-full box-border mb-4 faq-accordion-card p-4 sm:p-5 md:px-6 touch-manipulation select-none active:scale-[0.995] transition-transform duration-100"
      style={{
        borderRadius: '24px',
        border: '1px solid rgba(11, 27, 44, 0.08)',
        background: isOpen ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.55)',
        boxShadow: 'none',
        cursor: 'pointer',
        touchAction: 'manipulation'
      }}
      onClick={() => onToggle(item.id)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          background: 'transparent',
          width: '100%',
          border: 'none',
          textAlign: 'left',
          outline: 'none',
          padding: 0,
          gap: '1rem'
        }}
      >
        <h3 className={`font-sans font-bold text-[0.9rem] sm:text-base leading-snug transition-colors duration-100 m-0 ${isOpen ? 'text-[#d96a53]' : 'text-foreground hover:text-[#d96a53]'}`}>
          {item.question}
        </h3>
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-transform duration-150 ease-out ${isOpen ? 'text-[#d96a53] rotate-180' : 'text-muted-foreground'}`}
          style={{ flexShrink: 0 }}
        >
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="faq-answer-reveal font-sans text-[0.85rem] sm:text-[0.92rem] text-muted-foreground leading-relaxed pt-3 text-left select-text">
          {item.answer}
        </div>
      )}
    </div>
  );
});

export default function FaqPage() {
  const { t, faq } = useLocale();
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleStartQuiz = () => {
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    window.dispatchEvent(new CustomEvent('seenly_trigger_start_quiz'));
    window.location.hash = '#/';
  };

  const handleLoginClick = () => {
    sessionStorage.setItem('seenly_currentIndex', '-5');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    window.dispatchEvent(new CustomEvent('seenly_trigger_login'));
    window.location.hash = '#/';
  };

  const filteredFaq = useMemo(() => (faq || []).filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
    );
  }), [faq, searchQuery]);

  return (
    <AppShell isDashboard={false} fullWidth={true} watercolorBackground>
      <div className="relative overflow-x-clip bg-transparent">
        <main className="pt-20 sm:pt-24 md:pt-32 pb-24 relative z-10 box-border w-full flex justify-center">
          <div className="w-full max-w-[1080px] px-6 md:px-10 box-border flex flex-col gap-12 md:gap-16">

            {/* Top Section: Contact Us (Bizimle İletişime Geçin) */}
            <section className="flex flex-col md:flex-row items-center gap-12 lg:gap-16 w-full box-border py-4 relative z-10">

              {/* Left Column: Organic Mask Image Frame (Desktop only) */}
              <div className="hidden md:flex flex-col items-center w-full max-w-[320px] md:max-w-[360px] z-10">
                <div className="integrated-art mask-organic-1 faq-illustration-frame relative w-full aspect-[4/5] overflow-hidden p-0 transition-transform duration-700 hover:scale-[1.02]">
                  <img
                    src={faqIllustration}
                    alt={t('common.faq.illustrationAlt')}
                    className="soft-image-edge w-full h-full object-cover relative z-10 mask-organic-1"
                  />
                </div>
              </div>

              {/* Right Column: Title, Divider and Description */}
              <div className="flex-1 flex flex-col items-start gap-4 text-left md:pl-4 w-full">

                {/* Title & Mobile Image Row */}
                <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
                  <div className="flex flex-col items-start gap-2 pr-1 sm:pr-0">
                    <h1 className="font-heading text-[2.25rem] sm:text-5xl md:text-[3.5rem] font-bold text-foreground m-0 leading-[1.05] tracking-tight">
                      {t('common.faq.contactTitle')}
                    </h1>
                    <div className="h-0.5 w-16 bg-gold/50 my-1 md:my-2" />
                  </div>

                  {/* Mobile Image Frame */}
                  <div className="flex md:hidden flex-col items-center w-40 sm:w-48 shrink-0 z-10 mt-1">
                    <div className="integrated-art mask-organic-1 faq-illustration-frame relative w-full aspect-[4/5] overflow-hidden p-0 transition-transform duration-700">
                      <img
                        src={faqIllustration}
                        alt={t('common.faq.illustrationAlt')}
                        className="soft-image-edge w-full h-full object-cover relative z-10 mask-organic-1"
                      />
                    </div>
                  </div>
                </div>

                <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed m-0 max-w-xl">
                  {t('common.faq.contactDesc')}
                </p>

                {/* Action Badges Row */}
                <div className="w-full flex flex-row flex-wrap items-center justify-between sm:justify-start gap-4 sm:gap-6 mt-4 sm:mt-6">

                  {/* Email Action */}
                  <a href="mailto:hello@seenly.co" className="flex items-center gap-3.5 hover:opacity-85 transition-opacity text-decoration-none group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#f4eedb] border border-foreground/20 flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-foreground/40 transition-all duration-300 shadow-sm shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[8.5px] sm:text-[9px] text-muted-foreground font-mono uppercase tracking-[0.16em] font-bold">
                        {t('common.faq.contactEmailTitle')}
                      </span>
                      <span className="text-[0.9rem] sm:text-base font-bold text-foreground">hello@seenly.co</span>
                    </div>
                  </a>

                  {/* Vertical Divider (Desktop) */}
                  <div className="hidden sm:block h-8 w-px bg-black/10" />

                  <div className="flex items-center gap-3 sm:gap-6">
                    {/* Instagram Action */}
                    <a href="https://instagram.com/seenly.co" target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#f4eedb] border border-foreground/20 flex items-center justify-center text-foreground hover:scale-105 hover:border-foreground/40 transition-all duration-300 shadow-sm shrink-0" aria-label={t("accessibility.instagram")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>

                    {/* Vertical Divider (Desktop) */}
                    <div className="hidden sm:block h-8 w-px bg-black/10" />

                    {/* TikTok Action */}
                    <a href="https://tiktok.com/@seenly.co" target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#f4eedb] border border-foreground/20 flex items-center justify-center text-foreground hover:scale-105 hover:border-foreground/40 transition-all duration-300 shadow-sm shrink-0" aria-label={t("accessibility.tiktok")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Sıkça Sorulan Sorular Section - Spacious Free Layout */}
            <section className="flex flex-col gap-8 w-full box-border pt-12 border-t border-black/5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-left flex flex-col items-start">
                  <h2 className="font-serif text-3xl md:text-4xl font-black text-foreground m-0 leading-tight">
                    {t('common.faq.title')}
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg m-0">
                    {t('common.faq.subtitle')}
                  </p>
                </div>

                {/* Search Bar Input */}
                <div className="relative w-full md:w-auto md:flex-1 md:max-w-[380px] box-border mt-2 md:mt-0">
                  <input
                    type="text"
                    placeholder={t('common.faq.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.25rem 0.75rem 2.85rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(197, 160, 89, 0.35)',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-sans), sans-serif',
                      color: 'var(--color-deep-ink)',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--peach)';
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.boxShadow = 'none';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(197, 160, 89, 0.35)';
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '1.1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label={t("common.faq.clearSearch")}
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Accordion List - Styled as glassmorphic panels */}
              <div className="flex flex-col w-full box-border mt-4">
                {filteredFaq.length > 0 ? (
                  filteredFaq.map((item) => {
                    const isOpen = expandedId === item.id;
                    return (
                      <FaqAccordionItem
                        key={item.id}
                        item={item}
                        isOpen={isOpen}
                        onToggle={toggleItem}
                      />
                    );
                  })
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.45)',
                    borderRadius: '24px',
                    border: '1px dashed rgba(11, 27, 44, 0.1)'
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.88rem',
                      color: 'var(--color-text-muted)',
                      margin: 0
                    }}>
                      {t('common.faq.noResults')}
                    </p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </main>
        <style>{`
        .faq-accordion-card {
          transition: background-color 100ms ease, border-color 100ms ease;
          touch-action: manipulation;
        }

        .faq-illustration-frame {
          box-shadow: 0 10px 26px -6px oklch(0.28 0.025 50 / 0.05) !important;
        }

        .faq-illustration-frame::after {
          display: none !important;
          content: none !important;
        }

        @media (max-width: 768px) {
          .faq-illustration-frame {
            box-shadow: 0 4px 14px -3px oklch(0.28 0.025 50 / 0.04) !important;
          }
        }

        .faq-answer-reveal {
          animation: faqAnswerReveal 110ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: opacity, transform;
        }

        @keyframes faqAnswerReveal {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-accordion-card,
          .faq-answer-reveal,
          .faq-accordion-card * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
      </div>
    </AppShell>
  );
}
