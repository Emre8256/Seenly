import { useLocale } from "../context/LocaleContext"
import { DottedThread, WatercolorStain } from "./marks"

export function SocialProof() {
  const { t } = useLocale()

  const stats = [
    {
      value: t("home.stats.stat1Val"),
      label: t("home.stats.stat1Lbl"),
      accent: "text-clay",
    },
    {
      value: t("home.stats.stat2Val"),
      label: t("home.stats.stat2Lbl"),
      accent: "text-foreground",
    },
    {
      value: t("home.stats.stat3Val"),
      label: t("home.stats.stat3Lbl"),
      accent: "text-clay",
    },
    {
      value: t("home.stats.stat4Val"),
      label: t("home.stats.stat4Lbl"),
      accent: "text-foreground",
    },
  ]

  return (
    <section className="paper-grain relative overflow-hidden bg-background">
      <WatercolorStain
        name="proof-gold"
        hue="gold"
        seed={41}
        intensity={0.08}
        className="left-[2%] top-[6%] h-[24rem] w-[24rem]"
      />
      <WatercolorStain
        name="proof-lilac"
        hue="lilac"
        seed={42}
        intensity={0.07}
        className="right-[4%] bottom-[-24%] h-[28rem] w-[28rem]"
      />

      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="relative">
          <DottedThread className="mx-auto h-5 w-32 text-clay/45" />

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-4 max-w-md sm:max-w-none mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`relative min-h-[7.5rem] sm:min-h-40 px-2 py-4 flex flex-col items-center text-center sm:items-start sm:text-left ${index % 2 === 0 ? "lg:translate-y-3" : "lg:-translate-y-3"
                  }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-2 top-0 h-full w-px bg-border/45 hidden sm:block lg:hidden"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-1 left-2 h-2 w-2 rounded-full bg-clay/35 hidden sm:block lg:hidden"
                />
                <p
                  className={`font-heading text-[2.4rem] min-[375px]:text-[2.8rem] sm:text-[3.85rem] lg:text-[4.3rem] font-normal leading-none tracking-[-0.055em] text-center sm:text-left ${stat.accent}`}
                >
                  <span className="opacity-90">{stat.value}</span>
                </p>
                <p className="mt-4 max-w-44 text-[0.9rem] leading-relaxed text-muted-foreground sm:text-[0.95rem] text-center sm:text-left mx-auto sm:mx-0">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-5 text-clay/45">
            <span className="h-px flex-1 bg-current/35" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.32em]">
              {t("home.stats.collectiveIndex")}
            </span>
            <span className="h-px flex-1 bg-current/35" />
          </div>
        </div>
      </div>
    </section>
  )
}
