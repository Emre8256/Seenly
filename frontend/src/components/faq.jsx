"use client"

import { useState } from "react"
import { Reveal } from "./reveal"
import { WatercolorStain } from "./marks"

const faqs = [
  {
    q: "Seenly bir kişilik testi mi?",
    a: "Hayır. Seenly, öz algın ile dış algın arasındaki ilişkiyi keşfetmene yardımcı olan bir deneyimdir; seni bir kalıba sokmaz.",
  },
  {
    q: "Kaç kişinin katkısı gerekir?",
    a: "Outside özeti için en az 3, Gap okuması için en az 6 katkı gerekir.",
  },
  {
    q: "Katılımcılar görünür mü?",
    a: "Hayır. Katılımcıların kimlikleri hiçbir zaman paylaşılmaz.",
  },
  {
    q: "Sonuçlar değişebilir mi?",
    a: "Evet. Yeni katkılar geldikçe sonuçların zamanla gelişebilir.",
  },
  {
    q: "Sonuçlarımı paylaşmak zorunda mıyım?",
    a: "Hayır. Paylaşım tamamen senin kontrolündedir.",
  },
]

export function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="sorular" className="paper-grain relative scroll-mt-20 overflow-hidden bg-background">
      <WatercolorStain
        name="faq-gold"
        hue="gold"
        seed={15}
        intensity={0.1}
        className="right-[-7%] top-[6%] h-[26rem] w-[26rem]"
      />
      <div className="above-surface mx-auto max-w-[1180px] px-5 py-24 sm:px-8 md:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.34em] text-clay">
              Sorular
            </p>
            <h2 className="mt-5 text-balance font-heading text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
              Merak ettiklerin.
            </h2>
          </Reveal>

          <ol className="divide-y divide-border/70 border-t border-border/70">
            {faqs.map((faq, i) => {
              const isOpen = open === i
              return (
                <Reveal as="li" key={faq.q} delay={i * 70}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading text-lg font-medium text-foreground sm:text-xl">
                      {faq.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative mt-2.5 h-4 w-4 shrink-0"
                    >
                      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-clay" />
                      <span
                        className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-clay transition-transform duration-500 ${isOpen ? "rotate-90 opacity-0" : "rotate-0"}`}
                      />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] pb-6 opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <p className="overflow-hidden text-pretty text-base leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
