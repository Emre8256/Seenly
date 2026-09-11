import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"
import codesImg from "../images/landing/codes.avif"

export function SeenlyCodes() {
  const { t } = useLocale()

  const codes = [
    { code: "SLF-04", name: t("home.collection.c1"), family: "gratia", c: "text-navy", b: "border-navy/25" },
    { code: "OUT-11", name: t("home.collection.c2"), family: "porta", c: "text-peach", b: "border-peach/30" },
    { code: "GAP-07", name: t("home.collection.c3"), family: "aura", c: "text-lilac", b: "border-lilac/30" },
    { code: "SLF-09", name: t("home.collection.c4"), family: "aura", c: "text-navy", b: "border-navy/25" },
    { code: "OUT-02", name: t("home.collection.c5"), family: "stratega", c: "text-peach", b: "border-peach/30" },
    { code: "GAP-13", name: t("home.collection.c6"), family: "porta", c: "text-lilac", b: "border-lilac/30" },
  ]

  return (
    <section className="paper-grain relative overflow-hidden bg-background">
      <WatercolorStain
        name="codes-clay"
        hue="clay"
        seed={2}
        intensity={0.12}
        className="right-[-8%] bottom-[-6%] h-[28rem] w-[28rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="grid items-center gap-y-10 gap-x-14 lg:grid-cols-2 lg:gap-20">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
              {t("home.collection.tag")}
            </p>
            <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              {t("home.collection.title")}
            </h2>
            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.collection.desc")}
            </p>
          </div>

          {/* Single responsive image element - positioned on right on desktop, between title and cards on mobile */}
          <div className="relative mx-auto max-w-[280px] sm:max-w-none w-full lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <WatercolorStain
              name="codes-gold"
              hue="gold"
              seed={12}
              intensity={0.2}
              className="-left-6 -top-6 h-[112%] w-[112%]"
            />
            <div className="integrated-art mask-organic-2 shadow-contact paper-panel relative lg:-mr-5 overflow-hidden p-0">
              <img
                src={codesImg}
                loading="lazy"
                decoding="async"
                width="880"
                height="880"
                alt={t("home.collection.illustrationAlt")}
                className="soft-image-edge aspect-square w-full object-cover mask-organic-2"
              />
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {codes.map((item) => (
                <div
                  key={item.code}
                  className={`group rounded-lg border bg-card/60 p-4 transition-all duration-500 hover:-translate-y-1 hover:bg-card ${item.b}`}
                >
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {t(`quiz.identities.families.${item.family}`)}
                  </p>
                  <p
                    className={`mt-2 font-heading text-sm font-medium ${item.c}`}
                  >
                    {item.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-start">
              <a
                href="#/identities"
                className="group inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-peach transition-colors duration-300"
              >
                <span className="border-b border-foreground/30 pb-0.5 transition-colors duration-300 group-hover:border-peach">
                  {t("home.collection.viewAll")}
                </span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
