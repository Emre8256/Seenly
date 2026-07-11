import React, { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { IntersectingCircles, WatercolorStain, HairLine, ConnectorDots } from '../components/marks';
import { SiteFooter } from '../components/site-footer';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';

import dengeliGozlemci from '../images/OkuyucuKartları/Dengeli Gözlemci.png';
import netOkuyucu from '../images/OkuyucuKartları/Net Okuyucu.png';
import sosyalYabanci from '../images/OkuyucuKartları/Sosyal Yabancı.png';
import telepatikOkuyucu from '../images/OkuyucuKartları/Telepatik Okuyucu.png';
import yuzeyselKasif from '../images/OkuyucuKartları/Yüzeysel Kaşif.png';

const READER_CARD_IMAGES = {
  balanced_reader: dengeliGozlemci,
  clear_reader: netOkuyucu,
  social_stranger: sosyalYabanci,
  telepathic_reader: telepatikOkuyucu,
  casual_explorer: yuzeyselKasif
};

export default function FriendResultPage({ slug, onNavigateToQuiz }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [result, setResult] = useState(null);
  const { handleInstagramStory, isGenerating } = useSeenlyShare();

  const _slug = slug || result?.publicSlug || '';

  const getWhatsAppShareLink = (cardName) =>
    buildWhatsAppLink(cardName, _slug);

  const handleInstagramShare = (cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, _slug, langCode);
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('seenly_friend_result');
      if (saved) {
        setResult(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const isLoggedIn = !!(localStorage.getItem('seenly_owner_token'));

  const handleStartOwn = () => {
    sessionStorage.removeItem('seenly_friend_result');
    if (onNavigateToQuiz) {
      onNavigateToQuiz();
    }
  };

  const handleGoToDashboard = () => {
    window.location.hash = '#/';
  };

  const styleId = result?.readerStyleId || 'clear_reader';
  const accuracy = result?.accuracy ?? 75.0;
  const [accuracyOffset, setAccuracyOffset] = useState(2 * Math.PI * 52);

  useEffect(() => {
    const timer = setTimeout(() => {
      const circumference = 2 * Math.PI * 52;
      const targetOffset = circumference * (1 - accuracy / 100);
      setAccuracyOffset(targetOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [accuracy]);

  const styleObj = getObject('readerStyles', styleId) || {
    name: styleId,
    oneLine: 'Awaiting style calibration...'
  };

  return (
    <AppShell isDashboard={true} showLogout={false} footerMode="simple">
      <div className="seenly-dashboard-page-wrapper">
        <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 relative z-10">
          <div className="friend-result-grid">

            {/* Left Column: Rectangular Premium Card Layout */}
            <div className="flex flex-col items-center justify-center w-full">
              <div className="seenly-dashboard-premium-card seenly-signal-summary-card p-5 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full max-w-[340px] box-border animate-scale-in" style={{ minHeight: '430px' }}>
                <div className="seenly-signal-summary-main flex flex-col items-center justify-center flex-1 w-full py-2">
                  {/* Stylish rounded rectangle frame with gold border */}
                  <div className="seenly-dashboard-portrait-frame relative w-full max-w-[290px] aspect-[3/4] mb-3 overflow-hidden rounded-[24px] bg-card" style={{ border: '2px solid rgba(197, 160, 89, 0.4)', boxShadow: '0 12px 32px rgba(80, 60, 40, 0.15)' }}>
                    <img
                      src={READER_CARD_IMAGES[styleId] || READER_CARD_IMAGES.clear_reader}
                      alt={styleObj.name}
                      className="w-full h-full object-cover relative z-10"
                    />
                  </div>

                  <div className="seenly-summary-copy">
                    <h3 className="font-serif text-3xl font-black text-foreground mb-2" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                      {styleObj.name}
                    </h3>

                    {/* Thin line divider */}
                    <div className="flex items-center justify-center gap-2.5 my-3 w-full">
                      <div className="h-px w-16 bg-black/[0.06]" />
                      <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                      <div className="h-px w-16 bg-black/[0.06]" />
                    </div>

                    {styleObj.oneLine && (
                      <p className="font-sans text-[0.88rem] leading-relaxed text-muted-foreground italic px-3">
                        "{styleObj.oneLine}"
                      </p>
                    )}
                  </div>
                </div>

                {/* 2 sharing buttons: WhatsApp + Instagram Story */}
                <div className="flex items-center justify-center gap-3.5 w-full mt-6 border-t border-black/5 pt-5 box-border">
                  {/* WhatsApp Share */}
                  <a
                    href={getWhatsAppShareLink(styleObj.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 max-w-[160px] h-11 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[0.8rem] transition-all duration-300 shadow-sm hover:scale-105"
                    style={{
                      background: '#25D366',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                      textDecoration: 'none'
                    }}
                    title={langCode === 'tr' ? "WhatsApp'ta Paylaş" : "Share on WhatsApp"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.48-8.45z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>

                  {/* Instagram Story */}
                  <button
                    type="button"
                    onClick={() => handleInstagramShare(styleObj.name, READER_CARD_IMAGES[styleId] || READER_CARD_IMAGES.clear_reader)}
                    disabled={isGenerating}
                    className="flex-1 max-w-[160px] h-11 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[0.8rem] transition-all duration-300 shadow-sm hover:scale-105"
                    style={{
                      background: isGenerating
                        ? 'rgba(11,27,44,0.4)'
                        : 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      boxShadow: '0 4px 14px rgba(220, 39, 67, 0.3)',
                      cursor: isGenerating ? 'wait' : 'pointer',
                      border: 'none',
                    }}
                    title={langCode === 'tr' ? "Instagram Story Oluştur" : "Create Instagram Story"}
                  >
                    {isGenerating ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>{langCode === 'tr' ? 'Bekle...' : 'Wait...'}</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span>Instagram</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Info, Accuracy, CTA */}
            <div className="flex flex-col justify-center text-left animate-scale-in">

              <h2 className="font-heading text-4xl sm:text-5xl font-medium leading-[1.1] text-foreground tracking-tight mb-5">
                {langCode === 'tr' ? 'Algı Analizini Tamamladınız!' : 'Analysis Complete!'}
              </h2>

              <ConnectorDots className="w-40 h-6 text-gold/50 mb-6" variant="flat" />

              <p className="font-sans text-sm sm:text-base leading-relaxed text-muted-foreground/90 mb-8 max-w-[520px]">
                {langCode === 'tr'
                  ? 'Arkadaşınızı kendi gözünüzden yansıttınız. Verdiğiniz cevaplar ve sosyal sinyaller doğrultusunda Seenly analitik motoru okuma tarzınızı hesapladı.'
                  : 'You have reflected your friend through your eyes. The analytical engine calculated your reading style based on your signals.'}
              </p>

              {/* Accuracy Meter Section */}
              <div className="bg-white/20 border border-white/40 shadow-contact-sm backdrop-blur-md rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-5 box-border">
                <div className="relative w-[110px] h-[110px] flex items-center justify-center flex-shrink-0">
                  <svg width="110" height="110" viewBox="0 0 110 110" className="rotate-[-90deg]">
                    <circle
                      cx="55"
                      cy="55"
                      r="48"
                      fill="transparent"
                      stroke="rgba(11, 27, 44, 0.04)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="55"
                      cy="55"
                      r="48"
                      fill="transparent"
                      stroke="var(--color-accent)"
                      strokeWidth="4.5"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={accuracyOffset}
                      style={{
                        transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />
                  </svg>
                  <div className="absolute flex items-center justify-center">
                    <span className="font-serif text-2xl font-semibold text-[#0b1b2c]">
                      %{Math.round(accuracy)}
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <h4 className="font-serif text-base font-bold text-foreground mb-1.5 leading-tight">
                    {t('ui', 'friend_accuracy_score')}
                  </h4>
                  <p className="font-sans text-[13px] leading-relaxed text-muted-foreground m-0">
                    {t('ui', 'friend_accuracy_desc')}
                  </p>
                </div>
              </div>

              {/* Action CTA Block */}
              <div className="border-t border-dashed border-black/10 pt-8 mt-2 flex flex-col gap-4">
                <h3 className="font-serif text-lg font-bold text-foreground m-0 leading-snug">
                  {isLoggedIn ? t('ui', 'friend_cta_title_loggedin') : t('ui', 'friend_cta_title')}
                </h3>
                <p className="font-sans text-xs sm:text-[13px] leading-relaxed text-muted-foreground m-0 max-w-[480px]">
                  {isLoggedIn ? t('ui', 'friend_cta_desc_loggedin') : t('ui', 'friend_cta_desc')}
                </p>
                <div className="pt-2">
                  {isLoggedIn ? (
                    <button
                      type="button"
                      onClick={handleGoToDashboard}
                      className="shadow-contact-sm w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all duration-300 hover:scale-[1.02]"
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      <span>{t('ui', 'friend_goto_dashboard_btn')}</span>
                      <span>➔</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartOwn}
                      className="shadow-contact-sm w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all duration-300 hover:scale-[1.02]"
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      <span>{t('ui', 'friend_create_own_btn')}</span>
                      <span>➔</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        <style>{`
          .friend-result-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2.5rem;
            align-items: center;
          }
          
          .premium-result-card-container {
            width: 100%;
            max-width: 360px;
          }

          @media (min-width: 860px) {
            .friend-result-grid {
              grid-template-columns: 1fr 1.25fr;
              gap: 4.5rem;
            }
          }

          .animate-scale-in {
            animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
