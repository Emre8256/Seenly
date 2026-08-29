import { Reveal } from "./reveal"
import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function Pricing({ onStartClick }) {
  const { locale, t } = useLocale()

  const plans = [
    {
      name: t("ui", "landing_pricing_p1_name") || "Ücretsiz",
      price: "$0",
      period: locale === 'tr' ? "her zaman" : "always",
      description: t("ui", "landing_pricing_p1_desc") || "Sosyal profilinizi oluşturun ve temel algı analizini ücretsiz edinin.",
      features: [
        t("ui", "landing_pricing_p1_f1") || "Self Değerlendirmesi & Self Kartı",
        t("ui", "landing_pricing_p1_f2") || "Temel Sonuçlar ve Güvenli Paylaşım",
        t("ui", "landing_pricing_p1_f3") || "Maksimum 100 Katılımcı Kapasitesi",
        t("ui", "landing_pricing_p1_f4") || "Temel Gap Analizi",
      ],
      highlighted: false,
    },
    {
      name: t("ui", "landing_pricing_p2_name") || "Seenly Deep Report",
      price: "$2.99",
      period: locale === 'tr' ? "tek seferlik" : "one-time",
      description: t("ui", "landing_pricing_p2_desc") || "Detaylı ziyaretçi istatistikleri, soru zaman analizleri ve derinlemesine algı raporu.",
      features: [
        t("ui", "landing_pricing_p2_f1") || "Sınırsız Katılımcı Kapasitesi",
        t("ui", "landing_pricing_p2_f2") || "Detaylı Profil Ziyareti Ölçümü",
        t("ui", "landing_pricing_p2_f3") || "Soruda Geçirilen Zaman Analizi",
        t("ui", "landing_pricing_p2_f4") || "Gelen Analizleri Tek Tek Detaylı İnceleme",
      ],
      highlighted: true,
    },
  ]

  return (
    <section
      id="teklif"
      className="paper-grain relative scroll-mt-20 overflow-hidden bg-background"
    >
      <WatercolorStain
        name="pricing-peach"
        hue="peach"
        seed={19}
        intensity={0.1}
        className="left-[-7%] bottom-[4%] h-[26rem] w-[26rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
            {t("ui", "landing_pricing_tag") || "Teklif"}
          </p>
          <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
            {t("ui", "landing_pricing_title") || "Önce değer, sonra teklif."}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ui", "landing_pricing_desc") || "Temel deneyim ücretsizdir. Daha derin bir okuma istediğinde, tek seferlik raporla devam edebilirsin."}
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 140}
              className={`flex flex-col p-7 sm:p-10 rounded-2xl border ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground border-primary/20"
                  : "bg-card text-foreground border-border/70"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  className={`font-heading text-xl font-medium ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {plan.name}
                </h3>
                <span
                  className={`text-xs ${plan.highlighted ? "text-primary-foreground/65" : "text-muted-foreground"}`}
                >
                  {plan.period}
                </span>
              </div>

              <p
                className={`mt-4 font-heading text-4xl font-normal tracking-tight ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}
              >
                {plan.price}
              </p>
              <p
                className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? "text-primary-foreground/75" : "text-muted-foreground"}`}
              >
                {plan.description}
              </p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-peach" : "text-clay"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      className={`text-[0.95rem] leading-relaxed ${plan.highlighted ? "text-primary-foreground/90" : "text-foreground/85"}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
