import React, { memo } from 'react';

const FriendResultPreview = memo(function FriendResultPreview({
  styleId,
  styleObj,
  accuracy,
  accuracyOffset,
  READER_CARD_IMAGES,
  getWhatsAppShareLink,
  handleInstagramShare,
  isGenerating,
  handleStartOwn,
  handleGoToDashboard,
  isLoggedIn,
  langCode,
  t
}) {
  return (
    <div className="mx-auto w-full max-w-[1020px] px-4 sm:px-6 md:px-8 relative z-10 box-border">
      {/* 1. MOBILE-ONLY TOP HEADER */}
      <div className="flex md:hidden flex-col items-center text-center w-full mb-6 animate-scale-in px-2">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold leading-tight text-foreground tracking-tight m-0 mb-2">
          {t('participant.result.completedTitle')}
        </h2>

        {/* Gold Star Divider */}
        <div className="flex items-center justify-center gap-2.5 my-2 w-full">
          <div className="h-px w-12 bg-black/[0.06]" />
          <span className="text-[10px] text-[#C5A059] opacity-70">✦</span>
          <div className="h-px w-12 bg-black/[0.06]" />
        </div>

        <p className="font-sans text-xs sm:text-sm leading-relaxed text-muted-foreground/90 m-0 max-w-[540px]">
          {t('participant.result.completedDesc')}
        </p>
      </div>

      {/* 2. MAIN CONTENT GRID */}
      <div className="flex flex-col md:grid md:grid-cols-[330px_1fr] lg:grid-cols-[350px_1fr] gap-6 lg:gap-10 items-center md:items-center justify-center w-full">
        {/* Luxury Reader Card (Left Column on Desktop, Centered on Mobile) */}
        <div className="flex flex-col items-center w-full max-w-[300px] md:max-w-none flex-shrink-0 animate-scale-in">
          <div
            className="seenly-dashboard-premium-card p-4 sm:p-5 flex flex-col items-center justify-between text-center relative rounded-[26px] sm:rounded-[30px] w-full box-border"
            style={{
              background: '#FDFBF4',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              boxShadow: 'none'
            }}
          >
            <div className="flex flex-col items-center justify-center flex-1 w-full py-1">
              {/* Portrait Frame with Soft Gold Border */}
              <div
                className="relative w-full max-w-[250px] sm:max-w-[280px] aspect-[3/4] mb-3 overflow-hidden rounded-[20px] bg-white box-border"
                style={{
                  border: '1.5px solid rgba(197, 160, 89, 0.35)',
                  boxShadow: 'none'
                }}
              >
                <img
                  src={READER_CARD_IMAGES[styleId] || READER_CARD_IMAGES.clear_reader}
                  alt={styleObj.name}
                  className="w-full h-full object-cover relative z-10 block"
                />
              </div>

              {/* Title & OneLine Quote */}
              <div className="w-full px-1 text-center">
                <h3
                  className="font-serif text-2xl sm:text-[1.65rem] font-black text-foreground mb-1 leading-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {styleObj.name}
                </h3>

                {/* Gold Star Divider */}
                <div className="flex items-center justify-center gap-2.5 my-2 w-full">
                  <div className="h-px w-12 bg-black/[0.06]" />
                  <span className="text-[10px] text-[#C5A059] opacity-70">✦</span>
                  <div className="h-px w-12 bg-black/[0.06]" />
                </div>

                {styleObj.oneLine && (
                  <p className="font-sans text-[0.84rem] sm:text-[0.88rem] leading-relaxed text-muted-foreground italic px-1 m-0">
                    "{styleObj.oneLine}"
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Action Bar: Single Stylish Share Button (no navigation for now) */}
            <div className="w-full mt-auto pt-3 border-t border-[#EFE8DC] box-border flex justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="w-full max-w-[250px] sm:max-w-[280px] mx-auto h-[38px] sm:h-[42px] rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-95 hover:shadow-md active:scale-[0.98] cursor-pointer border-none select-none touch-manipulation"
                style={{
                  boxShadow: '0 3px 12px rgba(11, 27, 44, 0.12)',
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  letterSpacing: '0.025em'
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-90"
                >
                  <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>{t('common.share')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Headline + Accuracy Meter + CTA Block */}
        <div className="flex flex-col justify-center text-left w-full animate-scale-in">
          {/* Desktop Headline & Subtitle */}
          <div className="hidden md:flex flex-col text-left mb-5">
            <h2 className="font-heading text-3xl lg:text-[2.35rem] font-bold leading-[1.15] text-foreground tracking-tight m-0 mb-2.5">
              {t('participant.result.completedTitle')}
            </h2>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-px w-12 bg-black/[0.06]" />
              <span className="text-[10px] text-[#C5A059] opacity-70">✦</span>
              <div className="h-px w-12 bg-black/[0.06]" />
            </div>

            <p className="font-sans text-sm sm:text-[14.5px] leading-relaxed text-muted-foreground/90 m-0 max-w-[540px]">
              {t('participant.result.completedDesc')}
            </p>
          </div>

          {/* Accuracy Meter Section */}
          <div
            className="p-4 sm:p-5 rounded-[22px] sm:rounded-[24px] mb-4 sm:mb-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 box-border w-full"
            style={{
              background: '#FDFBF4',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              boxShadow: '0 6px 20px rgba(80, 60, 40, 0.03)'
            }}
          >
            {/* Circular Gauge */}
            <div className="relative w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] flex items-center justify-center flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 110 110" className="rotate-[-90deg] w-full h-full">
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="transparent"
                  stroke="rgba(11, 27, 44, 0.06)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="transparent"
                  stroke="var(--color-accent, #C5A059)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={accuracyOffset}
                  style={{
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <span className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-none">
                  %{Math.round(accuracy)}
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h4 className="font-serif text-[1.05rem] sm:text-[1.12rem] font-bold text-foreground mb-1 leading-snug">
                {t('participant.result.accuracyScore')}
              </h4>
              <p className="font-sans text-xs sm:text-[13px] leading-relaxed text-muted-foreground m-0">
                {t('participant.result.accuracyDesc')}
              </p>
            </div>
          </div>

          {/* Action CTA Block */}
          <div
            className="p-4 sm:p-5 rounded-[22px] sm:rounded-[24px] flex flex-col gap-2.5 sm:gap-3 w-full box-border text-center sm:text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(253, 251, 244, 0.9) 0%, rgba(245, 237, 226, 0.6) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              boxShadow: '0 8px 24px rgba(80, 60, 40, 0.03)'
            }}
          >
            <h3 className="font-serif text-base sm:text-[1.15rem] font-bold text-foreground m-0 leading-snug">
              {isLoggedIn ? t('participant.result.goToDashboardTitle') : t('participant.result.startOwnTitle')}
            </h3>
            <p className="font-sans text-xs sm:text-[13px] leading-relaxed text-muted-foreground m-0 max-w-[480px]">
              {isLoggedIn ? t('participant.result.goToDashboardDesc') : t('participant.result.startOwnDesc')}
            </p>
            <div className="pt-1 flex justify-center sm:justify-start">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="w-full sm:w-auto h-[44px] sm:h-[46px] px-7 rounded-full bg-primary text-primary-foreground font-sans font-bold text-xs sm:text-[12.5px] tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-none"
                  style={{
                    boxShadow: '0 8px 20px rgba(11, 27, 44, 0.16)'
                  }}
                >
                  <span>{t('participant.result.goToDashboardBtn')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartOwn}
                  className="w-full sm:w-auto h-[44px] sm:h-[46px] px-7 rounded-full bg-primary text-primary-foreground font-sans font-bold text-xs sm:text-[12.5px] tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-none"
                  style={{
                    boxShadow: '0 8px 20px rgba(11, 27, 44, 0.16)'
                  }}
                >
                  <span>{t('participant.result.startOwnBtn')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FriendResultPreview;
