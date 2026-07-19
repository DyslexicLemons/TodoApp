/** Streak flame-tier thresholds, shared between backend (CommonJS) and frontend (TS via allowJs). */

const FLAME_TIERS = {
  small: { min: 1, max: 4 },
  big: { min: 5, max: 9 },
  volcano: { min: 10, max: Infinity },
};

function flameTierForStreak(streak) {
  if (streak >= FLAME_TIERS.volcano.min) return "volcano";
  if (streak >= FLAME_TIERS.big.min) return "big";
  if (streak >= FLAME_TIERS.small.min) return "small";
  return "none";
}

module.exports = { FLAME_TIERS, flameTierForStreak };
