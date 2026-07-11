/** Two faintly overlapping circles — the recurring "self / outside" motif. */
export function IntersectingCircles({
  className,
  style,
}) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="48" cy="40" r="34" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="72" cy="40" r="34" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/** A small constellation of dots connected by hairlines. */
export function DottedThread({
  className,
  style,
}) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 20 H196" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
      <circle cx="4" cy="20" r="2.4" fill="currentColor" />
      <circle cx="68" cy="20" r="2.4" fill="currentColor" opacity="0.75" />
      <circle cx="132" cy="20" r="2.4" fill="currentColor" opacity="0.6" />
      <circle cx="196" cy="20" r="2.4" fill="currentColor" />
    </svg>
  )
}

/** A single thin underline flourish for section labels. */
export function HairLine({ className }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        height: 1,
        background:
          "linear-gradient(90deg, transparent, currentColor 18%, currentColor 82%, transparent)",
      }}
    />
  )
}

/**
 * A dotted hand-drawn line that ties a plate/illustration into the text
 * beside it. Decorative; carries a node at each end like a catalog annotation.
 */
export function ConnectorDots({
  className,
  style,
  variant = "rise",
}) {
  const path =
    variant === "fall"
      ? "M2 8 C 46 8 70 50 138 52"
      : variant === "flat"
        ? "M2 26 C 48 22 92 30 138 26"
        : "M2 52 C 46 52 70 10 138 8"
  const start = variant === "fall" ? [2, 8] : variant === "flat" ? [2, 26] : [2, 52]
  const end = variant === "fall" ? [138, 52] : variant === "flat" ? [138, 26] : [138, 8]
  return (
    <svg
      viewBox="0 0 140 60"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="0.5 5.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx={start[0]} cy={start[1]} r="2" fill="currentColor" opacity="0.8" />
      <circle cx={end[0]} cy={end[1]} r="2" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

/**
 * Watercolor pigment soaking into the paper. An organic, turbulence-displaced
 * stain at very low opacity — reads as pigment bleeding from a nearby
 * illustration, never as a glowing gradient blob. Decorative only.
 *
 * `name` must be unique per instance so the SVG filter/gradient ids don't collide.
 */
export function WatercolorStain({
  name,
  hue = "peach",
  seed = 4,
  intensity = 0.2,
  className,
  style,
}) {
  const fid = `stain-f-${name}`
  const gid = `stain-g-${name}`
  const color = `var(--${hue})`
  return (
    <span aria-hidden="true" className={`pigment ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 220 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={fid} x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.013"
              numOctaves="3"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="48"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <radialGradient id={gid} cx="46%" cy="43%" r="58%">
            <stop offset="0%" stopColor={color} stopOpacity={intensity} />
            <stop offset="46%" stopColor={color} stopOpacity={intensity * 0.5} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="105" rx="86" ry="80" fill={`url(#${gid})`} filter={`url(#${fid})`} />
      </svg>
    </span>
  )
}
