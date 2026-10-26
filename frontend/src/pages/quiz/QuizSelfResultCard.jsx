import React, { memo } from 'react';
import { useLocale } from '../../context/LocaleContext';

const QuizSelfResultCard = memo(function QuizSelfResultCard({
  quizResult,
  signatureName,
  signatureCardLine,
  signatureImage,
  cardRarity,
  publicSlug,
  onComplete,
  locale,
  t: propT
}) {
  const { t: contextT } = useLocale();
  const tr = propT || contextT;

  return (
    <div className="tensignal-wizard-body tensignal-wizard-result-body" style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      height: '100%',
      maxHeight: '100%',
      padding: '0.4rem 1.2rem max(0.8rem, env(safe-area-inset-bottom)) 1.2rem',
      boxSizing: 'border-box'
    }}>
      <div
        className="tensignal-wizard-content"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 'clamp(260px, min(80vw, 40vh), 340px)',
          margin: 'auto 0',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Header Section: Archetype Title */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          marginBottom: 'clamp(10px, 1.8vh, 18px)'
        }}>
          <h2 style={{
            fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, min(6.8vw, 4.2vh), 2.75rem)',
            fontWeight: 600,
            color: '#0B1B2C',
            margin: 0,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            wordBreak: 'break-word'
          }}>
            {signatureName}
          </h2>
        </div>

        {/* 2. Artwork Chic 3:4 Luxury Portrait Card Frame */}
        {signatureImage && (
          <div style={{
            position: 'relative',
            width: 'clamp(220px, min(72vw, 36vh), 275px)',
            height: 'clamp(293px, min(96vw, 48vh), 366px)',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '1px solid rgba(197, 160, 89, 0.32)',
            boxShadow: 'none',
            background: '#ffffff',
            boxSizing: 'border-box',
            flexShrink: 0
          }}>
            {/* Classic Rarity Pill Badge */}
            {cardRarity && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 3,
                  backgroundColor: cardRarity.badgeBg,
                  color: cardRarity.badgeText,
                  border: `1px solid ${cardRarity.badgeBorder}`,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  boxShadow: 'none'
                }}
              >
                <span>{cardRarity.badgeLabel}</span>
              </div>
            )}

            <img
              src={signatureImage}
              alt={signatureName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        )}

        {/* 3. Description Paragraph */}
        {signatureCardLine && (
          <p style={{
            fontFamily: "'Newsreader', 'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(0.92rem, 1.55vh, 1.06rem)',
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: '1.45',
            color: '#1E293B',
            marginTop: 'clamp(10px, 1.8vh, 18px)',
            marginBottom: 0,
            textAlign: 'center',
            maxWidth: 'clamp(260px, 80vw, 320px)',
            width: '100%'
          }}>
            {signatureCardLine}
          </p>
        )}
      </div>

      {/* Bottom Actions Area */}
      <div className="tensignal-wizard-footer-action" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 'clamp(220px, min(72vw, 36vh), 275px)',
        marginTop: 'auto',
        paddingTop: 'clamp(10px, 1.8vh, 18px)',
        paddingBottom: 'clamp(6px, 1.2vh, 12px)',
        flexShrink: 0,
        boxSizing: 'border-box'
      }}>
        {/* Primary Button: Profilimi Gör */}
        <button
          type="button"
          className="tensignal-wizard-primary-btn"
          style={{
            width: '100%',
            height: '48px',
            minHeight: '48px',
            borderRadius: '16px',
            background: '#0b1b2c',
            color: '#ffffff',
            fontSize: 'clamp(0.92rem, 1.5vh, 0.98rem)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: 0,
            boxShadow: '0 8px 24px rgba(11, 27, 44, 0.16)',
            cursor: 'pointer',
            boxSizing: 'border-box',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onClick={() => {
            const token = quizResult?.ownerToken || localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
            if (onComplete) onComplete(token);
          }}
        >
          <span>{tr('quiz.results.viewProfileBtn')}</span>
          <span style={{ fontSize: '0.94rem' }}>➔</span>
        </button>
      </div>
    </div>
  );
});

export default QuizSelfResultCard;
