/**
 * Configuration for gun customization stats generation
 * These values control how random parts are generated and their stats are calculated
 */

export const gunCustomizationConfig = {
  // Stat increment probabilities
  statIncrements: {
    oneStatProbability: 0.85, // 85% chance to upgrade 1 stat
    twoStatProbability: 0.1, // 10% chance to upgrade 2 stats
    threeStatProbability: 0.05, // 5% chance to upgrade 3 stats
  },

  // Stat increment amounts
  incrementAmounts: {
    minNormalIncrement: 0.1, // 10% increase
    maxNormalIncrement: 1.0, // 100% increase
    largeIncrementProbability: 0.1, // 10% chance for large increment
    minLargeIncrement: 1.1, // 110% increase
    maxLargeIncrement: 2.0, // 200% increase
  },

  // Stat decrement probabilities
  statDecrements: {
    noDecrementProbability: 0.25, // 25% chance for no decrements
    oneStatProbability: 0.5, // 50% chance to decrement 1 stat
    twoStatProbability: 0.25, // 25% chance to decrement 2 stats
  },

  // Decrement sizing
  decrementSizing: {
    minPercentOfIncrement: 0.1, // Minimum 10% of total increment
    maxPercentOfIncrement: 0.5, // Maximum 50% of total increment
  },

  // Part generation
  partGeneration: {
    minPartsPerCategory: 2, // Minimum parts to generate per category
    maxPartsPerCategory: 4, // Maximum parts to generate per category
  },
};
