import { Reveal } from "./reveal"
import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function SeenlyCodes() {
  const { t } = useLocale()

  const codes = [
    { code: "SLF-04", name: t("ui", "landing_codes_c1") || "Dürüst İdealist", family: "gratia", c: "text-navy", b: "border-navy/25" },
    { code: "OUT-11", name: t("ui", "landing_codes_c2") || "Huzur Deposu", family: "porta", c: "text-peach", b: "border-peach/30" },
    { code: "GAP-07", name: t("ui", "landing_codes_c3") || "Estetik Vizyon", family: "aura", c: "text-lilac", b: "border-lilac/30" },
    { code: "SLF-09", name: t("ui", "landing_codes_c4") || "Karizmatik Çıpa", family: "aura", c: "text-navy", b: "border-navy/25" },
    { code: "OUT-02", name: t("ui", "landing_codes_c5") || "Usta Stratejist", family: "stratega", c: "text-peach", b: "border-peach/30" },
    { code: "GAP-13", name: t("ui", "landing_codes_c6") || "Neşeli Çıpa", family: "porta", c: "text-lilac", b: "border-lilac/30" },
  ]

  return (
    <section className="paper-grain relative overflow-hidden bg-background">
      <WatercolorStain
        name="codes-clay"
        hue="clay"
        seed={31}
        intensity={0.12}
        className="right-[-8%] bottom-[-6%] h-[28rem] w-[28rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
              {t("ui", "landing_codes_tag") || "Koleksiyon"}
            </p>
            <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              {t("ui", "landing_codes_title") || "Her sonucun kendine ait bir dili vardır."}
            </h2>
            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("ui", "landing_codes_desc") || "Seenly sonuçları yalnızca bir açıklama değil; paylaşılabilir bir kimlik ve keşfedilecek bir koleksiyon parçası sunar."}
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {codes.map((item, i) => (
                <Reveal
                  key={item.code}
                  delay={i * 70}
                  className={`group rounded-lg border bg-card/60 p-4 transition-all duration-500 hover:-translate-y-1 hover:bg-card ${item.b}`}
                >
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {t("ui", "family_" + item.family) || item.family}
                  </p>
                  <p
                    className={`mt-2 font-heading text-sm font-medium ${item.c}`}
                  >
                    {item.name}
                  </p>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 flex justify-start">
              <a
                href="#/identities"
                className="group inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-peach transition-colors duration-300"
              >
                <span className="border-b border-foreground/30 pb-0.5 transition-colors duration-300 group-hover:border-peach">
                  {t("ui", "landing_codes_view_all") || "Tüm Sosyal Kimlikleri Keşfet"}
                </span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative order-1 lg:order-2">
            <WatercolorStain
              name="codes-gold"
              hue="gold"
              seed={12}
              intensity={0.2}
              className="-left-6 -top-6 h-[112%] w-[112%]"
            />
            <div className="integrated-art mask-organic-2 shadow-contact paper-panel relative -mr-5 overflow-hidden p-0">
              <img
                src="/images/codes.png"
                alt="Altın çerçeveli koleksiyon kartları halinde sunulan Seenly kodlarının suluboya illüstrasyonu"
                className="soft-image-edge aspect-square w-full object-cover mask-organic-2"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
