import { Reveal } from "./reveal"
import { IntersectingCircles, WatercolorStain, HairLine } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function Hero({ onStartClick, onLoginClick }) {
  const { t } = useLocale()
  const isLoggedIn = Boolean(localStorage.getItem("seenly_owner_token"))
  const startLabel = isLoggedIn ? "Panelime git" : (t("ui", "landing_start_cta") || "Kendi Seenly'ni baslat")
  const quickLoginLabel = t("ui", "landing_quick_login") || "Hizli Giris"

  const handlePrimaryClick = () => {
    if (isLoggedIn) {
      window.location.hash = "#/dashboard"
      return
    }
    onStartClick?.()
  }

  return (
    <section
      id="baslat"
      className="paper-grain surface-color wash-peach relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden bg-background"
      aria-labelledby="hero-title"
    >
      <WatercolorStain
        name="hero-peach"
        hue="peach"
        seed={7}
        intensity={0.22}
        className="right-[-9%] top-[-12%] h-[34rem] w-[34rem]"
      />
      <WatercolorStain
        name="hero-clay"
        hue="clay"
        seed={3}
        intensity={0.14}
        className="bottom-[-16%] left-[-10%] h-[26rem] w-[26rem]"
      />

      <div className="above-surface mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-y-8 pb-8 pt-4 md:pb-10 md:pt-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-x-16">
          <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left lg:pr-6">
            <Reveal
              as="h1"
              id="hero-title"
              delay={120}
              className="max-w-xl text-balance font-heading text-[2.7rem] font-medium leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.3rem]"
            >
              {t("ui", "landing_hero_title_1") || "Insanlarin seni nasil "}
              <span className="italic text-clay">{t("ui", "landing_hero_title_italic") || "deneyimledigini"}</span>
              {t("ui", "landing_hero_title_2") || " kesfet."}
            </Reveal>

            <Reveal delay={200} className="mt-5">
              <HairLine className="w-20 text-gold" />
            </Reveal>

            <Reveal
              as="p"
              delay={260}
              className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t("ui", "landing_hero_desc") || "Kendini nasil gordugunu, seni taniyan insanlarin seni nasil deneyimledigiyle karsilastir."}
            </Reveal>

            {isLoggedIn && (
              <Reveal
                as="p"
                delay={320}
                className="mt-4 max-w-md text-pretty font-heading text-[1.35rem] leading-snug text-clay"
              >
                Panelin hazir. Sosyal yansimani, gelen degerlendirmeleri ve fark katmanini tek yerde oku.
              </Reveal>
            )}

            <Reveal delay={360} className="mt-7 flex flex-row items-center justify-center lg:justify-start gap-4 sm:gap-7 w-full">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="w-auto shadow-contact-sm group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm sm:px-7 sm:py-3.5 sm:text-base text-primary-foreground transition-all duration-500 hover:gap-3 cursor-pointer shrink-0"
              >
                {startLabel}
                <span aria-hidden="true">→</span>
              </button>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground cursor-pointer shrink-0"
                >
                  <span className="border-b border-foreground/30 pb-0.5 transition-colors duration-300 group-hover:border-peach">
                    {quickLoginLabel}
                  </span>
                </button>
              )}
            </Reveal>

            {!isLoggedIn && (
              <Reveal as="p" delay={440} className="mt-4 text-[0.7rem] min-[360px]:text-xs text-muted-foreground">
                {t("ui", "landing_hero_cta_free") || "Ucretsiz basla · Ilk sonuclarini dakikalar icinde gor"}
              </Reveal>
            )}
          </div>

          <Reveal delay={180} className="relative lg:-mr-6 lg:pl-4">
            <figure className="relative mx-auto max-w-[280px] sm:max-w-none">
              <WatercolorStain
                name="hero-plate"
                hue="lilac"
                seed={11}
                intensity={0.16}
                className="-left-8 -top-6 h-[112%] w-[112%]"
              />
              <div className="integrated-art mask-organic-1 shadow-contact paper-panel relative -mr-3 overflow-hidden p-0 sm:-mr-6">
                <img
                  src="/images/hero.png"
                  alt="Seenly profillerini birbirine baglayan suluboya illusturasyon"
                  className="soft-image-edge aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5] mask-organic-1"
                />
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
