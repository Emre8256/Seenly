import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';

export default function LocaleSwitch() {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang) => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <div className="locale-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="locale-globe-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid rgba(11, 27, 44, 0.08)',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-deep-ink)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 5px rgba(11, 27, 44, 0.02)',
          padding: 0
        }}
      >
        {/* Globe/World Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="locale-dropdown-menu"
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid rgba(11, 27, 44, 0.08)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(11, 27, 44, 0.08)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 1000,
            minWidth: '90px',
            animation: 'fadeInUp 0.15s ease'
          }}
        >
          <button
            type="button"
            onClick={() => handleSelect('tr')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: locale === 'tr' ? 'rgba(217, 106, 83, 0.08)' : 'transparent',
              color: locale === 'tr' ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
              fontFamily: 'var(--font-sans)',
              fontWeight: locale === 'tr' ? '700' : '500',
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>TR</span>
            {locale === 'tr' && <span style={{ fontSize: '0.75rem' }}>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => handleSelect('en')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: locale === 'en' ? 'rgba(217, 106, 83, 0.08)' : 'transparent',
              color: locale === 'en' ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
              fontFamily: 'var(--font-sans)',
              fontWeight: locale === 'en' ? '700' : '500',
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>ENG</span>
            {locale === 'en' && <span style={{ fontSize: '0.75rem' }}>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
