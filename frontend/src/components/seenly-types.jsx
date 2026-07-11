import { Reveal } from "./reveal"
import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function SeenlyTypes() {
  const { t } = useLocale()

  const types = [
    {
      code: "SLF",
      name: "Self",
      desc: t("ui", "landing_layers_l1_desc") || "Kendini şu anda nasıl tarif ettiğini gösteren öz algı katmanı.",
      accent: "text-navy",
    },
    {
      code: "OUT",
      name: "Outside",
      desc: t("ui", "landing_layers_l2_desc") || "Seni tanıyan insanlarda tekrar eden ortak sinyallerin özeti.",
      accent: "text-peach",
    },
    {
      code: "GAP",
      name: "Gap",
      desc: t("ui", "landing_layers_l3_desc") || "Öz algın ile dış algın arasındaki ortak ve ayrışan yönler.",
      accent: "text-lilac",
    },
    {
      code: "RDR",
      name: "Reader",
      desc: t("ui", "landing_layers_l4_desc") || "Bir arkadaşına katkıda bulunduğunda insanları nasıl okuduğunu yansıtır.",
      accent: "text-gold",
    },
  ]

  return (
    <section
      id="katmanlar"
      className="paper-grain surface-color wash-peach relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="types-lilac"
        hue="lilac"
        seed={17}
        intensity={0.12}
        className="left-[-7%] top-[-6%] h-[26rem] w-[26rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
            {t("ui", "landing_layers_tag") || "Katmanlar"}
          </p>
          <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
            {t("ui", "landing_layers_title") || "Sonuçlar dört katmandan oluşur."}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ui", "landing_layers_desc") || "Her katman, Seenly'nin ölçtüğü açıklanabilir bir boyuta dayanır. Birlikte, seni nasıl gördüğünü ve insanların seni nasıl deneyimlediğini anlatırlar."}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-20">
          {/* the index — open surface, hairline dividers, no boxes */}
          <ol className="divide-y divide-border/70">
            {types.map((type, i) => (
              <Reveal
                as="li"
                key={type.code}
                delay={i * 110}
                className="group grid grid-cols-[3.4rem_1fr] gap-5 py-6 first:pt-0"
              >
                <span
                  className={`font-mono text-sm font-medium uppercase tracking-[0.2em] ${type.accent}`}
                >
                  {type.code}
                </span>
                <div>
                  <h3 className="font-heading text-xl font-medium text-foreground">
                    {type.name}
                  </h3>
                  <p className="mt-1.5 text-pretty text-[0.95rem] leading-relaxed text-muted-foreground">
                    {type.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
 
          <Reveal delay={160} className="relative">
            <WatercolorStain
              name="types-gold"
              hue="gold"
              seed={23}
              intensity={0.2}
              className="-right-6 -top-6 h-[112%] w-[112%]"
            />
            <div className="integrated-art mask-organic-3 shadow-contact paper-panel relative -mr-4 overflow-hidden p-0">
              <img
                src="/images/icon-set.png"
                alt="Seenly boyutlarını temsil eden suluboya ikon setinin görseli"
                className="soft-image-edge aspect-square w-full object-cover mask-organic-3"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
