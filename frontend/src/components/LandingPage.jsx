import React, { memo } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import LandingHeroSection from "../pages/landing/LandingHeroSection";
import LandingHowItWorks from "../pages/landing/LandingHowItWorks";
import LandingFeatures from "../pages/landing/LandingFeatures";
import LandingArchetypesShowcase from "../pages/landing/LandingArchetypesShowcase";
import LandingFaqPricing from "../pages/landing/LandingFaqPricing";
import "../pages/landing/LandingPage.css";

const LandingPage = memo(function LandingPage({ onStartClick, onLoginClick }) {
  return (
    <div className="paper-wash min-h-screen bg-background text-foreground seenly-landing-wrapper">
      <SiteHeader onStartClick={onStartClick} onLoginClick={onLoginClick} />
      <main>
        <LandingHeroSection onStartClick={onStartClick} onLoginClick={onLoginClick} />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingArchetypesShowcase />
        <LandingFaqPricing onStartClick={onStartClick} />
      </main>
      <SiteFooter />
    </div>
  );
});

export default LandingPage;
