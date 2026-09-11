import { HairLine, WatercolorStain, ConnectorDots } from "./marks"
import { useLocale } from "../context/LocaleContext"
import securityImg from "../images/landing/security.avif"

export function Security() {
  const { t } = useLocale()

  const principles = [
    {
      n: "01",
      title: t("home.security.p1Title"),
      text: t("home.security.p1Text"),
    },
    {
      n: "02",
      title: t("home.security.p2Title"),
      text: t("home.security.p2Text"),
    },
    {
      n: "03",
      title: t("home.security.p3Title"),
      text: t("home.security.p3Text"),
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
        <div className="grid items-center gap-y-10 gap-x-14 lg:grid-cols-2 lg:gap-20">
          <div className="lg:col-start-2 lg:row-start-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
              {t("home.security.tag")}
            </p>
            <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              {t("home.security.title")}
            </h2>
          </div>

          {/* Single responsive image element: left column on desktop, between title and principles on mobile */}
          <div className="relative mx-auto max-w-[280px] sm:max-w-none w-full lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <WatercolorStain
              name="sec-clay"
              hue="clay"
              seed={8}
              intensity={0.16}
              className="-left-6 -top-5 h-[110%] w-[110%]"
            />
            <div className="integrated-art mask-organic-3 shadow-contact paper-panel relative lg:-ml-5 overflow-hidden p-0">
              <img
                src={securityImg}
                loading="lazy"
                decoding="async"
                width="880"
                height="700"
                alt={t("home.security.illustrationAlt")}
                className="soft-image-edge aspect-[5/4] w-full object-cover mask-organic-3"
              />
            </div>
            <ConnectorDots
              variant="fall"
              className="pointer-events-none absolute -right-12 top-10 hidden h-14 w-40 text-clay/55 lg:block"
            />
          </div>

          <div className="lg:col-start-2 lg:row-start-2 space-y-9">
            {principles.map((p) => (
              <div
                key={p.title}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
