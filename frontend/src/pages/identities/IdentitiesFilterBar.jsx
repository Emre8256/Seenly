import React, { memo } from 'react';
import { FAMILIES_LIST } from './identitiesData';

const IdentitiesFilterBar = memo(function IdentitiesFilterBar({
  searchQuery,
  setSearchQuery,
  filterFamily,
  setFilterFamily,
  getFamilyLabel,
  t
}) {
  return (
    <>
      {/* Sleek Search Bar */}
      <div className="relative max-w-[440px] mx-auto mb-6 sm:mb-8 w-full box-border animate-fade-in px-2 sm:px-0">
        <input
          type="text"
          placeholder={t('ui', 'identities_search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 2.5rem 0.7rem 2.6rem',
            borderRadius: '9999px',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            fontSize: '0.86rem',
            fontFamily: 'var(--font-sans), sans-serif',
            color: 'var(--color-deep-ink)',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 16px rgba(80, 60, 40, 0.04)',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--peach)';
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.boxShadow = '0 0 0 3px rgba(217, 106, 83, 0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(197, 160, 89, 0.35)';
            e.target.style.backgroundColor = '#FFFFFF';
            e.target.style.boxShadow = '0 4px 16px rgba(80, 60, 40, 0.04)';
          }}
        />
        <div style={{
          position: 'absolute',
          left: '1.25rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#8C6D37',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
            aria-label="Aramayı temizle"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Category Family Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-10 sm:mb-12 animate-fade-in px-1">
        {FAMILIES_LIST.map(fam => {
          const isActive = filterFamily === fam;
          return (
            <button
              key={fam}
              onClick={() => setFilterFamily(fam)}
              className={`font-sans text-[11.5px] sm:text-xs font-semibold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 cursor-pointer border ${isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                : 'bg-white/60 text-foreground/75 border-black/5 hover:border-gold/40 hover:bg-white'
                }`}
            >
              {getFamilyLabel(fam)}
            </button>
          );
        })}
      </div>
    </>
  );
});

export default IdentitiesFilterBar;
