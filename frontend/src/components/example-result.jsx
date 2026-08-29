import { Reveal } from "./reveal"
import { WatercolorStain, ConnectorDots } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function ExampleResult() {
  const { t } = useLocale()

  const blocks = [
    {
      title: t("ui", "landing_ex_b1_title") || "01 / Testi Çözün ve Profilinizi Oluşturun",
      text: t("ui", "landing_ex_b1_text") || "Birkaç dakikalık öz değerlendirmeyi tamamlayarak kendi anlatımınızı şekillendirin ve dijital Self kartınızı anında alın.",
      dot: "bg-navy",
      accent: "text-navy",
    },
    {
      title: t("ui", "landing_ex_b2_title") || "02 / Linkinizi Profilinize Ekleyin ve Paylaşın",
      text: t("ui", "landing_ex_b2_text") || "Size özel üretilen profil bağlantısını kopyalayıp sosyal medya hesaplarınıza veya yakın çevrenize ulaştırarak tamamen anonim geri bildirimleri toplamaya başlayın.",
      dot: "bg-peach",
      accent: "text-peach",
    },
    {
      title: t("ui", "landing_ex_b3_title") || "03 / Gelen Analizleri Canlı Takip Edin",
      text: t("ui", "landing_ex_b3_text") || "Yanıtlar biriktikçe kontrol paneliniz anlık olarak güncellenir. Kendi algınız ile dış algının nerede birleşip nerede ayrıştığını (Gap) dilediğiniz an inceleyin.",
      dot: "bg-lilac",
      accent: "text-lilac",
    },
  ]

  return (
    <section
      id="ornek"
      className="paper-grain surface-color wash-ink relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="ex-lilac"
        hue="lilac"
        seed={6}
        intensity={0.18}
        className="left-[-9%] top-[10%] h-[32rem] w-[32rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Desktop Image: hidden on mobile */}
          <Reveal className="hidden lg:block relative mx-auto max-w-[320px] sm:max-w-none w-full">
            <div className="integrated-art mask-organic-1 shadow-contact paper-panel relative -ml-6 overflow-hidden p-0">
              <img
                src="/images/example-result.png"
                alt="Öz algı ve dış algının suluboya katmanlarla iç içe geçtiği örnek Seenly sonucu"
                className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-1"
              />
            </div>
            {/* dotted annotation reaching toward the reading on the right */}
            <ConnectorDots
              variant="flat"
              className="pointer-events-none absolute -right-12 top-1/2 hidden h-14 w-40 -translate-y-1/2 text-clay/55 lg:block"
            />
          </Reveal>

          <div>
            <Reveal>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
                {t("ui", "landing_ex_tag") || "Örnek Okuma"}
              </p>
              <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
                {t("ui", "landing_ex_title") || "Sonuçların bir etiketten fazlasıdır."}
              </h2>
              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("ui", "landing_ex_desc") || "Seenly yalnızca seni tanımlamaz. Kendini nasıl gördüğünü ve insanların seni nasıl deneyimlediğini, birbirine bağlı bir okuma olarak gösterir."}
              </p>
            </Reveal>

            {/* Mobile Image: displayed above the timeline blocks on mobile, hidden on desktop */}
            <div className="lg:hidden my-6 mx-auto max-w-[320px] w-full relative">
              <div className="integrated-art mask-organic-1 shadow-contact paper-panel overflow-hidden p-0">
                <img
                  src="/images/example-result.png"
                  alt="Öz algı ve dış algının suluboya katmanlarla iç içe geçtiği örnek Seenly sonucu"
                  className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-1"
                />
              </div>
            </div>

            <div className="mt-10 space-y-5 sm:space-y-7">
              {blocks.map((block, i) => (
                <Reveal
                  key={block.title}
                  delay={i * 120}
                  className="border-l border-border pl-4 sm:pl-6"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${block.dot}`} />
                    <h3
                      className={`font-heading text-lg font-medium ${block.accent}`}
                    >
                      {block.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-pretty text-base leading-relaxed text-muted-foreground">
                    {block.text}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
