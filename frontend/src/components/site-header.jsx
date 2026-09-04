import React, { useEffect, useRef, useState } from "react"
import { SeenlyLogo } from "./seenly-logo"
import { useLocale } from "../context/LocaleContext"
import LocaleSwitch from "./LocaleSwitch"
import { getAvatarSrc } from "../images/avatars"

export function SiteHeader({ onStartClick, onLoginClick, hideHowItWorks = false }) {
  const { t, locale: langCode } = useLocale()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const mobileUserMenuRef = useRef(null)
  const isLoggedIn = Boolean(localStorage.getItem("seenly_owner_token"))
  const displayName = localStorage.getItem("seenly_display_name") || sessionStorage.getItem("seenly_displayName") || (langCode === 'tr' ? 'Panelim' : 'Dashboard')
  const userAvatar = localStorage.getItem("seenly_avatar") || sessionStorage.getItem("seenly_avatar")
  const avatarSrc = getAvatarSrc(userAvatar)

  const goSettings = (tab = 'profile') => {
    setOpen(false)
    setUserMenuOpen(false)
    setMobileUserMenuOpen(false)
    window.location.hash = `#/settings?tab=${tab}`
  }

  const goDashboard = () => {
    setOpen(false)
    setUserMenuOpen(false)
    setMobileUserMenuOpen(false)
    window.location.hash = "#/dashboard"
  }

  const logout = () => {
    localStorage.removeItem("seenly_owner_token")
    localStorage.removeItem("seenly_display_name")
    sessionStorage.clear()
    setOpen(false)
    setUserMenuOpen(false)
    setMobileUserMenuOpen(false)
    window.location.hash = "#/"
  }

  const navItems = [
    {
      label: isLoggedIn ? (t("ui", "nav_dashboard") || "Panelim") : (t("ui", "nav_start") || "Testi Baslat"),
      href: isLoggedIn ? "#/dashboard" : "#",
      onClick: (e) => {
        if (isLoggedIn) return
        e.preventDefault()
        onStartClick?.()
      },
    },
    !hideHowItWorks && {
      label: t("ui", "nav_how_it_works") || "Nasil Calisir",
      href: "#nasil-calisir",
      onClick: (e) => {
        if (window.location.hash !== '#/' && window.location.hash !== '') {
          e.preventDefault()
          window.location.hash = '#/nasil-calisir'
        }
      }
    },
    { label: t("ui", "nav_social_identities") || "Sosyal Kimlikler", href: "#/identities" },
    { label: t("ui", "nav_faq") || "Sorular", href: "#/faq" },
  ].filter(Boolean)

  useEffect(() => {
    let ticking = false;
    let lastScrolled = window.scrollY > 24;
    setScrolled(lastScrolled);

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const nextScrolled = window.scrollY > 24;
          if (nextScrolled !== lastScrolled) {
            lastScrolled = nextScrolled;
            setScrolled(nextScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [userMenuOpen])

  useEffect(() => {
    if (!mobileUserMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!mobileUserMenuRef.current?.contains(event.target)) {
        setMobileUserMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [mobileUserMenuOpen])

  return (
    <header
      className={`transition-all duration-300 backdrop-blur-md ${scrolled
        ? "paper-grain border-b border-border/50 bg-background/90 shadow-contact-sm"
        : "border-b border-transparent bg-transparent"
        }`}
      style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <a href="#" className="group flex items-center gap-2.5" aria-label="Seenly ana sayfa">
          <SeenlyLogo className="h-6 w-6 text-navy transition-transform duration-500 group-hover:rotate-[8deg]" />
          <span className="font-heading text-[1.35rem] font-medium tracking-tight text-foreground">
            Seenly
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Ana menu">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className="relative text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-peach after:transition-all after:duration-500 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
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
                aria-label="Kullanıcı Menüsü"
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
                <div className="seenly-user-menu-panel" style={{ minWidth: '200px', padding: '10px' }}>
                  <div style={{
                    padding: '6px 10px 10px 10px',
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
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid rgba(197, 160, 89, 0.4)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '7px',
                        backgroundColor: 'var(--color-deep-ink)',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => goSettings('profile')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    {langCode === 'tr' ? 'Profil' : 'Profile'}
                  </button>

                  <button
                    type="button"
                    onClick={() => goSettings('plans')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {langCode === 'tr' ? 'Üyelik' : 'Membership'}
                  </button>

                  <button
                    type="button"
                    onClick={() => goSettings('notifications')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {langCode === 'tr' ? 'Bildirimler' : 'Notifications'}
                  </button>

                  <button
                    type="button"
                    onClick={goDashboard}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
                    </svg>
                    {langCode === 'tr' ? 'Panelim' : 'Dashboard'}
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'rgba(11, 27, 44, 0.08)', margin: '5px 0' }} />

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      fontSize: '0.82rem',
                      fontWeight: '500',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {langCode === 'tr' ? 'Çıkış Yap' : 'Log Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
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
              {t("ui", "landing_quick_login") || "Giriş Yap"}
            </button>
          )}

          <LocaleSwitch />
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          {isLoggedIn ? (
            <div className="relative" ref={mobileUserMenuRef}>
              <button
                type="button"
                onClick={() => setMobileUserMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-deep-ink)] transition-all hover:text-peach overflow-hidden"
                aria-label="Kullanıcı Menüsü"
                aria-expanded={mobileUserMenuOpen}
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              {mobileUserMenuOpen && (
                <div
                  className="paper-grain"
                  style={{
                    position: 'absolute',
                    top: '42px',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid rgba(11, 27, 44, 0.08)',
                    borderRadius: '16px',
                    boxShadow: '0 12px 30px rgba(11, 27, 44, 0.08)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 1000,
                    minWidth: '180px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    padding: '6px 10px 8px 10px',
                    marginBottom: '4px',
                    borderBottom: '1px solid rgba(11, 27, 44, 0.08)',
                    fontFamily: 'var(--font-serif)',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    color: 'var(--color-deep-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {avatarSrc && (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        style={{
                          width: '24px',
                          height: '24px',
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
                    onClick={() => goSettings('profile')}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {langCode === 'tr' ? 'Profil' : 'Profile'}
                  </button>

                  <button
                    type="button"
                    onClick={() => goSettings('plans')}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {langCode === 'tr' ? 'Üyelik' : 'Membership'}
                  </button>

                  <button
                    type="button"
                    onClick={() => goSettings('notifications')}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {langCode === 'tr' ? 'Bildirimler' : 'Notifications'}
                  </button>

                  <button
                    type="button"
                    onClick={goDashboard}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-deep-ink)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {langCode === 'tr' ? 'Panelim' : 'Dashboard'}
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'rgba(11, 27, 44, 0.08)', margin: '4px 0' }} />

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    {langCode === 'tr' ? 'Çıkış Yap' : 'Log Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-deep-ink)] transition-all hover:text-peach"
              aria-label="Giriş Yap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          )}

          <LocaleSwitch mobile={true} />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-deep-ink)] transition-all hover:text-peach"
            aria-label="Menuyu ac/kapat"
            aria-expanded={open}
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1.5 items-center">
              <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="paper-grain border-t border-border/50 bg-background/95 px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobil menu">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) item.onClick(e)
                  setOpen(false)
                }}
                className="rounded-md px-2 py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
