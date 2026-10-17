import React from 'react';
import { useLocale } from '../../context/LocaleContext';
import AppShell from '../../components/AppShell';
import './LegalPage.css';

export function renderTextWithFormatting(text) {
  if (!text) return null;
  const parts = text.split(/(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`} className="tensignal-legal-link">
          {part}
        </a>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function renderLegalBlock(block, blockIndex) {
  if (!block) return null;
  if (block.type === 'p') {
    return (
      <p
        key={blockIndex}
        className="tensignal-legal-text"
        style={block.style === 'italic' ? { fontStyle: 'italic', color: '#64748B' } : undefined}
      >
        {renderTextWithFormatting(block.text)}
      </p>
    );
  }
  if (block.type === 'h3') {
    return (
      <h3 key={blockIndex} className="tensignal-legal-subtitle">
        {block.text}
      </h3>
    );
  }
  if (block.type === 'highlight') {
    return (
      <div key={blockIndex} className="tensignal-legal-highlight-box is-success">
        <p className="tensignal-legal-highlight-text">
          {renderTextWithFormatting(block.text)}
        </p>
      </div>
    );
  }
  if (block.type === 'list') {
    return (
      <ul key={blockIndex} className="tensignal-legal-list">
        {block.items.map((item, itemIdx) => (
          <li key={itemIdx}>{renderTextWithFormatting(item)}</li>
        ))}
      </ul>
    );
  }
  return null;
}

export default function LegalDocumentView({ docKey, fullWidth = false }) {
  const { t, getObject } = useLocale();
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/';
    }
  };

  const doc = getObject('legal', docKey);
  const sections = doc?.sections || [];

  return (
    <AppShell isDashboard={false} fullWidth={fullWidth}>
      <div className="tensignal-legal-container">
        <button
          type="button"
          onClick={handleBack}
          className="tensignal-legal-back-btn"
          aria-label={t('accessibility.goBack')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t('legal.chrome.backHome')}</span>
        </button>

        <article className="tensignal-legal-card tensignal-privacy-card">
          <header className="tensignal-legal-header">
            <h1 className="tensignal-legal-title">{t(`legal.${docKey}.title`)}</h1>
            <p className="tensignal-legal-meta">
              {t('legal.chrome.lastUpdated', { date: t(`legal.${docKey}.lastUpdated`) })}
            </p>
          </header>

          {doc?.isFallbackBody && (
            <div
              className="tensignal-legal-fallback-notice"
              style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                borderRadius: '8px',
                background: 'rgba(217, 106, 83, 0.08)',
                border: '1px solid rgba(217, 106, 83, 0.2)',
                color: '#8a3b29',
                fontSize: '0.84rem',
                lineHeight: 1.5
              }}
            >
              {t('legal.chrome.fallbackNotice')}
            </div>
          )}

          {sections.map((section, sIdx) => (
            <section
              key={section.id || sIdx}
              id={section.id}
              className={`tensignal-legal-section${section.intro ? ' tensignal-legal-intro' : ''}`}
            >
              {section.title && (
                <h2 className="tensignal-legal-section-title">
                  {section.number && <span className="tensignal-legal-section-number">{section.number}</span>}
                  <span>{section.title}</span>
                </h2>
              )}
              {section.blocks?.map((block, bIdx) => renderLegalBlock(block, bIdx))}
            </section>
          ))}
        </article>
      </div>
    </AppShell>
  );
}
