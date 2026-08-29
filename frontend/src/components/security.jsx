import { Reveal } from "./reveal"
import { HairLine, WatercolorStain, ConnectorDots } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function Security() {
  const { t } = useLocale()

  const principles = [
    {
      n: "01",
      title: t("ui", "landing_security_p1_title") || "Mutlak Anonimlik",
      text: t("ui", "landing_security_p1_text") || "Katılımcı kimlikleri asla sisteme veya size yansıtılmaz. Tüm geri bildirimler tamamen maskelenmiş bir gizlilik katmanından geçerek gelir.",
    },
    {
      n: "02",
      title: t("ui", "landing_security_p2_title") || "Tek cevap sonuç oluşturmaz",
      text: t("ui", "landing_security_p2_text") || "Sonuçlar yalnızca tekrar eden ortak sinyallerden doğar.",
    },
    {
      n: "03",
      title: t("ui", "landing_security_p3_title") || "İz bırakmayan veri",
      text: t("ui", "landing_security_p3_text") || "Algı verileriniz ve sosyal sinyalleriniz asla üçüncü taraflarla paylaşılmaz. Verileriniz ticari bir meta değil, size özel bir arşiv olarak korunur.",
    },
  ]

  return (
    <section className="paper-grain relative overflow-hidden bg-background">
      <WatercolorStain
        name="sec-navy"
        hue="navy"
        seed={27}
        intensity={0.08}
        className="left-[-8%] top-[8%] h-[30rem] w-[30rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="hidden lg:block relative mx-auto max-w-[280px] sm:max-w-none w-full">
            <WatercolorStain
              name="sec-clay"
              hue="clay"
              seed={8}
              intensity={0.16}
              className="-left-6 -top-5 h-[110%] w-[110%]"
            />
            <div className="integrated-art mask-organic-3 shadow-contact paper-panel relative -ml-5 overflow-hidden p-0">
              <img
                src="/images/security.png"
                alt="Bir portrenin anonim siluete dönüştüğü, güvenlik ve anonimliği anlatan suluboya illüstrasyon"
                className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-3"
              />
            </div>
            <ConnectorDots
              variant="fall"
              className="pointer-events-none absolute -right-12 top-10 hidden h-14 w-40 text-clay/55 lg:block"
            />
          </Reveal>

          <div>
            <Reveal>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
                {t("ui", "landing_security_tag") || "Güven"}
              </p>
              <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
                {t("ui", "landing_security_title") || "Güvenli olacak şekilde tasarlandı."}
              </h2>
            </Reveal>

            {/* Mobile Image: displayed above principles list on mobile, hidden on desktop */}
            <div className="lg:hidden my-6 mx-auto max-w-[280px] w-full relative">
              <WatercolorStain
                name="sec-clay-mobile"
                hue="clay"
                seed={8}
                intensity={0.16}
                className="-left-6 -top-5 h-[110%] w-[110%]"
              />
              <div className="integrated-art mask-organic-3 shadow-contact paper-panel overflow-hidden p-0">
                <img
                  src="/images/security.png"
                  alt="Bir portrenin anonim siluete dönüştüğü, güvenlik ve anonimliği anlatan suluboya illüstrasyon"
                  className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-3"
                />
              </div>
            </div>

            <div className="mt-10 space-y-9">
              {principles.map((p, i) => (
                <Reveal
                  key={p.title}
                  delay={i * 120}
                  className="grid grid-cols-[2.5rem_1fr] gap-5"
                >
                  <span className="font-mono text-sm text-clay/70">{p.n}</span>
                  <div>
                    <h3 className="font-heading text-lg font-medium text-foreground">
                      {p.title}
                    </h3>
                    <HairLine className="mt-3 w-12 bg-peach/40" />
                    <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
                      {p.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
