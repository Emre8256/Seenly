import React from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export default function AppShell({
  children,
  isLanding = false,
  isDashboard = false,
  fullWidth = false,
  footerMode = 'standard',
  userName = 'Panelim'
}) {
  const isLoggedIn = Boolean(localStorage.getItem('seenly_owner_token'));

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

  return (
    <div className={`app-shell ${isLanding ? 'landing-layout' : ''} ${isDashboard ? 'dashboard-layout' : ''} ${fullWidth ? 'full-width-layout' : ''} min-h-screen text-foreground flex flex-col`}>
      <SiteHeader
        onStartClick={handleStartQuizClick}
        onLoginClick={handleLoginClick}
        hideHowItWorks={isLoggedIn}
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
            &copy; 2026 SEENLY. ALL RIGHTS RESERVED.
          </span>
        </footer>
      ) : (
        <SiteFooter />
      )}
    </div>
  );
}
