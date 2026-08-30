import React, { memo } from 'react';
import { CharacterBalanceBanner, SocialSignalsPanel } from './DashboardSharedComponents';

const SelfPerceptionTab = memo(function SelfPerceptionTab({
  langCode,
  selfSignatureName,
  selfRarity,
  selfSignatureCardLine,
  SIGNATURE_IMAGES,
  activeSelfSignatureId,
  getDashboardWhatsAppLink,
  handleDashboardInstagramStory,
  isGenerating,
  get10Signals
}) {
  const signals = get10Signals(langCode, false);

  return (
    <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
      <div className="flex flex-col gap-5 w-full box-border">
        {/* Horizontal General Statistics Banner */}
        <CharacterBalanceBanner
          signals={signals}
          langCode={langCode}
        />

        {/* Main Flow: Left Archetype Card + Right 10 Social Signals */}
        <div className="seenly-signal-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5">
          {/* Left Column: Glass Card */}
          <div className="seenly-signal-summary-wrap flex flex-col items-center z-10 w-full md:w-[340px] lg:w-[350px] flex-shrink-0">
            <div
              className="seenly-dashboard-premium-card seenly-signal-summary-card p-4 sm:p-6 flex flex-col items-center justify-between text-center relative rounded-[24px] sm:rounded-[32px] w-full h-full box-border"
              style={{
                background: '#FDFBF4',
                backgroundColor: '#FDFBF4',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                opacity: 1
              }}
            >
              {/* Top Section: Title + Rarity Badge + Description */}
              <div className="flex flex-col items-start text-left w-full px-0.5 sm:px-1 mb-2">
                <div className="flex items-center justify-between gap-2 w-full mb-1.5 flex-nowrap">
                  <h3
                    className="font-serif m-0 whitespace-nowrap"
                    style={{
                      fontSize: 'clamp(1.15rem, 1.8vw, 1.35rem)',
                      fontWeight: 700,
                      color: '#1A3E72',
                      lineHeight: 1.18,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {selfSignatureName}
                  </h3>

                  {/* Rarity Pill Badge */}
                  <div
                    className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap transition-all duration-200"
                    style={{
                      backgroundColor: selfRarity.badgeBg,
                      color: selfRarity.badgeText,
                      border: `1px solid ${selfRarity.badgeBorder}`,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.01em'
                    }}
                  >
                    <span>{selfRarity.badgeLabel}</span>
                  </div>
                </div>

                {selfSignatureCardLine && (
                  <p
                    className="m-0 max-w-[295px] mt-1"
                    style={{
                      fontFamily: "'Newsreader', Georgia, serif",
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#4B5568',
                      fontWeight: 400,
                      letterSpacing: '0.01em'
                    }}
                  >
                    {selfSignatureCardLine}
                  </p>
                )}
              </div>

              {/* Middle Artwork */}
              <div
                className="relative w-full max-w-[280px] sm:max-w-[315px] flex items-center justify-center my-1 sm:my-2"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                  maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                }}
              >
                <img
                  src={SIGNATURE_IMAGES[activeSelfSignatureId]}
                  alt={selfSignatureName}
                  className="w-full h-auto object-contain pointer-events-none select-none scale-[1.03] sm:scale-[1.04]"
                  style={{
                    mixBlendMode: 'multiply',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                    maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                  }}
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full mt-auto pt-2 box-border">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('seenly_selected_identity', activeSelfSignatureId);
                    window.location.hash = '#/identities';
                  }}
                  className="flex-1 h-[42px] sm:h-[46px] px-3 sm:px-4 rounded-full text-white flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    background: '#1A3E72',
                    boxShadow: '0 4px 14px rgba(26, 62, 114, 0.22)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.02em'
                  }}
                >
                  <span>{langCode === 'tr' ? 'Detaylı Analizi Gör' : 'View Detailed Analysis'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 opacity-95">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                {/* WhatsApp Share Button */}
                <a
                  href={getDashboardWhatsAppLink(selfSignatureName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[42px] sm:w-[46px] h-[42px] sm:h-[46px] rounded-[14px] sm:rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(26, 62, 114, 0.16)',
                    boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
                  }}
                  title={langCode === 'tr' ? "Paylaş" : "Share"}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </a>

                {/* Bookmark / Instagram Story Button */}
                <button
                  type="button"
                  onClick={() => handleDashboardInstagramStory(selfSignatureName, SIGNATURE_IMAGES[activeSelfSignatureId])}
                  disabled={isGenerating}
                  className="w-[42px] sm:w-[46px] h-[42px] sm:h-[46px] rounded-[14px] sm:rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(26, 62, 114, 0.16)',
                    boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                    opacity: isGenerating ? 0.5 : 1
                  }}
                  title={langCode === 'tr' ? "Kaydet / Hikaye Oluştur" : "Save / Create Story"}
                >
                  {isGenerating ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 10 Social Signals */}
          <SocialSignalsPanel
            signals={signals}
            archetypeName={selfSignatureName}
            langCode={langCode}
          />
        </div>
      </div>
    </div>
  );
});

export default SelfPerceptionTab;
