import { TenSignalLogo } from "./tensignal-logo"
import { useLocale } from "../context/LocaleContext"

export function SiteFooter() {
  const { t } = useLocale()

  const links = [
    { label: t("navigation.faq"), href: "#/faq" },
    { label: t("navigation.footer.contact"), href: "#/faq" },
    { label: t("navigation.socialIdentities"), href: "#/identities" },
    { label: t("navigation.footer.privacy"), href: "#/privacy" },
    { label: t("navigation.footer.terms"), href: "#/terms" },
  ]

  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center">
              <TenSignalLogo className="h-7 sm:h-[30px] w-auto object-contain" />
            </div>
            <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("navigation.footer.description")}
            </p>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <a
                href="https://instagram.com/tensignal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-peach transition-colors duration-300"
                aria-label={t("accessibility.instagram")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@tensignal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-peach transition-colors duration-300"
                aria-label={t("accessibility.tiktok")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3.5 sm:flex sm:flex-wrap" aria-label={t("navigation.footer.quickLinks")}>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border/60 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t("navigation.footer.rights")}
          </p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
            {t("navigation.footer.slogan")}
          </p>
        </div>
      </div>
    </footer>
  )
}
