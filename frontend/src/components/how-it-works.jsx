import { Reveal } from "./reveal"
import { HairLine, WatercolorStain, ConnectorDots } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function HowItWorks() {
  const { t } = useLocale()

  const movements = [
    {
      index: "I",
      title: "Self",
      turkish: t("ui", "landing_hiw_m1_turkish") || "Kendi anlatımın",
      text: t("ui", "landing_hiw_m1_text") || "Kendini şu anda nasıl gördüğünü, kendi düşüncelerini paylaşırsın. Burası senin başlangıç noktan.",
      accent: "text-navy",
      rule: "bg-navy/40",
    },
    {
      index: "II",
      title: "Outside",
      turkish: t("ui", "landing_hiw_m2_turkish") || "Dışarının sesi",
      text: t("ui", "landing_hiw_m2_text") || "Seni tanıyan insanlar anonim olarak katkıda bulunur. Tek tek cevaplar değil, tekrar eden ortak sinyaller önemlidir.",
      accent: "text-peach",
      rule: "bg-peach/50",
    },
    {
      index: "III",
      title: "Gap",
      turkish: t("ui", "landing_hiw_m3_turkish") || "Aradaki boşluk",
      text: t("ui", "landing_hiw_m3_text") || "Öz algın ile dış algın yan yana gelir. Nerede buluştuğunuzu ve nerede ayrıştığınızı birlikte görürsün.",
      accent: "text-lilac",
      rule: "bg-lilac/50",
    },
  ]

  return (
    <section
      id="nasil-calisir"
      className="paper-grain relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="hiw-peach"
        hue="peach"
        seed={9}
        intensity={0.16}
        className="left-[-8%] top-[18%] h-[30rem] w-[30rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* left: the framing + woven image */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
                {t("ui", "landing_hiw_tag") || "Deneyim"}
              </p>
              <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
                {t("ui", "landing_hiw_title") || "Üç hareketten oluşan bir okuma."}
              </h2>
              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
                {t("ui", "landing_hiw_desc") || "Önce sen kendini anlatırsın. Sonra çevren sessizce katkıda bulunur. Son hareket, ikisinin birbirine değdiği yerdir."}
              </p>
            </Reveal>

            <Reveal delay={160} className="relative mt-10">
              <div className="integrated-art mask-organic-2 shadow-contact paper-panel relative -ml-4 overflow-hidden p-0">
                <img
                  src="/images/how-it-works.png"
                  alt="Self, Outside ve Gap adımlarını gösteren üç katmanın suluboya illüstrasyonu"
                  className="soft-image-edge aspect-[4/3] w-full object-cover mask-organic-2"
                />
              </div>
              {/* dotted annotation drawn from the plate toward the score on the right */}
              <ConnectorDots
                variant="rise"
                className="pointer-events-none absolute -right-10 top-6 hidden h-16 w-36 text-clay/60 lg:block"
              />
            </Reveal>
          </div>

          {/* right: the three movements as a vertical score */}
          <ol className="relative">
            <span
              aria-hidden="true"
              className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-border"
            />
            {movements.map((m, i) => (
              <Reveal
                as="li"
                key={m.title}
                delay={i * 120}
                className="relative grid grid-cols-[2.3rem_1fr] gap-5 pb-14 last:pb-0 sm:gap-7"
              >
                <span
                  className={`relative z-10 mt-1 font-heading text-lg ${m.accent}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
                    {m.index}
                  </span>
                </span>
                <div className="pt-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3
                      className={`font-heading text-2xl font-medium ${m.accent}`}
                    >
                      {m.title}
                    </h3>
                    <span className="text-sm italic text-muted-foreground">
                      {m.turkish}
                    </span>
                  </div>
                  <HairLine className={`mt-4 w-16 ${m.rule}`} />
                  <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
                    {m.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
