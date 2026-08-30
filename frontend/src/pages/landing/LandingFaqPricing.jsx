import React, { memo } from 'react';
import { Pricing } from '../../components/pricing';
import { Security } from '../../components/security';
import { FinalCta } from '../../components/final-cta';

const LandingFaqPricing = memo(function LandingFaqPricing({ onStartClick }) {
  return (
    <>
      <Pricing onStartClick={onStartClick} />
      <Security />
      <FinalCta onStartClick={onStartClick} />
    </>
  );
});

export default LandingFaqPricing;
