import React, { memo } from 'react';
import { SHARE_CARD_TYPES } from '../../services/shareService';
import brandLogoPng from '../../images/Icons/10Signal.png';

/**
 * ShareStoryCard
 * Renders the luxury 4:3 (1080x810) share card layout.
 * Supports both:
 * - isExport=true: Fixed 1080px x 810px rendering for pixel-perfect html2canvas export
 * - isExport=false: Responsive 4:3 layout for the in-modal interactive preview
 */
const ShareStoryCard = memo(function ShareStoryCard({
  cardData,
  isExport = false,
  imageSrcOverride = null,
  logoSrcOverride = null,
  t
}) {
  if (!cardData) return null;

  const isPersonality = cardData.type === SHARE_CARD_TYPES.PERSONALITY;
  const title = cardData.title || '';
  const description = cardData.description || '';
  const rarity = isPersonality ? cardData.rarity : null;
  const imageSrc = imageSrcOverride || cardData.imageSrc;
  const brandLogo = logoSrcOverride || brandLogoPng;

  const brandName = t ? t('common.socialShare.brandName') : '10SIGNAL';
  const watermarkText = t ? t('common.socialShare.brandWatermark') : '10signal.me';

  // ─────────────────────────────────────────────────────────────
  // 1. EXPORT MODE (1080 x 810 fixed pixel styling for 4:3 canvas)
  // ─────────────────────────────────────────────────────────────
  if (isExport) {
    const isLongTitle = title.length > 18;

    return (
      <div
        id="tensignal-export-story-card"
        style={{
          width: '1080px',
          height: '810px',
          backgroundColor: '#FDFBF7',
          backgroundImage: `
            radial-gradient(circle at 14% 18%, rgba(197, 160, 89, 0.14) 0%, transparent 55%),
            radial-gradient(circle at 86% 82%, rgba(214, 185, 200, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(247, 235, 224, 0.18) 0%, transparent 70%)
          `,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '40px 44px 40px 40px',
          boxSizing: 'border-box',
          fontFamily: 'Georgia, "Newsreader", "Times New Roman", serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        {/* Subtle Decorative Outer Framing Inset */}
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            borderRadius: '26px',
            border: '1px solid rgba(197, 160, 89, 0.28)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Left Column: Artwork Frame (approx 42% width) */}
        <div
          style={{
            position: 'relative',
            width: '420px',
            height: '730px',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '1.5px solid rgba(197, 160, 89, 0.35)',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 16px 40px rgba(11, 27, 44, 0.08), 0 2px 10px rgba(197, 160, 89, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            flexShrink: 0
          }}
        >
          {/* Rarity Pill Badge (Personality only) */}
          {isPersonality && rarity && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 4,
                backgroundColor: rarity.badgeBg || '#FEF3C7',
                color: rarity.badgeText || '#92400E',
                border: `1.5px solid ${rarity.badgeBorder || '#F59E0B'}`,
                padding: '6px 16px',
                borderRadius: '9999px',
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              {rarity.badgeLabel}
            </div>
          )}

          {/* Illustration Image */}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={title}
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          )}
        </div>

        {/* Right Column: Typography & Signature (approx 53% width) */}
        <div
          style={{
            flex: 1,
            height: '730px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px 10px 14px 48px',
            boxSizing: 'border-box',
            zIndex: 2
          }}
        >
          {/* Top Brand Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <img
              src={brandLogo}
              alt={brandName}
              crossOrigin="anonymous"
              style={{
                height: '34px',
                width: 'auto',
                maxWidth: '140px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 0 12px 0'
              }}
            />

            {/* Gold Star Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '152px'
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'rgba(197, 160, 89, 0.35)' }} />
              <span style={{ fontSize: '11px', color: '#C5A059' }}>✦</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(197, 160, 89, 0.35)' }} />
            </div>
          </div>

          {/* Middle: Unified Hero Content Group (Title + Star + Description) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              width: '100%',
              maxWidth: '510px',
              margin: 'auto 0'
            }}
          >
            {/* Result Title */}
            <h2
              style={{
                fontFamily: 'Georgia, "Playfair Display", "Newsreader", serif',
                fontSize: isLongTitle ? '38px' : '46px',
                fontWeight: 700,
                color: '#0B1B2C',
                margin: '0 0 10px 0',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word'
              }}
            >
              {title}
            </h2>

            {/* Star Ornament */}
            <span
              style={{
                fontSize: '14px',
                color: '#C5A059',
                margin: '0 0 12px 0',
                opacity: 0.95
              }}
            >
              ✦
            </span>

            {/* Description Quote */}
            {description && (
              <p
                style={{
                  fontFamily: 'Georgia, "Newsreader", serif',
                  fontStyle: 'italic',
                  fontSize: '21px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: '#554234',
                  margin: '0',
                  maxWidth: '490px'
                }}
              >
                "{description}"
              </p>
            )}
          </div>

          {/* Bottom Platform Signature */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ width: '32px', height: '1px', background: 'rgba(11, 27, 44, 0.2)' }} />
            <span
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.24em',
                color: 'rgba(11, 27, 44, 0.48)',
                textTransform: 'uppercase'
              }}
            >
              {watermarkText}
            </span>
            <div style={{ width: '32px', height: '1px', background: 'rgba(11, 27, 44, 0.2)' }} />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PREVIEW MODE (Responsive 4:3 layout for in-modal preview)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-[18px] sm:rounded-[22px] overflow-hidden flex flex-row items-stretch p-3.5 sm:p-4 md:p-5 box-border select-none"
      style={{
        backgroundColor: '#FDFBF7',
        backgroundImage: `
          radial-gradient(circle at 14% 18%, rgba(197, 160, 89, 0.14) 0%, transparent 55%),
          radial-gradient(circle at 86% 82%, rgba(214, 185, 200, 0.12) 0%, transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(247, 235, 224, 0.18) 0%, transparent 70%)
        `,
        border: '1px solid rgba(197, 160, 89, 0.28)',
        boxShadow: '0 12px 32px rgba(11, 27, 44, 0.08), 0 2px 8px rgba(197, 160, 89, 0.1)'
      }}
    >
      {/* Delicate Inner Framing */}
      <div
        className="absolute inset-2 sm:inset-2.5 rounded-[14px] pointer-events-none"
        style={{
          border: '1px solid rgba(197, 160, 89, 0.22)'
        }}
      />

      {/* Left Column: Artwork Box */}
      <div
        className="relative w-[42%] rounded-[14px] overflow-hidden bg-white z-10 flex items-center justify-center flex-shrink-0"
        style={{
          border: '1.5px solid rgba(197, 160, 89, 0.35)',
          boxShadow: '0 6px 18px rgba(11, 27, 44, 0.06)'
        }}
      >
        {/* Rarity Pill Badge */}
        {isPersonality && rarity && (
          <div
            className="absolute top-1.5 right-1.5 z-20 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-sans font-bold tracking-wider uppercase shadow-xs"
            style={{
              backgroundColor: rarity.badgeBg || '#FEF3C7',
              color: rarity.badgeText || '#92400E',
              border: `1px solid ${rarity.badgeBorder || '#F59E0B'}`
            }}
          >
            {rarity.badgeLabel}
          </div>
        )}

        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover block pointer-events-none"
          />
        ) : (
          <div className="w-full h-full bg-[#F5EFE6] flex items-center justify-center">
            <span className="text-xs text-[#0B1B2C]/40">10Signal</span>
          </div>
        )}
      </div>

      {/* Right Column: Typography & Signature */}
      <div className="flex-1 pl-3.5 sm:pl-4 md:pl-5 flex flex-col justify-between py-1 z-10 box-border text-left">
        {/* Brand Header with Real Logo */}
        <div>
          <img
            src={brandLogo}
            alt={brandName}
            className="h-3.5 sm:h-4 md:h-[18px] w-auto max-w-[85px] sm:max-w-[95px] object-contain block mb-1"
          />
          <div className="flex items-center gap-1.5 w-16 sm:w-20">
            <div className="flex-1 h-px bg-[#C5A059]/35" />
            <span className="text-[7px] text-[#C5A059]">✦</span>
            <div className="flex-1 h-px bg-[#C5A059]/35" />
          </div>
        </div>

        {/* Unified Center Content Group */}
        <div className="my-auto py-1">
          <h3
            className="font-serif text-xs sm:text-sm md:text-base font-bold text-[#0B1B2C] leading-tight m-0 mb-1 line-clamp-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>

          <span className="text-[8px] text-[#C5A059] block mb-1">✦</span>

          {description && (
            <p className="font-serif italic text-[9.5px] sm:text-[10.5px] leading-snug text-[#554234] m-0 line-clamp-3">
              "{description}"
            </p>
          )}
        </div>

        {/* Signature */}
        <div className="flex items-center gap-1.5 opacity-60">
          <div className="w-3.5 h-px bg-[#0B1B2C]/30" />
          <span className="font-sans text-[7px] sm:text-[8px] font-semibold tracking-widest text-[#0B1B2C] uppercase">
            {watermarkText}
          </span>
          <div className="w-3.5 h-px bg-[#0B1B2C]/30" />
        </div>
      </div>
    </div>
  );
});

export default ShareStoryCard;
