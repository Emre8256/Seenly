"use client"

import { useEffect, useRef, useState } from "react"


/**
 * Slow, gentle scroll-reveal. Atmosphere, not attention.
 * Falls back to visible content when reduced motion is preferred or JS hydration is pending.
 */
export function Reveal({
  children,
  as,
  className,
  delay = 0,
  once = true,
  style,
  ...props
}) {
  const Tag = as ?? "div"
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setShown(false)
          }
        })
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref}
      {...props}
      data-reveal={shown ? "shown" : ""}
      style={{ ...style, "--reveal-delay": `${delay}ms` }}
      className={className}
    >
      {children}
    </Tag>
  )
}
