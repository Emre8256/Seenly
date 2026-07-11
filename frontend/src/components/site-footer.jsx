import { SeenlyLogo } from "./seenly-logo"
import { DottedThread } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function SiteFooter() {
  const { t } = useLocale()

  const links = [
    { label: t("ui", "nav_faq") || "SSS", href: "#/faq" },
    { label: t("ui", "footer_contact_us") || "İletişim", href: "#/faq" },
    { label: t("ui", "footer_privacy_policy") || "Gizlilik Politikası", href: "#" },
    { label: t("ui", "nav_social_identities") || "Sosyal Kimlikler", href: "#/identities" },
  ]

  return (
    <footer className="paper-grain relative border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
        <DottedThread className="h-5 w-40 text-clay/40" />

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <SeenlyLogo className="h-6 w-6 text-navy" />
              <span className="font-heading text-lg font-medium text-foreground">
                Seenly
              </span>
            </div>
            <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("ui", "landing_footer_desc") || "Seenly, insanların kendilerini ve birbirlerini daha iyi anlamalarına yardımcı olmak için özenle tasarlandı."}
            </p>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <a
                href="https://instagram.com/seenly.co"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-peach transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@seenly.co"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-peach transition-colors duration-300"
                aria-label="TikTok"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3" aria-label="Alt menü">
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
            © {new Date().getFullYear()} {t("ui", "landing_footer_rights") || "Seenly. Tüm hakları saklıdır."}
          </p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-clay/60">
            {t("ui", "landing_footer_slogan") || "Kendini gör"}
          </p>
        </div>
      </div>
    </footer>
  )
}
