import { IntersectingCircles, WatercolorStain, HairLine } from "./marks"
import { useLocale } from "../context/LocaleContext"
import heroImg from "../images/landing/hero.avif"
import heroMobileImg from "../images/landing/hero-mobile.avif"

export function Hero({ onStartClick, onLoginClick }) {
  const { t } = useLocale()
  const isLoggedIn = Boolean(localStorage.getItem("seenly_owner_token"))
  const startLabel = isLoggedIn ? t("navigation.dashboard") : t("home.hero.startCta")
  const quickLoginLabel = t("home.hero.quickLogin")

  const handlePrimaryClick = () => {
    if (isLoggedIn) {
      window.location.hash = "#/dashboard"
      return
    }
    onStartClick?.()
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="paper-grain relative overflow-hidden bg-background"
    >
      <WatercolorStain
        name="hero-blush"
        hue="blush"
        seed={3}
        intensity={0.14}
        className="right-[-10%] top-[-8%] h-[32rem] w-[32rem]"
      />
      <WatercolorStain
        name="hero-clay"
        hue="clay"
        seed={7}
        intensity={0.12}
        className="left-[-12%] top-[30%] h-[26rem] w-[26rem]"
      />

      <div className="above-surface mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-y-8 pb-8 pt-4 md:pb-10 md:pt-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-x-16">
          <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left lg:pr-6">
            <h1
              id="hero-title"
              className="max-w-xl text-balance font-heading text-[2.7rem] font-medium leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.3rem]"
            >
              {t("home.hero.title1")}
              <span className="italic text-clay">{t("home.hero.titleItalic")}</span>
              {t("home.hero.title2")}
            </h1>

            <div className="mt-5">
              <HairLine className="w-20 text-gold" />
            </div>

            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.hero.desc")}
            </p>

            {isLoggedIn && (
              <p className="mt-4 max-w-md text-pretty font-heading text-[1.35rem] leading-snug text-clay">
                {t("home.hero.loggedInCallout")}
              </p>
            )}

            <div className="mt-7 flex flex-row items-center justify-center lg:justify-start gap-4 sm:gap-7 w-full">
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
            </div>

            {!isLoggedIn && (
              <p className="mt-4 text-[0.7rem] min-[360px]:text-xs text-muted-foreground">
                {t("home.hero.ctaFree")}
              </p>
            )}
          </div>

          <div className="relative lg:-mr-6 lg:pl-4">
            <figure className="relative mx-auto max-w-[280px] sm:max-w-none">
              <WatercolorStain
                name="hero-plate"
                hue="lilac"
                seed={11}
                intensity={0.16}
                className="-left-8 -top-6 h-[112%] w-[112%]"
              />
              <div className="integrated-art mask-organic-1 shadow-contact paper-panel relative -mr-3 overflow-hidden p-0 sm:-mr-6">
                <picture>
                  <source media="(max-width: 768px)" srcSet={heroMobileImg} />
                  <img
                    src={heroImg}
                    alt={t("home.hero.illustrationAlt")}
                    width="768"
                    height="960"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="soft-image-edge aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5] mask-organic-1"
                  />
                </picture>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
