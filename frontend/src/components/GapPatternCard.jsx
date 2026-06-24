import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function GapPatternCard({ gapPatternId, gapStrength, selfSignatureId, outsideSignatureId }) {
  const { locale, t, getObject } = useLocale();

  const gapObj = getObject('gaps', gapPatternId) || {
    name: gapPatternId || 'Awaiting Calibration',
    description: 'Signals are being computed.'
  };

  const selfSig = getObject('signatures', selfSignatureId);
  const outsideSig = getObject('signatures', outsideSignatureId);

  return (
    <div className="editorial-card" style={{
      animation: 'fadeIn 0.5s ease',
      borderLeft: '4px solid var(--color-smoky-lavender)',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(11, 27, 44, 0.04)',
      width: '100%',
      padding: '2rem'
    }}>
      {/* Header Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '1.25rem',
        borderBottom: '1px solid rgba(11, 27, 44, 0.06)',
        paddingBottom: '0.85rem'
      }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.45rem',
          fontWeight: '900',
          margin: 0,
          color: 'var(--color-deep-ink)'
        }}>
          {gapObj.name}
        </h3>
        
        {gapStrength && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            color: 'var(--color-burnt-coral)',
            background: 'rgba(217, 106, 83, 0.08)',
            padding: '3px 10px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700
          }}>
            {t('ui', 'gap_strength_label')}: {t('ui', 'strength_' + gapStrength) || gapStrength}
          </span>
        )}
      </div>

      <p className="editorial-body" style={{
        color: 'var(--color-deep-ink)',
        opacity: 0.85,
        lineHeight: '1.65',
        margin: '0 0 2rem 0',
        fontSize: '1.02rem',
        textAlign: 'left'
      }}>
        {gapObj.description}
      </p>

      {selfSig && outsideSig && (
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.75rem',
          borderTop: '1px dashed rgba(11, 27, 44, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <h4 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-smoky-lavender)',
            margin: 0,
            textAlign: 'left'
          }}>
            {locale === 'tr' ? 'Algı Karşılaştırması' : 'Perception Comparison'}
          </h4>

          <div className="gap-comparison-grid">
            {/* Self panel */}
            <div style={{
              background: 'rgba(11, 27, 44, 0.02)',
              border: '1px solid rgba(11, 27, 44, 0.06)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(11, 27, 44, 0.01)'
            }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                display: 'block',
                marginBottom: '0.4rem',
                opacity: 0.7
              }}>
                {locale === 'tr' ? 'Kendini Nasıl Görüyorsun' : 'How You See Yourself'}
              </span>
              <h5 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 900,
                margin: '0 0 0.5rem 0',
                color: 'var(--color-deep-ink)'
              }}>
                {selfSig.name}
              </h5>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.5',
                margin: 0
              }}>
                {selfSig.oneLine}
              </p>
            </div>

            {/* Connection line / indicator */}
            <div className="gap-comparison-divider">
              <div className="gap-comparison-line">
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'var(--color-burnt-coral)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 10px rgba(217, 106, 83, 0.25)'
                }}>
                  {locale === 'tr' ? 'FARK' : 'GAP'}
                </div>
              </div>
            </div>

            {/* Outside panel */}
            <div style={{
              background: 'rgba(217, 106, 83, 0.02)',
              border: '1px solid rgba(217, 106, 83, 0.12)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(217, 106, 83, 0.01)'
            }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-burnt-coral)',
                fontWeight: 700,
                display: 'block',
                marginBottom: '0.4rem'
              }}>
                {locale === 'tr' ? 'İnsanlar Seni Nasıl Görüyor' : 'How Friends See You'}
              </span>
              <h5 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 900,
                margin: '0 0 0.5rem 0',
                color: 'var(--color-deep-ink)'
              }}>
                {outsideSig.name}
              </h5>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.5',
                margin: 0
              }}>
                {outsideSig.oneLine}
              </p>
            </div>
          </div>

          {/* Pro Insight section */}
          <div style={{
            marginTop: '0.5rem',
            background: 'rgba(143, 123, 204, 0.06)',
            borderLeft: '4px solid var(--color-smoky-lavender)',
            padding: '14px 18px',
            borderRadius: '0 10px 10px 0',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(143, 123, 204, 0.02)'
          }}>
            <strong style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              color: 'var(--color-smoky-lavender)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>💡</span>
              <span>{locale === 'tr' ? 'Fark Analizi Rehberi' : 'Gap Analysis Insight'}</span>
            </strong>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.88rem',
              color: 'var(--color-deep-ink)',
              opacity: 0.85,
              lineHeight: '1.5',
              margin: 0
            }}>
              {locale === 'tr'
                ? 'Bu fark, kendi içsel algınız ile dış dünyaya yaydığınız sosyal sinyaller arasındaki eşsiz kesişimi temsil eder. Bir uyumsuzluk olmanın ötesinde, başkalarında bıraktığınız saklı ve özgün etkinin bir göstergesidir.'
                : 'This gap represents the unique intersection between your inner self-perception and the social signals you radiate to the outside world. Rather than a misalignment, it highlights the hidden, authentic impact you leave on others.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
