import React, { memo } from 'react';
import { UsersRound } from 'lucide-react';
import { getAvatarSrc } from '../../images/avatars';
import {
  CharacterBalanceBanner,
  SocialSignalsPanel,
  LockedMask
} from '../dashboard/DashboardSharedComponents';
import { useLocale } from '../../context/LocaleContext';

const FriendIntroStep = memo(function FriendIntroStep({
  slug,
  snapshot,
  hasEvaluated,
  isCapped,
  handleStart,
  langCode,
  t: propT,
  outsideSignatureName,
  outsideSignatureCardLine,
  outsideRarity,
  activeOutsideSignatureId,
  SIGNATURE_IMAGES,
  getDashboardWhatsAppLink,
  handleDashboardInstagramStory,
  isGenerating,
  get10Signals,
  isLoggedIn
}) {
  const { t: contextT } = useLocale();
  const tr = propT || contextT;
  const capitalizeName = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
      })
      .join(' ');
  };

  const displayName = capitalizeName(snapshot?.displayName || 'User');
  const avatarSrc = getAvatarSrc(snapshot?.avatar);
  const responseCount = snapshot?.responseCount || 0;
  const isOutsideLocked = snapshot ? (snapshot.outsidePerceptionLocked ?? (responseCount < 3)) : true;
  const lockReason = snapshot?.outsidePerceptionLockReason || (responseCount < 3 ? 'INSUFFICIENT_RESPONSES' : 'COMPLETE_TEST_REQUIRED');
  const canDisplayOutside = !isOutsideLocked && !!snapshot?.outsideSignatureId;

  return (
    <div className="tensignal-dashboard-page-wrapper">
      <div className="tensignal-dashboard-container" style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>
        {/* Beautiful Custom Friend Profile Header */}
        <div className="flex flex-col items-center text-center w-full box-border pb-8 pt-3 sm:pt-4 md:pt-6 px-4 sm:px-6">
          {/* Profile Avatar with luxury gold border */}
          {avatarSrc ? (
            <div className="mb-4 relative">
              <img
                src={avatarSrc}
                alt={displayName}
                className="tensignal-friend-intro-avatar"
                style={{
                  width: 'clamp(88px, 14vw, 114px)',
                  height: 'clamp(88px, 14vw, 114px)',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3.5px solid rgba(197, 160, 89, 0.45)',
                  boxShadow: '0 10px 32px rgba(80, 60, 40, 0.12)',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          ) : (
            <div
              className="mb-4"
              style={{
                width: 'clamp(88px, 14vw, 114px)',
                height: 'clamp(88px, 14vw, 114px)',
                borderRadius: '50%',
                backgroundColor: '#1A3E72',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.25rem, 5vw, 2.75rem)',
                fontWeight: 700,
                boxShadow: '0 10px 32px rgba(80, 60, 40, 0.12)'
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          {/* Display Name */}
          <h2 className="font-serif text-3xl sm:text-[2.75rem] font-black text-[#0b1b2c] m-0" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {displayName}
          </h2>

          {/* Centered Participant / Response Count Badge (Same as user's own profile) */}
          <div className="flex items-center justify-center gap-2 mt-2 sm:mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] sm:text-[12.5px] font-semibold bg-[rgba(26,62,114,0.06)] text-[#1A3E72] border border-[rgba(26,62,114,0.14)] shadow-xs">
              <UsersRound size={12.5} strokeWidth={2.4} />
              <span>
                {tr('dashboard.stats.responses', { count: responseCount })}
              </span>
            </span>
          </div>

          {/* Premium Gold Divider */}
          <div className="flex items-center justify-center gap-3 my-3 sm:my-4 w-full">
            <div className="h-px w-16 bg-black/[0.06]" />
            <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
            <div className="h-px w-16 bg-black/[0.06]" />
          </div>

          {/* Perception Question */}
          <h3 className="font-serif italic text-lg sm:text-xl font-normal text-[#4A5568] leading-normal m-0" style={{ maxWidth: '640px' }}>
            {tr('participant.intro.question')}
          </h3>

          {/* Top evaluation button / capped warning / evaluated feedback */}
          {hasEvaluated ? (
            <div className="flex flex-col items-center justify-center w-full max-w-[420px] mt-6 sm:mt-7 px-6 sm:px-8 py-6 sm:py-7 box-border" style={{
              background: '#FDFBF7',
              borderRadius: '24px',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              boxShadow: '0 12px 40px rgba(80, 60, 40, 0.05)'
            }}>
              <div className="flex items-center justify-center w-[46px] h-[46px] rounded-full mb-3.5" style={{ background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h4 className="font-serif text-[1.2rem] sm:text-[1.25rem] text-[#1A3E72] m-0 mb-2 font-bold tracking-tight">
                {tr('participant.intro.evaluatedTitle')}
              </h4>
              <p className="font-sans text-[0.85rem] sm:text-[0.88rem] text-[#4A5568] leading-relaxed m-0 text-center px-1">
                {tr('participant.intro.evaluatedDesc')}
              </p>
            </div>
          ) : isCapped ? (
            <div className="flex flex-col items-center justify-center w-full max-w-[420px] mt-6 sm:mt-7 px-6 sm:px-8 py-6 sm:py-7 box-border" style={{
              background: '#FDFBF7',
              borderRadius: '24px',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              boxShadow: '0 12px 40px rgba(80, 60, 40, 0.05)'
            }}>
              <div className="flex items-center justify-center w-[46px] h-[46px] rounded-full mb-3.5" style={{ background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                <UsersRound size={22} strokeWidth={2.2} color="#C5A059" />
              </div>
              <h4 className="font-serif text-[1.2rem] sm:text-[1.25rem] text-[#1A3E72] m-0 mb-2 font-bold tracking-tight text-center">
                {tr('participant.intro.cappedTitle')}
              </h4>
              <p className="font-sans text-[0.85rem] sm:text-[0.88rem] text-[#4A5568] leading-relaxed m-0 text-center px-1">
                {tr('participant.intro.cappedDesc', { name: displayName })}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="w-full max-w-[340px] h-[48px] sm:h-[52px] rounded-full font-sans font-bold text-xs sm:text-[13px] tracking-[0.06em] text-white flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer border-none text-center uppercase hover:-translate-y-0.5"
              style={{
                background: '#1A3E72',
                boxShadow: '0 10px 24px rgba(26, 62, 114, 0.22)',
                marginTop: '1.75rem'
              }}
            >
              <span>{tr('participant.intro.evaluateCta')}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dashboard Body (Outside Perception) */}
        <div className="tensignal-dashboard-body" style={{ padding: '0 1rem sm:0 1.25rem' }}>
          <div className={`tensignal-dashboard-tab-content ${!canDisplayOutside ? 'full-width-layout' : 'tensignal-gap-editorial-content'}`} style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
            {canDisplayOutside ? (
              <div className="flex flex-col gap-5 w-full box-border">
                {/* Horizontal General Statistics Banner (Top 3 Strengths & Weaknesses) */}
                <CharacterBalanceBanner
                  signals={get10Signals(langCode)}
                  langCode={langCode}
                />

                {/* Main Flow: Left Archetype Card + Right 10 Social Signals */}
                <div className="tensignal-outside-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5">
                  {/* Left Column: Archetype Glass Card */}
                  <div className="tensignal-outside-summary-wrap flex flex-col items-center z-10 w-full md:w-[340px] lg:w-[350px] flex-shrink-0">
                    <div className="tensignal-dashboard-premium-card tensignal-outside-summary-card p-4 sm:p-6 flex flex-col items-center justify-between text-center relative rounded-[24px] sm:rounded-[32px] w-full h-full box-border" style={{
                      background: '#FDFBF4',
                      backgroundColor: '#FDFBF4',
                      border: '1px solid rgba(197, 160, 89, 0.25)',
                      boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      opacity: 1
                    }}>
                      {/* Top Section: Title + Rarity Pill Badge + Description */}
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
                            {outsideSignatureName}
                          </h3>

                          {/* Rarity Pill Badge */}
                          <div
                            className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap transition-all duration-200"
                            style={{
                              backgroundColor: outsideRarity.badgeBg,
                              color: outsideRarity.badgeText,
                              border: `1px solid ${outsideRarity.badgeBorder}`,
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '11px',
                              fontWeight: 600,
                              letterSpacing: '0.01em'
                            }}
                          >
                            <span>{outsideRarity.badgeLabel}</span>
                          </div>
                        </div>

                        {outsideSignatureCardLine && (
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
                            {outsideSignatureCardLine}
                          </p>
                        )}
                      </div>

                      {/* Middle Artwork - Seamless Organic Watercolor Vignette */}
                      <div
                        className="relative w-full max-w-[280px] sm:max-w-[315px] flex items-center justify-center my-1 sm:my-2"
                        style={{
                          WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                          maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                        }}
                      >
                        <img
                          src={SIGNATURE_IMAGES[activeOutsideSignatureId]}
                          alt={outsideSignatureName}
                          className="w-full h-auto object-contain pointer-events-none select-none scale-[1.03] sm:scale-[1.04]"
                          style={{
                            mixBlendMode: 'multiply',
                            WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                          }}
                        />
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="w-full mt-auto pt-2 box-border flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem('tensignal_selected_identity', activeOutsideSignatureId);
                            window.location.hash = '#/identities';
                          }}
                          className="w-full h-[42px] sm:h-[46px] px-4 sm:px-5 rounded-[14px] sm:rounded-[16px] text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                          style={{
                            background: '#1A3E72',
                            boxShadow: '0 4px 14px rgba(26, 62, 114, 0.22)',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12.5px',
                            fontWeight: 500,
                            letterSpacing: '0.02em'
                          }}
                        >
                          <span>{tr('dashboard.outside.viewDetailed')}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-95">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 10 Social Signals in Grid */}
                  <SocialSignalsPanel
                    signals={get10Signals(langCode)}
                    archetypeName={outsideSignatureName}
                    langCode={langCode}
                  />
                </div>
              </div>
            ) : (
              <div className="tensignal-dashboard-locked-state" style={{ width: '100%' }}>
                {lockReason === 'COMPLETE_TEST_REQUIRED' ? (
                  <LockedMask
                    title={tr('participant.intro.lockedCompleteTestTitle')}
                    description={tr('participant.intro.lockedCompleteTestDesc')}
                    showProgress={false}
                    langCode={langCode}
                  />
                ) : (
                  <LockedMask
                    title={tr('participant.intro.lockedMaskTitle')}
                    description={tr('participant.intro.lockedMaskDesc')}
                    responseCount={responseCount}
                    targetCount={3}
                    showProgress={true}
                    langCode={langCode}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action CTA Button Section: Create your own link */}
        {!isLoggedIn && (
          <div style={{
            marginTop: '3rem',
            marginBottom: '2rem',
            padding: '0 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <button
              type="button"
              onClick={() => window.location.hash = '#/'}
              className="font-sans font-bold text-xs sm:text-[13px] tracking-[0.06em] text-[#1A3E72] transition-all duration-200 cursor-pointer text-center uppercase hover:text-[#C5A059]"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                textDecoration: 'underline',
                textUnderlineOffset: '4px'
              }}
            >
              {tr('participant.intro.createOwnLink')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default FriendIntroStep;
