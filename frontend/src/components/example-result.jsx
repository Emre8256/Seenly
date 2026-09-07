import { User, Share2, Activity } from "lucide-react"
import { WatercolorStain, ConnectorDots } from "./marks"
import { useLocale } from "../context/LocaleContext"
import exampleResultImg from "../images/landing/example-result.avif"

export function ExampleResult() {
  const { t } = useLocale()

  const blocks = [
    {
      title: t("ui", "landing_ex_b1_title") || "01 / Testi Çözün ve Profilinizi Oluşturun",
      text: t("ui", "landing_ex_b1_text") || "Birkaç dakikalık öz değerlendirmeyi tamamlayarak kendi anlatımınızı şekillendirin ve dijital Self kartınızı anında alın.",
      icon: User,
      accent: "text-navy",
    },
    {
      title: t("ui", "landing_ex_b2_title") || "02 / Linkinizi Profilinize Ekleyin ve Paylaşın",
      text: t("ui", "landing_ex_b2_text") || "Size özel üretilen profil bağlantısını kopyalayıp sosyal medya hesaplarınıza veya yakın çevrenize ulaştırarak tamamen anonim geri bildirimleri toplamaya başlayın.",
      icon: Share2,
      accent: "text-[#b4532a]",
    },
    {
      title: t("ui", "landing_ex_b3_title") || "03 / Çevrenizden Anonim Yansımalar Alın",
      text: t("ui", "landing_ex_b3_text") || "İnsanların sizi baskı olmadan, gerçek ve filtrelenmemiş halleriyle nasıl deneyimlediklerini şeffaf bir okuma olarak izleyin.",
      icon: Activity,
      accent: "text-[#6b4c82]",
    },
  ]

  return (
    <section
      id="ornek"
      className="paper-grain relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="ex-peach"
        hue="peach"
        seed={11}
        intensity={0.16}
        className="left-[-9%] top-[10%] h-[32rem] w-[32rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-y-10 gap-x-14 lg:grid-cols-2 lg:gap-20">
          <div className="lg:col-start-2 lg:row-start-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
              {t("ui", "landing_ex_tag") || "Örnek Okuma"}
            </p>
            <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              {t("ui", "landing_ex_title") || "Sonuçların bir etiketten fazlasıdır."}
            </h2>
            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("ui", "landing_ex_desc") || "Seenly yalnızca seni tanımlamaz. Kendini nasıl gördüğünü ve insanların seni nasıl deneyimlediğini, birbirine bağlı bir okuma olarak gösterir."}
            </p>
          </div>

          {/* Single responsive image element: left on desktop, between title and blocks on mobile */}
          <div className="relative mx-auto max-w-[320px] sm:max-w-none w-full lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <div className="integrated-art mask-organic-1 shadow-contact paper-panel relative lg:-ml-6 overflow-hidden p-0">
              <img
                src={exampleResultImg}
                loading="eager"
                decoding="async"
                width="952"
                height="760"
                alt="Öz algı ve dış algının suluboya katmanlarla iç içe geçtiği örnek Seenly sonucu"
                className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-1"
              />
            </div>
            {/* dotted annotation reaching toward the reading on the right */}
            <ConnectorDots
              variant="flat"
              className="pointer-events-none absolute -right-12 top-1/2 hidden h-14 w-40 -translate-y-1/2 text-clay/55 lg:block"
            />
          </div>

          <div className="relative space-y-7 sm:space-y-8 lg:col-start-2 lg:row-start-2">
            {/* Continuous vertical connector line */}
            <span
              aria-hidden="true"
              className="absolute left-[1.125rem] top-3 bottom-5 w-px bg-foreground/20"
            />
            {blocks.map((block) => {
              const Icon = block.icon
              return (
                <div
                  key={block.title}
                  className="relative grid grid-cols-[2.25rem_1fr] items-start gap-4 sm:gap-5"
                >
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-card shadow-xs">
                    <Icon className={`h-4 w-4 shrink-0 ${block.accent}`} />
                  </span>
                  <div className="pt-1">
                    <h3
                      className={`font-heading text-lg font-medium ${block.accent}`}
                    >
                      {block.title}
                    </h3>
                    <p className="mt-2 text-pretty text-base leading-relaxed text-muted-foreground">
                      {block.text}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
