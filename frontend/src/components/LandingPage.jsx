import React from "react"
import { SiteHeader } from "./site-header"
import { Hero } from "./hero"
import { SocialProof } from "./social-proof"
import { OpeningStatement } from "./opening-statement"
import { HowItWorks } from "./how-it-works"
import { UseCases } from "./use-cases"
import { ExampleResult } from "./example-result"
import { SeenlyCodes } from "./seenly-codes"
import { Pricing } from "./pricing"
import { Security } from "./security"
import { FinalCta } from "./final-cta"
import { SiteFooter } from "./site-footer"

export default function LandingPage({ onStartClick, onLoginClick }) {
  return (
    <div className="paper-wash min-h-screen bg-background text-foreground">
      <SiteHeader onStartClick={onStartClick} onLoginClick={onLoginClick} />
      <main>
        <Hero onStartClick={onStartClick} onLoginClick={onLoginClick} />
        <SocialProof />
        <OpeningStatement />
        <HowItWorks />
        <UseCases />
        <ExampleResult />
        <SeenlyCodes />
        <Pricing onStartClick={onStartClick} />
        <Security />
        <FinalCta onStartClick={onStartClick} />
      </main>
      <SiteFooter />
    </div>
  )
}
