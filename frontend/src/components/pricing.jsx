import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"
import { ShieldCheck, Check } from "lucide-react"

export function Pricing({ onStartClick }) {
  const { locale, t } = useLocale()

  const premiumPrice = t("ui", "pricing_plan_premium_price") || "$2.99"

  const plans = [
    {
      id: "free",
      name: t("ui", "landing_pricing_p1_name") || "Ücretsiz",
      price: "$0",
      period: locale === 'tr' ? "her zaman" : "always",
      description: t("ui", "landing_pricing_p1_desc") || (locale === 'tr' ? "Profilini oluştur ve temel algı analizine ücretsiz eriş." : "Create your profile and access basic perception analysis for free."),
      features: [
        {
          title: t("ui", "landing_pricing_p1_f1") || "Öz Değerlendirme & Self Kartı",
          desc: locale === 'tr' ? "10 hızlı sinyalle başlangıç profilin" : "Initial profile with 10 quick signals",
        },
        {
          title: t("ui", "landing_pricing_p1_f3") || "Maksimum 100 Katılımcı Kapasitesi",
          desc: locale === 'tr' ? "100 arkadaş yanıtına kadar ücretsiz kota" : "Free quota for up to 100 friend responses",
        },
        {
          title: t("ui", "landing_pricing_p1_f4") || "Temel Fark (Gap) Analizi",
          desc: locale === 'tr' ? "Öz algı ile dış algı kesişimi" : "Overlap of self and outside perception",
        },
        {
          title: t("ui", "landing_pricing_p1_f2") || "Temel Sonuçlar & Güvenli Paylaşım",
          desc: locale === 'tr' ? "Anonim profil bağlantınla kolay paylaşım" : "Easy sharing with anonymous link",
        },
      ],
      highlighted: false,
    },
    {
      id: "plus",
      name: "Seenly Plus",
      price: premiumPrice,
      period: locale === 'tr' ? "tek seferlik" : "one-time",
      badge: locale === 'tr' ? "Abonelik Yok" : "No Subscription",
      description: t("ui", "landing_pricing_p2_desc") || (locale === 'tr' ? "Tüm analizlerin kilidini ve sınırsız katılımcı kotasını tek seferde açın." : "Unlock all deep analytics and unlimited respondent capacity in one single step."),
      features: [
        {
          title: t("ui", "landing_pricing_p2_f1") || "Sınırsız Katılımcı Kotası",
          desc: locale === 'tr' ? "100 yanıt limitine takılmadan sınırsız yanıt toplayın" : "Collect unlimited feedback without any response limits",
        },
        {
          title: t("ui", "landing_pricing_p2_f2") || "Gelen Analiz Detayları",
          desc: locale === 'tr' ? "10 karakter sinyali ve puan dökümünü görün" : "View 10-signal scores and detailed answer breakdowns",
        },
        {
          title: t("ui", "landing_pricing_p2_f3") || "Soruda Geçirilen Zaman",
          desc: locale === 'tr' ? "En çok ve en az düşünülen sorular" : "See the most and least contemplated questions",
        },
        {
          title: t("ui", "landing_pricing_p2_f4") || "Profil Ziyaretleri",
          desc: locale === 'tr' ? "Ziyaretçi sayısını ve yanıta dönüşüm oranlarını takip edin" : "Track visitor volume and response conversion rates",
        },
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
      <div className="above-surface mx-auto max-w-[1180px] px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-clay">
            {t("ui", "landing_pricing_tag") || "Teklif"}
          </p>
          <h2 className="mt-3 sm:mt-4 text-balance font-heading text-2xl min-[375px]:text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            {t("ui", "landing_pricing_title") || "Önce değer, sonra teklif."}
          </h2>
          <p className="mt-3 sm:mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base max-w-xl mx-auto">
            {t("ui", "landing_pricing_desc") || "Temel deneyim ücretsizdir. Daha derin bir okuma istediğinde tek seferlik bir raporla devam edebilirsin."}
          </p>
        </div>

        <div className="mx-auto mt-8 sm:mt-12 md:mt-16 grid max-w-md md:max-w-4xl gap-4 sm:gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-5 sm:p-7 md:p-8 rounded-2xl border transition-all ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground border-primary/30 shadow-md"
                  : "bg-card text-foreground border-border/70 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-heading text-lg sm:text-xl font-medium ${
                      plan.highlighted ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <span
                    className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      plan.highlighted
                        ? "bg-white/15 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                  <span
                    className={`font-heading text-3xl sm:text-4xl font-normal tracking-tight ${
                      plan.highlighted ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.badge && (
                    <span className="text-[11px] font-medium text-peach">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p
                  className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                    plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>

                <div
                  className={`my-4 sm:my-5 h-px ${
                    plan.highlighted ? "bg-white/15" : "bg-border/60"
                  }`}
                />

                <ul className="space-y-3 sm:space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature.title} className="flex items-start gap-2.5 sm:gap-3">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-peach/25 text-peach"
                            : "bg-clay/15 text-clay"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-[13px] sm:text-sm font-medium leading-snug ${
                            plan.highlighted
                              ? "text-primary-foreground"
                              : "text-foreground/90"
                          }`}
                        >
                          {feature.title}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] sm:text-xs leading-normal ${
                            plan.highlighted
                              ? "text-primary-foreground/65"
                              : "text-muted-foreground"
                          }`}
                        >
                          {feature.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
          ))}
        </div>

        {/* Security & Payment assurance footer */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-[11.5px] sm:text-xs text-muted-foreground text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-clay shrink-0" />
          <span>{locale === 'tr' ? "256-Bit SSL Güvenli Ödeme • Tek Seferlik • Yenileme Ücreti Yok" : "256-Bit SSL Secure Payment • One-Time • No Recurring Fees"}</span>
        </div>
      </div>
    </section>
  )
}
