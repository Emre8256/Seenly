import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';

export default function LocaleSwitch({ mobile = false }) {
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
        style={mobile ? {
          height: '36px',
          width: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-deep-ink)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
          boxSizing: 'border-box'
        } : {
          height: '36px',
          padding: '0 0.85rem',
          borderRadius: '18px',
          border: '1.5px solid rgba(11, 27, 44, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          color: 'var(--color-deep-ink)',
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: '0.78rem',
          fontWeight: '600',
          letterSpacing: '0.04em',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 2px 8px rgba(11, 27, 44, 0.01)',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (mobile) {
            e.currentTarget.style.color = 'var(--peach)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) svg.style.transform = 'rotate(15deg)';
            return;
          }
          e.currentTarget.style.borderColor = 'rgba(217, 106, 83, 0.35)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 106, 83, 0.06)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) svg.style.transform = 'rotate(15deg)';
        }}
        onMouseLeave={(e) => {
          if (mobile) {
            e.currentTarget.style.color = 'var(--color-deep-ink)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) svg.style.transform = '';
            return;
          }
          e.currentTarget.style.borderColor = 'rgba(11, 27, 44, 0.08)';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.55)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 27, 44, 0.01)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) svg.style.transform = '';
        }}
      >
        {/* Globe/World Icon */}
        <svg
          width={mobile ? "16" : "13"}
          height={mobile ? "16" : "13"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'transform 0.5s ease', opacity: 0.8 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {!mobile && (
          <>
            <span>{locale.toUpperCase()}</span>
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.3s ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div
          className="locale-dropdown-menu paper-grain"
          style={{
            position: 'absolute',
            top: '42px',
            right: 0,
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(11, 27, 44, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(11, 27, 44, 0.08)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 1000,
            minWidth: '100px',
            boxSizing: 'border-box'
          }}
        >
          <button
            type="button"
            onClick={() => handleSelect('tr')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: locale === 'tr' ? 'rgba(217, 106, 83, 0.08)' : 'transparent',
              color: locale === 'tr' ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: locale === 'tr' ? '700' : '500',
              fontSize: '0.82rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (locale !== 'tr') e.currentTarget.style.backgroundColor = 'rgba(217, 106, 83, 0.03)';
            }}
            onMouseLeave={(e) => {
              if (locale !== 'tr') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>TR</span>
            {locale === 'tr' && (
              <span style={{ color: 'var(--color-burnt-coral)', display: 'flex', alignItems: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSelect('en')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: locale === 'en' ? 'rgba(217, 106, 83, 0.08)' : 'transparent',
              color: locale === 'en' ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: locale === 'en' ? '700' : '500',
              fontSize: '0.82rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (locale !== 'en') e.currentTarget.style.backgroundColor = 'rgba(217, 106, 83, 0.03)';
            }}
            onMouseLeave={(e) => {
              if (locale !== 'en') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>EN</span>
            {locale === 'en' && (
              <span style={{ color: 'var(--color-burnt-coral)', display: 'flex', alignItems: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
