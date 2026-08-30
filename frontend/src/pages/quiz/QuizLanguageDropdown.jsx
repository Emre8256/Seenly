import React, { memo } from 'react';

const QuizLanguageDropdown = memo(function QuizLanguageDropdown({
  locale,
  isOpen,
  onToggle,
  onSelect,
  dropdownRef
}) {
  const supportedLangs = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
  ];

  return (
    <div className="seenly-wizard-step-lang" ref={dropdownRef}>
      <button
        type="button"
        className="lang-dropdown-trigger"
        onClick={onToggle}
        aria-label="Dil seç"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{locale.toUpperCase()}</span>
        <svg className={`lang-dropdown-chevron ${isOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="lang-dropdown-menu"
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {supportedLangs.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`lang-dropdown-item ${locale === lang.code ? 'active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelect(lang.code);
              }}
              onClick={(event) => event.stopPropagation()}
              role="menuitemradio"
              aria-checked={locale === lang.code}
            >
              <span className="lang-dropdown-code">{lang.code.toUpperCase()}</span>
              <span>{lang.label}</span>
              {locale === lang.code && (
                <svg className="lang-dropdown-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default QuizLanguageDropdown;
