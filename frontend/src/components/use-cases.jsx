import { WatercolorStain } from "./marks"
import { useLocale } from "../context/LocaleContext"
import contextSocial from "../images/landing/context-social.avif"
import contextFriends from "../images/landing/context-friends.avif"
import contextFirstImpression from "../images/landing/context-firstimpression.avif"

export function UseCases() {
  const { t } = useLocale()

  const cases = [
    {
      image: contextSocial,
      alt: "İki kişinin telefonlarında Seenly kartlarını paylaştığı suluboya illüstrasyon",
      plate: t("ui", "landing_case_1_plate") || "Dijital Yansıma",
      title: t("ui", "landing_case_1_title") || "Sosyal profilinde",
      text: t("ui", "landing_case_1_text") || "Profiline Seenly linkini ekle. İnsanlar seni nasıl sunduğunu ve nasıl deneyimlendirdiğini görebilsin.",
      mask: "mask-organic-1",
      offset: "md:mt-0",
      hue: "peach",
      seed: 14,
    },
    {
      image: contextFriends,
      alt: "Grup içinde arkadaşların Seenly okumalarını tartıştığı suluboya illüstrasyon",
      plate: t("ui", "landing_case_2_plate") || "İlişki Derinliği",
      title: t("ui", "landing_case_2_title") || "Arkadaş grubunda",
      text: t("ui", "landing_case_2_text") || "En yakın arkadaşlarından geri bildirim al. Sadece nasıl biri olduğunu değil, grubun içinde ne ifade ettiğini öğren.",
      mask: "mask-organic-2",
      offset: "md:mt-10",
      hue: "lilac",
      seed: 22,
    },
    {
      image: contextFirstImpression,
      alt: "İki kişinin ilk karşılaşma anını tasvir eden suluboya illüstrasyon",
      plate: t("ui", "landing_case_3_plate") || "İlk Karşılaşma",
      title: t("ui", "landing_case_3_title") || "İlk izlenimlerde",
      text: t("ui", "landing_case_3_text") || "Biriyle tanıştığında bıraktığın ilk hissin, zamanla oluşan gerçek etkinle ne kadar örtüştüğünü gör.",
      mask: "mask-organic-3",
      offset: "md:mt-4",
      hue: "gold",
      seed: 31,
    },
  ]

  return (
    <section
      id="baglamlar"
      className="paper-grain surface-color wash-lilac relative scroll-mt-20 overflow-hidden bg-background"
    >
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-14 sm:px-8 md:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
            {t("ui", "landing_cases_tag") || "Bağlamlar"}
          </p>
          <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
            {t("ui", "landing_cases_title") || "Seenly sadece bir test değildir."}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ui", "landing_cases_desc") || "İnsanların seni nasıl deneyimlediğini, hayatının farklı sahnelerinde keşfedebilirsin."}
          </p>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {cases.map((item, i) => (
            <figure
              key={item.title}
              className={`group relative flex flex-row items-center gap-5 md:flex-col md:items-stretch ${item.offset}`}
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
                className={`integrated-art ${item.mask} shadow-contact-sm paper-panel relative overflow-hidden p-0 w-[35%] sm:w-[30%] md:w-full shrink-0 ${i === 1 ? "md:-mx-4" : i === 2 ? "md:-mr-5" : "md:-ml-5"}`}
              >
                <img
                  src={item.image || "/placeholder.svg"}
                  loading="eager"
                  decoding="async"
                  width="680"
                  height="850"
                  alt={item.alt}
                  className={`soft-image-edge aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] ${item.mask}`}
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute left-8 top-[44%] h-px w-24 border-t border-dotted border-clay/35 md:left-auto md:right-4 hidden md:block"
              />
              <figcaption className="mt-0 md:mt-6 flex-1">
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] text-clay/70">
                  {item.plate}
                </span>
                <h3 className="mt-1 md:mt-3 font-heading text-base md:text-xl font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 md:mt-2.5 text-pretty text-xs sm:text-[0.95rem] leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
