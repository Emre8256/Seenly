/**
 * Psychometric Scoring & Nuance Calibration Engine for Seenly
 * 
 * Maps discrete 1-5 Likert survey inputs into continuous, organic, realistic
 * percentage scores and provides deterministic micro-variances so traits feel
 * rich, nuanced, and professionally calibrated rather than flat multiples of 20%/25%.
 * 
 * Guarantees:
 * 1. Strict monotonicity: higher input ratings always yield higher calibrated scores.
 * 2. Deterministic: the same trait with the same input rating always generates the identical calibrated score.
 * 3. Continuous multi-respondent interpolation: fractional aggregate means (e.g. 4.25) smoothly interpolate.
 * 4. Realistic range limits: scores reside in natural psychometric bounds (12% to 96%) without flat 0% or 100% artifacts.
 */

export const TRAIT_CALIBRATION_OFFSETS = {
  samimiyet: 1,      // +1% warm nuance
  cekicilik: -2,     // -2% subtle exclusivity
  zeka: 3,           // +3% sharp intellect
  vizyon: -1,        // -1% deep strategic vision
  enerji: 2,         // +2% vibrant presence
  guvenilirlik: 4,   // +4% bedrock trust
  ego: -3,           // -3% controlled poise
  basari: 0,         // baseline achievement
  comertlik: 2,      // +2% giving spirit
  olgunluk: 1        // +1% grounded maturity
};

/**
 * Normalizes any score input (1-5 scale or 0-1 scale) to a standard 1.0 - 5.0 float.
 */
export function normalizeRawScore(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 3.0;
  if (num > 1.0001 || num === 1.0) {
    return Math.max(1.0, Math.min(5.0, num));
  }
  return Math.max(1.0, Math.min(5.0, 1.0 + num * 4.0));
}

/**
 * Base psychometric response curve for 1.0 - 5.0 continuous scores.
 * Level 1 -> 16%
 * Level 2 -> 32%
 * Level 3 -> 52%
 * Level 4 -> 76%
 * Level 5 -> 92%
 */
export function evaluateBaseCurve(val) {
  const v = Math.max(1.0, Math.min(5.0, val));
  if (v <= 2.0) {
    return 16.0 + (v - 1.0) * 16.0; // 1.0 -> 16, 2.0 -> 32
  } else if (v <= 3.0) {
    return 32.0 + (v - 2.0) * 20.0; // 2.0 -> 32, 3.0 -> 52
  } else if (v <= 4.0) {
    return 52.0 + (v - 3.0) * 24.0; // 3.0 -> 52, 4.0 -> 76
  } else {
    return 76.0 + (v - 4.0) * 16.0; // 4.0 -> 76, 5.0 -> 92
  }
}

/**
 * Calibrates a 1-5 score for a specific trait key into an organic percentage (12% - 96%).
 */
export function calibrateTraitScore(traitKey, rawValue) {
  const normalized = normalizeRawScore(rawValue);
  const baseScore = evaluateBaseCurve(normalized);
  const offset = TRAIT_CALIBRATION_OFFSETS[traitKey] || 0;
  
  const calibrated = baseScore + offset;
  return Math.max(12, Math.min(96, Math.round(calibrated)));
}

/**
 * Calibrates a raw accuracy score (0 - 100) into a realistic psychometric alignment percentage (15% - 98%).
 */
export function calibrateAccuracyScore(rawAccuracy) {
  const raw = typeof rawAccuracy === 'number' ? rawAccuracy : 75.0;
  return Math.max(15, Math.min(98, Math.round(18 + raw * 0.78)));
}

/**
 * Calculates the calibrated perception accuracy / alignment between self answers and friend answers.
 * Returns an organic percentage (e.g. 84%, 79%, 92%), matching single-session evaluations exactly.
 */
export function calculateCalibratedAlignment(selfScoresMap, friendScoresMap) {
  const traits = Object.keys(TRAIT_CALIBRATION_OFFSETS);
  let totalDiff = 0.0;
  let count = 0;

  traits.forEach(trait => {
    const selfRaw = normalizeRawScore(selfScoresMap[trait] !== undefined ? selfScoresMap[trait] : 3.0);
    const friendRaw = normalizeRawScore(friendScoresMap[trait] !== undefined ? friendScoresMap[trait] : 3.0);

    totalDiff += Math.abs(selfRaw - friendRaw);
    count++;
  });

  if (count === 0) return 75;

  const avgDiff = totalDiff / count; // 0.0 to 4.0
  const rawAccuracy = 100.0 * (1.0 - (avgDiff / 4.0));
  return calibrateAccuracyScore(rawAccuracy);
}
