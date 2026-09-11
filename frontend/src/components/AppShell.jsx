import React from 'react';
import { useLocale } from '../context/LocaleContext';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import WatercolorBackground from './WatercolorBackground';

export default function AppShell({
  children,
  isLanding = false,
  isDashboard = false,
  watercolorBackground = false,
  fullWidth = true,
  footerMode = 'standard',
  userName = 'Panelim'
}) {
  const { t } = useLocale();
  const isLoggedIn = Boolean(localStorage.getItem('seenly_owner_token'));

  const handleStartQuizClick = (e) => {
    e?.preventDefault?.();
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    window.dispatchEvent(new CustomEvent('seenly_trigger_start_quiz'));
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    }
  };

  const handleLoginClick = (e) => {
    e?.preventDefault?.();
    sessionStorage.setItem('seenly_currentIndex', '-5');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    window.dispatchEvent(new CustomEvent('seenly_trigger_login'));
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    }
  };

  return (
    <div className={`app-shell ${watercolorBackground ? 'watercolor-page' : ''} ${isLanding ? 'landing-layout' : ''} ${isDashboard ? 'dashboard-layout' : ''} ${fullWidth ? 'full-width-layout' : ''} min-h-screen bg-background text-foreground flex flex-col`}>
      {watercolorBackground && <WatercolorBackground />}
      <SiteHeader
        onStartClick={handleStartQuizClick}
        onLoginClick={handleLoginClick}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      {footerMode === 'simple' ? (
        <footer
          className="simple-footer"
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            borderTop: '1px solid var(--color-border)',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.12em'
            }}
          >
            &copy; {new Date().getFullYear()} {t("navigation.footer.rights").toUpperCase()}
          </span>
        </footer>
      ) : (
        <SiteFooter />
      )}
    </div>
  );
}
