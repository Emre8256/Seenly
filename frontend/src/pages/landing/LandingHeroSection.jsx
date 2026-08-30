import React, { memo } from 'react';
import { Hero } from '../../components/hero';
import { SocialProof } from '../../components/social-proof';
import { OpeningStatement } from '../../components/opening-statement';

const LandingHeroSection = memo(function LandingHeroSection({ onStartClick, onLoginClick }) {
  return (
    <>
      <Hero onStartClick={onStartClick} onLoginClick={onLoginClick} />
      <SocialProof />
      <OpeningStatement />
    </>
  );
});

export default LandingHeroSection;
