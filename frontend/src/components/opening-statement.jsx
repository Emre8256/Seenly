import { DottedThread, WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function OpeningStatement() {
  const { t } = useLocale()

  return (
    <section className="paper-grain relative overflow-hidden bg-background">
      <WatercolorStain
        name="open-clay"
        hue="clay"
        seed={5}
        intensity={0.1}
        className="right-[-6%] top-1/2 h-[24rem] w-[24rem] -translate-y-1/2"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div>
            <DottedThread className="h-5 w-32 text-clay/60" />
          </div>

          <p className="mt-8 text-balance font-heading text-2xl font-normal leading-[1.42] tracking-tight text-foreground sm:text-[2rem] sm:leading-[1.4]">
            {t("ui", "landing_opening_quote") || "Kendimizi tanıdığımızı sanırız. Ama bizi tanıyan insanlar, çoğu zaman göremediğimiz bir şeyi taşır: "}
            <span className="italic text-clay">
              {t("ui", "landing_opening_quote_italic") || "onların gözünden nasıl göründüğümüzü."}
            </span>
          </p>

          <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ui", "landing_opening_desc") || "Seenly bir test değildir. Seni bir etikete sıkıştırmaz. Bunun yerine, kendi anlatımını yakın çevrenin sessiz gözlemleriyle yan yana koyar — ve aradaki o ince boşlukta kendini görmen için bir alan açar."}
          </p>
        </div>
      </div>
    </section>
  )
}
