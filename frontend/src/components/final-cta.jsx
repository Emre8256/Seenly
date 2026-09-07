import { IntersectingCircles, WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"
import finalCtaImg from "../images/landing/final-cta.avif"

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
        <div className="grid items-center gap-y-8 gap-x-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-10">
          <div className="relative z-10 max-w-xl lg:pt-10 flex flex-col items-center text-center lg:items-start lg:text-left lg:col-start-1 lg:row-start-1">
            <IntersectingCircles className="h-10 w-16 text-peach/70 mx-auto lg:mx-0" />
            <h2 className="mt-7 text-balance font-heading text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {t("ui", "landing_final_title") || "Kendini nasıl gördüğünü ve insanların seni nasıl deneyimlediğini karşılaştır."}
            </h2>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("ui", "landing_final_desc") || "Seenly deneyimini başlat ve seni tanıyan insanların gördüğü ortak sinyalleri keşfet."}
            </p>
          </div>

          {/* Single responsive image element: right on desktop, between text and button on mobile */}
          <div className="relative mx-auto max-w-[320px] sm:max-w-none w-full lg:-mr-24 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div className="integrated-art mask-organic-1 paper-panel relative overflow-hidden p-0">
              <img
                src={finalCtaImg}
                loading="lazy"
                decoding="async"
                width="1000"
                height="625"
                alt=""
                aria-hidden="true"
                className="soft-image-edge aspect-[16/10] w-full object-cover object-center lg:aspect-[16/9] mask-organic-1"
              />
              <span className="paper-veil opacity-70" />
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2 flex justify-center lg:justify-start">
            <button
              type="button"
              onClick={onStartClick}
              className="w-full sm:w-auto shadow-contact-sm group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-3.5 text-base text-primary-foreground transition-all duration-500 hover:gap-4 cursor-pointer"
            >
              {t("ui", "landing_start_cta") || "Kendi Seenly'ni başlat"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
