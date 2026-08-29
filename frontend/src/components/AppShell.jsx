import React, { useState, useEffect } from 'react';
import LocaleSwitch from './LocaleSwitch';
import { useLocale } from '../context/LocaleContext';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { getAvatarSrc } from '../images/avatars';

export default function AppShell({ children, isLanding = false, isDashboard = false, onStartClick, showLogout = true, footerMode = 'standard', userName = 'Panelim' }) {
  const { t, locale: langCode } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userAvatar = localStorage.getItem('seenly_avatar') || sessionStorage.getItem('seenly_avatar');
  const avatarSrc = getAvatarSrc(userAvatar);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoggedIn = Boolean(localStorage.getItem('seenly_owner_token'));
  const displayName = (userName && userName !== 'Panelim')
    ? userName
    : (localStorage.getItem('seenly_display_name') || sessionStorage.getItem('seenly_displayName') || t('ui', 'nav_dashboard') || 'Panelim');

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
    e?.preventDefault?.();
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    if (window.location.hash === '#/' || window.location.hash === '') {
      window.dispatchEvent(new CustomEvent('seenly_trigger_start_quiz'));
    } else {
      window.location.hash = '#/';
    }
  };

  const handleLoginClick = (e) => {
    e?.preventDefault?.();
    sessionStorage.setItem('seenly_currentIndex', '-5');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    if (window.location.hash === '#/' || window.location.hash === '') {
      window.dispatchEvent(new CustomEvent('seenly_trigger_login'));
    } else {
      window.location.hash = '#/';
    }
  };

  if (isDashboard) {
    return (
      <div className="app-shell dashboard-layout min-h-screen text-foreground" style={{ position: 'relative', background: 'transparent' }}>
        <SiteHeader onStartClick={handleStartQuizClick} onLoginClick={handleLoginClick} hideHowItWorks={isLoggedIn} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <SiteFooter />
      </div>
    );
  }


  return (

    <div className={`app-shell ${isLanding ? 'landing-layout' : ''} ${isDashboard ? 'dashboard-layout' : ''}`}>
      <header
        className={`main-header ${isLanding || isDashboard ? 'landing-header' : ''} ${scrolled ? 'scrolled paper-grain' : ''}`}
        style={{
          position: isLanding || isDashboard ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 100
        }}
      >
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
            <nav className="main-nav">
              <a
                href={isDashboard ? "#/dashboard" : "#/"}
                onClick={isDashboard ? undefined : handleStartQuizClick}
              >
                {isDashboard ? (t('ui', 'nav_dashboard') || 'Panelim') : t('ui', 'nav_start')}
              </a>
              <a
                href="#nasil-calisir"
                onClick={(e) => handleSmoothScroll(e, 'nasil-calisir')}
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
              {!isDashboard && (
                <a
                  href="#/plans"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/plans';
                  }}
                >
                  {t('ui', 'nav_plans')}
                </a>
              )}
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(prev => !prev)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(11, 27, 44, 0.08)',
                      backgroundColor: 'rgba(255, 255, 255, 0.55)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-deep-ink)',
                      boxShadow: '0 2px 8px rgba(11, 27, 44, 0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      padding: 0,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    aria-expanded={userMenuOpen}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(217, 106, 83, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 106, 83, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(11, 27, 44, 0.08)';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.55)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 27, 44, 0.01)';
                    }}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="seenly-user-menu-panel" style={{ minWidth: '190px', padding: '10px', right: 0 }}>
                      <div style={{ 
                        padding: '4px 10px 8px 10px', 
                        marginBottom: '6px', 
                        borderBottom: '1px solid rgba(11, 27, 44, 0.08)', 
                        fontFamily: 'var(--font-serif)', 
                        fontWeight: '700', 
                        fontSize: '1.05rem',
                        color: 'var(--color-deep-ink)',
                        textAlign: 'left',
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {avatarSrc && (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid rgba(197, 160, 89, 0.4)',
                              flexShrink: 0
                            }}
                          />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '7px 8px', fontSize: '0.84rem', fontWeight: '600' }}
                        onClick={() => {
                          setUserMenuOpen(false);
                          window.location.hash = '#/settings?tab=profile';
                        }}
                      >
                        {langCode === 'tr' ? 'Profil' : 'Profile'}
                      </button>
                      <button
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '7px 8px', fontSize: '0.84rem', fontWeight: '600' }}
                        onClick={() => {
                          setUserMenuOpen(false);
                          window.location.hash = '#/settings?tab=plans';
                        }}
                      >
                        {langCode === 'tr' ? 'Üyelik' : 'Membership'}
                      </button>
                      <button
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '7px 8px', fontSize: '0.84rem', fontWeight: '600' }}
                        onClick={() => {
                          setUserMenuOpen(false);
                          window.location.hash = '#/settings?tab=notifications';
                        }}
                      >
                        {langCode === 'tr' ? 'Bildirimler' : 'Notifications'}
                      </button>
                      <button
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '7px 8px', fontSize: '0.84rem', fontWeight: '600' }}
                        onClick={() => {
                          setUserMenuOpen(false);
                          window.location.hash = '#/dashboard';
                        }}
                      >
                        {langCode === 'tr' ? 'Panelim' : 'Dashboard'}
                      </button>
                      <div style={{ height: '1px', backgroundColor: 'rgba(11, 27, 44, 0.08)', margin: '4px 0' }} />
                      <button
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: '500' }}
                        onClick={() => {
                          localStorage.removeItem('seenly_owner_token');
                          localStorage.removeItem('seenly_display_name');
                          sessionStorage.clear();
                          setUserMenuOpen(false);
                          window.location.hash = '#/';
                        }}
                      >
                        {langCode === 'tr' ? 'Çıkış Yap' : 'Log Out'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="desktop-only-actions" style={{ display: 'flex', alignItems: 'center' }}>
                {!isDashboard && (
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    style={{
                      height: '36px',
                      padding: '0 1.25rem',
                      borderRadius: '18px',
                      border: '1.5px solid rgba(11, 27, 44, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.55)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                      marginRight: '12px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 2px 8px rgba(11, 27, 44, 0.01)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--peach)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.backgroundColor = 'var(--peach)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 106, 83, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(11, 27, 44, 0.1)';
                      e.currentTarget.style.color = 'var(--color-deep-ink)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.55)';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 27, 44, 0.01)';
                    }}
                  >
                    {t('ui', 'landing_quick_login') || t('ui', 'nav_login')}
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
              href="#nasil-calisir"
              onClick={(e) => {
                handleSmoothScroll(e, 'nasil-calisir');
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
                  <a href="#nasil-calisir" onClick={(e) => handleSmoothScroll(e, 'nasil-calisir')}>{t('ui', 'nav_how_it_works')}</a>
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
