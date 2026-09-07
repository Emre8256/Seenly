"use client"

import { useEffect, useRef, useState } from "react"

const listenerMap = new Map();
let sharedObserver = null;

function getSharedObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const callback = listenerMap.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting, entry);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
    );
  }
  return sharedObserver;
}

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

    const observer = getSharedObserver();
    if (!observer) {
      setShown(true);
      return;
    }

    const handleIntersect = (isIntersecting) => {
      if (isIntersecting) {
        setShown(true);
        if (once) {
          observer.unobserve(el);
          listenerMap.delete(el);
        }
      } else if (!once) {
        setShown(false);
      }
    };

    listenerMap.set(el, handleIntersect);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      listenerMap.delete(el);
    };
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
