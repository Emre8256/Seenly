import { Reveal } from "./reveal"
import { IntersectingCircles, WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function FinalCta({ onStartClick }) {
  const { t } = useLocale()

  return (
    <section
      id="baslat"
      className="paper-grain surface-color wash-ink relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="final-peach"
        hue="peach"
        seed={34}
        intensity={0.12}
        className="right-[8%] top-[10%] h-[32rem] w-[32rem]"
      />

      <div className="above-surface relative mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-10">
          <Reveal className="relative z-10 max-w-xl lg:pt-10 flex flex-col items-center text-center lg:items-start lg:text-left">
            <IntersectingCircles className="h-10 w-16 text-peach/70 mx-auto lg:mx-0" />
            <h2 className="mt-7 text-balance font-heading text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {t("ui", "landing_final_title") || "Kendini nasıl gördüğünü ve insanların seni nasıl deneyimlediğini karşılaştır."}
            </h2>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("ui", "landing_final_desc") || "Seenly deneyimini başlat ve seni tanıyan insanların gördüğü ortak sinyalleri keşfet."}
            </p>

            {/* Mobile Image: displayed below description text on mobile, hidden on desktop */}
            <div className="lg:hidden my-6 mx-auto max-w-[320px] w-full relative">
              <div className="integrated-art mask-organic-1 paper-panel overflow-hidden p-0">
                <img
                  src="/images/final-cta.png"
                  alt=""
                  aria-hidden="true"
                  className="soft-image-edge aspect-[16/10] w-full object-cover object-center mask-organic-1"
                />
                <span className="paper-veil opacity-70" />
              </div>
            </div>

            <button
              type="button"
              onClick={onStartClick}
              className="w-full sm:w-auto shadow-contact-sm group mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-3.5 text-base text-primary-foreground transition-all duration-500 hover:gap-4 cursor-pointer"
            >
              {t("ui", "landing_start_cta") || "Kendi Seenly'ni başlat"}
              <span aria-hidden="true">→</span>
            </button>
          </Reveal>

          {/* Desktop Image: hidden on mobile */}
          <Reveal delay={120} className="hidden lg:block relative -mx-6 sm:mx-0 lg:-mr-24 mx-auto max-w-[320px] sm:max-w-none w-full">
            <div className="integrated-art mask-organic-1 paper-panel relative overflow-hidden p-0">
              <img
                src="/images/final-cta.png"
                alt=""
                aria-hidden="true"
                className="soft-image-edge aspect-[16/10] w-full object-cover object-center lg:aspect-[16/9] mask-organic-1"
              />
              <span className="paper-veil opacity-70" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
