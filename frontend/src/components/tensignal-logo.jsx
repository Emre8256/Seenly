import React from "react"
import logoPng from "../images/Icons/10Signal.png"
import iconPng from "../images/Icons/10Signal Icon.png"

export function TenSignalLogo({
  className = "h-7 sm:h-[30px] w-auto object-contain",
  variant = "full",
  alt = "10Signal",
  ...props
}) {
  const src = variant === "icon" ? iconPng : logoPng
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      {...props}
    />
  )
}

export function TenSignalIcon({
  className = "h-6 w-6 object-contain",
  alt = "10Signal",
  ...props
}) {
  return (
    <TenSignalLogo
      variant="icon"
      className={className}
      alt={alt}
      {...props}
    />
  )
}

export default TenSignalLogo
