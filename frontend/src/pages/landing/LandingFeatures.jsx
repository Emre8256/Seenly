import React, { memo } from 'react';
import { UseCases } from '../../components/use-cases';
import { ExampleResult } from '../../components/example-result';

const LandingFeatures = memo(function LandingFeatures() {
  return (
    <>
      <UseCases />
      <ExampleResult />
    </>
  );
});

export default LandingFeatures;
