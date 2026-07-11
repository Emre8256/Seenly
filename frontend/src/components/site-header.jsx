import React, { useEffect, useRef, useState } from "react"
import { SeenlyLogo } from "./seenly-logo"
import { useLocale } from "../context/LocaleContext"
import LocaleSwitch from "./LocaleSwitch"

export function SiteHeader({ onStartClick, onLoginClick, hideHowItWorks = false }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const isLoggedIn = Boolean(localStorage.getItem("seenly_owner_token"))
  const displayName = localStorage.getItem("seenly_display_name") || sessionStorage.getItem("seenly_displayName") || "Panelim"

  const goDashboard = () => {
    setOpen(false)
    setUserMenuOpen(false)
    window.location.hash = "#/dashboard"
  }

  const logout = () => {
    localStorage.removeItem("seenly_owner_token")
    localStorage.removeItem("seenly_display_name")
    sessionStorage.clear()
    setOpen(false)
    setUserMenuOpen(false)
    window.location.hash = "#/"
  }

  const handleDeleteAccount = async () => {
    const isTurkish = localStorage.getItem("seenly_locale") === "tr" || (t("ui", "lang_code") === "tr")
    const confirmDelete = window.confirm(
      isTurkish
        ? "Hesabınızı ve hesabınıza bağlı tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        : "Are you sure you want to delete your account and all associated data? This action cannot be undone."
    )
    if (!confirmDelete) return

    const token = localStorage.getItem("seenly_owner_token")
    if (!token) return

    try {
      const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
      const response = await fetch(`${apiPrefix}/api/billing/delete-account`, {
        method: "DELETE",
        headers: {
          "X-Owner-Token": token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      alert(
        isTurkish
          ? "Hesabınız başarıyla silindi."
          : "Your account has been successfully deleted."
      )
      logout()
    } catch (err) {
      alert(
        isTurkish
          ? "Hesap silinirken bir hata oluştu: " + err.message
          : "Error deleting account: " + err.message
      )
    }
  }

  const navItems = [
    {
      label: isLoggedIn ? "Panelim" : (t("ui", "nav_start") || "Testi Baslat"),
      href: isLoggedIn ? "#/dashboard" : "#",
      onClick: (e) => {
        if (isLoggedIn) return
        e.preventDefault()
        onStartClick?.()
      },
    },
    !hideHowItWorks && { label: t("ui", "nav_how_it_works") || "Nasil Calisir", href: "#nasil-calisir" },
    { label: t("ui", "nav_social_identities") || "Sosyal Kimlikler", href: "#/identities" },
    { label: t("ui", "nav_faq") || "Sorular", href: "#/faq" },
  ].filter(Boolean)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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

  return (
    <header
      className={`transition-colors duration-500 ${scrolled
          ? "paper-grain border-b border-border/50 bg-background/95 shadow-contact-sm"
          : "border-b border-transparent bg-transparent"
        }`}
      style={{ position: 'sticky', top: 0, zIndex: 50 }}
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
            <div className="seenly-user-menu" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="seenly-user-menu-trigger"
                aria-expanded={userMenuOpen}
              >
                <span className="seenly-user-menu-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>{displayName}</span>
              </button>
              {userMenuOpen && (
                <div className="seenly-user-menu-panel">
                  <button type="button" onClick={logout}>{t("ui", "nav_logout") || "Log Out"}</button>
                  <button type="button" onClick={handleDeleteAccount} style={{ color: '#d96a53' }}>
                    {t("ui", "delete_account") || "Delete Account"}
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center text-foreground md:hidden"
          aria-label="Menuyu ac/kapat"
          aria-expanded={open}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
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
            {isLoggedIn ? (
              <>
                <button type="button" onClick={logout} className="mt-2 px-2 py-3 text-left text-base font-medium text-muted-foreground hover:text-foreground">
                  {t("ui", "nav_logout") || "Log Out"}
                </button>
                <button type="button" onClick={handleDeleteAccount} className="px-2 py-3 text-left text-base font-medium text-muted-foreground hover:text-foreground" style={{ color: '#d96a53' }}>
                  {t("ui", "delete_account") || "Delete Account"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLoginClick()
                }}
                className="mt-2 px-2 py-3 text-left text-base font-medium text-muted-foreground hover:text-foreground"
              >
                {t("ui", "landing_quick_login") || "Hizli Giris"}
              </button>
            )}
            <div className="mt-4 px-2">
              <LocaleSwitch />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
