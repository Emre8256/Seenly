import React from "react";
import { SocialProof } from "../../components/social-proof";
import { OpeningStatement } from "../../components/opening-statement";
import { SiteFooter } from "../../components/site-footer";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingFeatures from "./LandingFeatures";
import LandingArchetypesShowcase from "./LandingArchetypesShowcase";
import LandingFaqPricing from "./LandingFaqPricing";

export default function LandingBelowFold({ onStartClick }) {
  return (
    <>
      <SocialProof />
      <OpeningStatement />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingArchetypesShowcase />
      <LandingFaqPricing onStartClick={onStartClick} />
      <SiteFooter />
    </>
  );
}
