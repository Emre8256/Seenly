import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSeenlyShare, buildWhatsAppLink } from '../../hooks/useSeenlyShare';

const QuizSelfResultCard = memo(function QuizSelfResultCard({
  quizResult,
  signatureName,
  signatureCardLine,
  signatureImage,
  cardRarity,
  publicSlug,
  onComplete,
  locale,
  t
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { handleInstagramStory, isGenerating: isStoryGenerating } = useSeenlyShare();

  return (
    <div className="seenly-wizard-body seenly-wizard-result-body" style={{
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
        className="seenly-wizard-content"
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
            boxShadow: '0 18px 42px -6px rgba(11, 27, 44, 0.15), 0 3px 10px rgba(11, 27, 44, 0.04)',
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
                  boxShadow: '0 2px 8px rgba(11, 27, 44, 0.08)'
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
      <div className="seenly-wizard-footer-action" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(0.2rem, 0.5vh, 0.35rem)',
        width: '100%',
        maxWidth: 'clamp(220px, min(72vw, 36vh), 275px)',
        marginTop: 'auto',
        paddingTop: 'clamp(6px, 1vh, 12px)',
        paddingBottom: '0.1rem',
        flexShrink: 0,
        boxSizing: 'border-box'
      }}>
        {/* Primary Button: Profilimi Gör */}
        <button
          type="button"
          className="seenly-wizard-primary-btn"
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
            boxSizing: 'border-box'
          }}
          onClick={() => {
            const token = quizResult?.ownerToken || localStorage.getItem('seenly_owner_token');
            if (onComplete) onComplete(token);
          }}
        >
          <span>{t('ui', 'view_profile_btn') || 'Profilimi Gör'}</span>
          <span style={{ fontSize: '0.94rem' }}>➔</span>
        </button>

        {/* Secondary Button / Link: Sonucumu Paylaş */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: '0.84rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            minHeight: '30px',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{t('ui', 'share_result_btn') || 'Sonucumu paylaş'}</span>
        </button>
      </div>

      {/* Share Suite Modal Portal */}
      {showShareModal && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 27, 44, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.2rem',
            boxSizing: 'border-box',
            animation: 'fadeInUp 0.3s ease'
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: '#FDFBF7',
              borderRadius: '26px',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              boxShadow: '0 24px 64px rgba(11, 27, 44, 0.35)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.8rem 1.6rem 1.5rem 1.6rem',
              boxSizing: 'border-box',
              position: 'relative',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(11, 27, 44, 0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#0b1b2c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ×
            </button>

            {/* Header */}
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#c5a059',
              display: 'block',
              marginBottom: '4px'
            }}>
              {locale === 'tr' ? 'PAYLAŞIM MERKEZİ' : 'SHARE SUITE'}
            </span>

            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#0b1b2c',
              margin: '0 0 6px 0'
            }}>
              {locale === 'tr' ? 'Sonucunu Paylaş' : 'Share Your Result'}
            </h3>

            <p style={{
              fontSize: '0.86rem',
              color: 'rgba(11, 27, 44, 0.68)',
              lineHeight: 1.45,
              margin: '0 0 1.3rem 0',
              fontFamily: 'var(--font-serif)'
            }}>
              {locale === 'tr'
                ? 'Arkadaşlarının seni nasıl gördüğünü keşfetmek için kartını ve linkini paylaş.'
                : 'Share your card and link to discover how your circle perceives you.'}
            </p>

            {/* Share Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* 1. Instagram Story */}
              <button
                type="button"
                disabled={isStoryGenerating}
                onClick={() => {
                  handleInstagramStory(signatureName, signatureImage, publicSlug, locale);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(240, 148, 51, 0.08) 0%, rgba(220, 39, 67, 0.08) 50%, rgba(188, 24, 136, 0.08) 100%)',
                  border: '1px solid rgba(220, 39, 67, 0.25)',
                  color: '#0b1b2c',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0b1b2c' }}>Instagram Story</strong>
                    <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                      {locale === 'tr' ? 'Hikaye görseli indir ve paylaş' : 'Download story card & share'}
                    </small>
                  </div>
                </div>
                {isStoryGenerating ? (
                  <span className="spinner-mini" style={{ width: '16px', height: '16px', borderTopColor: '#dc2743' }} />
                ) : (
                  <span style={{ fontSize: '1.1rem', color: 'rgba(11, 27, 44, 0.4)' }}>➔</span>
                )}
              </button>

              {/* 2. WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const waUrl = buildWhatsAppLink(signatureName, publicSlug);
                  window.open(waUrl, '_blank');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '16px',
                  background: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.28)',
                  color: '#0b1b2c',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0b1b2c' }}>WhatsApp</strong>
                    <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                      {locale === 'tr' ? 'Arkadaşlarına doğrudan mesaj gönder' : 'Send direct invite to friends'}
                    </small>
                  </div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'rgba(11, 27, 44, 0.4)' }}>➔</span>
              </button>

              {/* 3. Copy Link */}
              <button
                type="button"
                onClick={() => {
                  const origin = window.location.origin.startsWith('http') ? window.location.origin : `https://${window.location.host}`;
                  const link = `${origin}/#/friend/${publicSlug}`;
                  navigator.clipboard.writeText(link).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2400);
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '16px',
                  background: copiedLink ? 'rgba(42, 90, 58, 0.1)' : 'rgba(11, 27, 44, 0.04)',
                  border: copiedLink ? '1px solid rgba(42, 90, 58, 0.4)' : '1px solid rgba(11, 27, 44, 0.12)',
                  color: '#0b1b2c',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: copiedLink ? '#2a5a3a' : '#0b1b2c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {copiedLink ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: copiedLink ? '#2a5a3a' : '#0b1b2c' }}>
                      {copiedLink ? (locale === 'tr' ? 'Bağlantı Kopyalandı!' : 'Link Copied!') : (locale === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Link')}
                    </strong>
                    <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                      {locale === 'tr' ? 'Profil linkini panoya kopyala' : 'Copy profile link to clipboard'}
                    </small>
                  </div>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: copiedLink ? '#2a5a3a' : '#c5a059' }}>
                  {copiedLink ? '✓' : (locale === 'tr' ? 'Kopyala' : 'Copy')}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

export default QuizSelfResultCard;
