import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function ResultIdentityCard({ signatureId, familyId }) {
  const { t, getObject } = useLocale();

  const signature = getObject('signatures', signatureId);
  const family = getObject('families', familyId);

  // Safe fallback rendering mechanisms to prevent application crashes
  const signatureName = signature ? signature.name : t('common.unknownSignature');
  const signatureOneLine = signature ? signature.oneLine : "";
  const signatureCardLine = signature ? signature.cardLine : "";

  const familyName = family ? family.name : "";
  const familyDesc = family ? family.description : "";

  return (
    <div className="editorial-card" style={{ textAlign: 'center' }}>
      <div className="editorial-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        {familyName && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '0.75rem',
            fontWeight: 600
          }}>
            {familyName}
          </span>
        )}
        <h2 className="editorial-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem', margin: 0 }}>
          {signatureName}
        </h2>
        {familyDesc && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            margin: '0.5rem auto 0 auto',
            maxWidth: '80%',
            lineHeight: '1.4'
          }}>
            {familyDesc}
          </p>
        )}
      </div>

      <div className="editorial-body" style={{ margin: '2rem 0 0 0' }}>
        {signatureOneLine && (
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
            color: 'var(--color-text-primary)',
            fontStyle: 'italic'
          }}>
            "{signatureOneLine}"
          </p>
        )}
        
        {signatureCardLine && (
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.25rem',
            marginTop: '1.5rem',
            letterSpacing: '0.02em'
          }}>
            {signatureCardLine}
          </p>
        )}
      </div>
    </div>
  );
}
