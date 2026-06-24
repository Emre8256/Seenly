import React, { useState } from 'react';
import LocaleSwitch from './LocaleSwitch';
import { useLocale } from '../context/LocaleContext';

export default function AppShell({ children, isLanding = false, isDashboard = false, onStartClick, showLogout = true, footerMode = 'standard' }) {
  const { t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSmoothScroll = (e, targetId) => {
    if (isDashboard || window.location.hash.startsWith('#/identities') || window.location.hash.startsWith('#/faq') || window.location.hash.startsWith('#/plans')) {
      window.location.href = `/#${targetId}`;
      return;
    }
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartQuizClick = (e) => {
    e.preventDefault();
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    if (window.location.hash === '#/' || window.location.hash === '') {
      window.dispatchEvent(new CustomEvent('seenly_trigger_start_quiz'));
    } else {
      window.location.hash = '#/';
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    sessionStorage.setItem('seenly_currentIndex', '-5');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    if (window.location.hash === '#/' || window.location.hash === '') {
      window.dispatchEvent(new CustomEvent('seenly_trigger_login'));
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <div className={`app-shell ${isLanding ? 'landing-layout' : ''} ${isDashboard ? 'dashboard-layout' : ''}`}>
      <header className={`main-header ${isLanding || isDashboard ? 'landing-header' : ''}`}>
        {isLanding || isDashboard ? (
          <>
            {/* Left: Custom branded logo */}
            <div
              className="logo-area"
              onClick={() => window.location.hash = '#/'}
            >
              <span className="logo-icon">S</span>
              <span className="logo-text">Seenly</span>
            </div>

            {/* Center: Navigation Menu Links */}
            <nav className="main-nav" style={isDashboard ? { visibility: 'hidden', pointerEvents: 'none' } : {}}>
              <a
                href="#/"
                onClick={handleStartQuizClick}
              >
                {t('ui', 'nav_start')}
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              >
                {t('ui', 'nav_how_it_works')}
              </a>
              <a
                href="#/identities"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#/identities';
                }}
              >
                {t('ui', 'nav_social_identities')}
              </a>
              <a
                href="#/plans"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#/plans';
                }}
              >
                {t('ui', 'nav_plans')}
              </a>
              <a
                href="#/faq"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#/faq';
                }}
              >
                {t('ui', 'nav_faq')}
              </a>
            </nav>

            {/* Right: Language switch / Mobile Hamburger */}
            <div className="header-actions">
              {isDashboard && showLogout && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('seenly_owner_token');
                    sessionStorage.clear();
                    window.location.hash = '#/';
                  }}
                  className="seenly-dashboard-logout-btn"
                  style={{
                    background: 'rgba(217, 106, 83, 0.08)',
                    border: '1px solid rgba(217, 106, 83, 0.2)',
                    borderRadius: '20px',
                    color: 'var(--color-burnt-coral)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t('ui', 'nav_logout')}
                </button>
              )}
              <div className="desktop-only-actions" style={{ display: 'flex', alignItems: 'center' }}>
                {!isDashboard && (
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(11, 27, 44, 0.15)',
                      borderRadius: '20px',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      padding: '0.5rem 1.1rem',
                      cursor: 'pointer',
                      marginRight: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(11, 27, 44, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    {t('ui', 'nav_login')}
                  </button>
                )}
                <LocaleSwitch />
              </div>
              {!isDashboard && (
                <button
                  className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                margin: 0,
                fontWeight: 600,
                letterSpacing: '0.02em',
                cursor: 'pointer'
              }}
              onClick={() => window.location.hash = '#/'}
            >
              Seenly.
            </h1>
            <LocaleSwitch />
          </>
        )}
      </header>

      {/* Mobile Menu Overlay Drawer */}
      {isLanding && (
        <div className={`mobile-menu-overlay-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-nav-links">
            <a
              href="#/"
              onClick={(e) => {
                handleStartQuizClick(e);
                setMobileMenuOpen(false);
              }}
            >
              {t('ui', 'nav_start')}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                handleSmoothScroll(e, 'how-it-works');
                setMobileMenuOpen(false);
              }}
            >
              {t('ui', 'nav_how_it_works')}
            </a>
            <a
              href="#/identities"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/identities';
                setMobileMenuOpen(false);
              }}
            >
              {t('ui', 'nav_social_identities')}
            </a>
            <a
              href="#/plans"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/plans';
                setMobileMenuOpen(false);
              }}
            >
              {t('ui', 'nav_plans')}
            </a>
            <a
              href="#/faq"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/faq';
                setMobileMenuOpen(false);
              }}
            >
              {t('ui', 'nav_faq')}
            </a>
            <div className="mobile-locale-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {!isDashboard && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleLoginClick(e);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(11, 27, 44, 0.15)',
                    borderRadius: '20px',
                    color: 'var(--color-deep-ink)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    padding: '0.6rem 2rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    width: 'fit-content',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t('ui', 'nav_login')}
                </button>
              )}
              <LocaleSwitch />
            </div>
          </nav>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      {footerMode === 'simple' ? (
        <footer className="simple-footer" style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          borderTop: '1px solid var(--color-border)',
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent'
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.12em'
          }}>
            &copy; 2026 SEENLY. ALL RIGHTS RESERVED.
          </span>
        </footer>
      ) : (
        <footer className="main-footer-area">
          <div className="footer-inner">
            <div className="footer-grid">

              {/* Column 1: Brand Info */}
              <div className="footer-col brand-col">
                <div
                  className="footer-logo"
                  onClick={() => window.location.hash = '#/'}
                >
                  <span className="logo-icon">S</span>
                  <span className="logo-text">Seenly</span>
                </div>
                <p className="footer-desc">
                  {t('ui', 'landing_subtitle')}
                </p>
                <div className="footer-socials">
                  <a href="https://instagram.com/seenly.co" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="https://tiktok.com/@seenly.co" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Column 2: Quick Links */}
              <div className="footer-col links-col">
                <h4 className="footer-title">{t('ui', 'footer_quick_links')}</h4>
                <nav className="footer-links">
                  <a href="#/" onClick={handleStartQuizClick}>{t('ui', 'nav_start')}</a>
                  <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')}>{t('ui', 'nav_how_it_works')}</a>
                  <a href="#/identities" onClick={(e) => { e.preventDefault(); window.location.hash = '#/identities'; }}>{t('ui', 'nav_social_identities')}</a>
                </nav>
              </div>

              {/* Column 3: Legal & Support */}
              <div className="footer-col links-col">
                <h4 className="footer-title">{t('ui', 'footer_support')}</h4>
                <nav className="footer-links">
                  <a href="#/plans" onClick={(e) => { e.preventDefault(); window.location.hash = '#/plans'; }}>{t('ui', 'nav_plans')}</a>
                  <a href="#/faq" onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/faq';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>{t('ui', 'nav_faq')}</a>
                  <a href="#/privacy" onClick={(e) => { e.preventDefault(); window.location.hash = '#/privacy'; }}>{t('ui', 'footer_privacy')}</a>
                  <a href="#/faq" onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/faq';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>{t('ui', 'footer_contact')}</a>
                </nav>
              </div>

            </div>

            <div className="footer-bottom-divider"></div>

            {/* Bottom Copyright */}
            <div className="footer-bottom">
              <span className="copyright-text">
                &copy; {new Date().getFullYear()} SEENLY. ALL RIGHTS RESERVED.
              </span>
              <span className="privacy-badge-text">
                {t('ui', 'privacy_note') || 'Anonim & Güvenli'}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
