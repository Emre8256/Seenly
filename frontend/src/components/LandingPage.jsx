import React, { memo, useEffect } from "react";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import WatercolorBackground from "./WatercolorBackground";
import LandingBelowFold from "../pages/landing/LandingBelowFold";
import "../pages/landing/LandingPage.css";

const LandingPage = memo(function LandingPage({ onStartClick, onLoginClick }) {
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes("nasil-calisir") || hash.includes("baglamlar") || hash.includes("ornek") || hash.includes("teklif"))) {
        const targetId = hash.replace(/^#\/?/, "");
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="landing-watercolor watercolor-page min-h-screen bg-background text-foreground">
      <WatercolorBackground />
      <SiteHeader onStartClick={onStartClick} onLoginClick={onLoginClick} />
      <main>
        <Hero onStartClick={onStartClick} onLoginClick={onLoginClick} />
        <LandingBelowFold onStartClick={onStartClick} />
      </main>
    </div>
  );
});

export default LandingPage;
