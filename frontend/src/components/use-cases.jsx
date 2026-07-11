import { Reveal } from "./reveal"
import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"

export function UseCases() {
  const { t } = useLocale()

  const cases = [
    {
      image: "/images/context-social.png",
      alt: "İki kişinin telefonlarında Seenly kartlarını paylaştığı suluboya illüstrasyon",
      plate: t("ui", "landing_case_1_plate") || "Dijital Yansıma",
      title: t("ui", "landing_case_1_title") || "Sosyal profilinde",
      text: t("ui", "landing_case_1_text") || "Profiline Seenly linkini ekle. İnsanlar seni nasıl sunduğunu ve nasıl deneyimlendirdiğini görebilsin.",
      mask: "mask-organic-1",
      offset: "md:mt-0",
      hue: "peach",
      seed: 4,
    },
    {
      image: "/images/context-friends.png",
      alt: "Asılı cam panellerin ortak sinyallerle birbirine bağlandığı suluboya illüstrasyon",
      plate: t("ui", "landing_case_2_plate") || "Sosyal Dinamik",
      title: t("ui", "landing_case_2_title") || "Arkadaş grubunda",
      text: t("ui", "landing_case_2_text") || "Yakın çevrenden geri bildirim al ve sizi birbirinize bağlayan ortak sinyallerle keşfet.",
      mask: "mask-organic-3",
      offset: "md:mt-20",
      hue: "lilac",
      seed: 14,
    },
    {
      image: "/images/context-firstimpression.png",
      alt: "Galeri salonunda asılı sanat eserlerinin yer aldığı suluboya illüstrasyon",
      plate: t("ui", "landing_case_3_plate") || "İlk İzlenim",
      title: t("ui", "landing_case_3_title") || "Yeni tanışmalarda",
      text: t("ui", "landing_case_3_text") || "İlk izlenimlerin ile kendini nasıl gördüğün arasındaki ilişkiyi incele.",
      mask: "mask-organic-2",
      offset: "md:mt-8",
      hue: "gold",
      seed: 21,
    },
  ]

  return (
    <section
      id="baglamlar"
      className="paper-grain surface-color wash-lilac relative scroll-mt-20 overflow-hidden bg-background"
    >
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
            {t("ui", "landing_cases_tag") || "Bağlamlar"}
          </p>
          <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
            {t("ui", "landing_cases_title") || "Seenly sadece bir test değildir."}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ui", "landing_cases_desc") || "İnsanların seni nasıl deneyimlediğini, hayatının farklı sahnelerinde keşfedebilirsin."}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {cases.map((item, i) => (
            <Reveal
              as="figure"
              key={item.title}
              delay={i * 140}
              className={`group relative flex flex-col ${item.offset}`}
            >
              {/* the plate's own pigment, soaking into the paper beneath it */}
              <WatercolorStain
                name={`uc-${i}`}
                hue={item.hue}
                seed={item.seed}
                intensity={0.18}
                className="-left-6 -top-5 h-[108%] w-[108%]"
              />
              <div
                className={`integrated-art ${item.mask} shadow-contact-sm paper-panel relative overflow-hidden p-0 ${i === 1 ? "md:-mx-4" : i === 2 ? "md:-mr-5" : "md:-ml-5"}`}
              >
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.alt}
                  className={`soft-image-edge aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] ${item.mask}`}
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute left-8 top-[44%] h-px w-24 border-t border-dotted border-clay/35 md:left-auto md:right-4"
              />
              <figcaption className="mt-6">
                <span className="font-mono text-xs uppercase tracking-[0.28em] text-clay/70">
                  {item.plate}
                </span>
                <h3 className="mt-3 font-heading text-xl font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-pretty text-[0.95rem] leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
