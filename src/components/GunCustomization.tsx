import React, { useState, useEffect } from "react";
import { WeaponStats } from "../types";
import {
  INITIAL_WEAPON_STATS,
  DEFAULT_EQUIPPED_PARTS,
  MAX_STATS,
  WEAPON_CATEGORIES,
  WeaponCategory,
} from "../constants/weaponStats";

// Constants for weapon stat growth
const GROWTH_FACTOR = 2; // Fixed 2x growth for all stats

// Stat upgrade probabilities
const UPGRADE_PROBABILITIES = {
  threeStatProbability: 0.1, // 10% chance to increase 3 stats
  twoStatProbability: 0.3, // 30% chance to increase 2 stats
  // 60% chance to increase 1 stat (default)
};

// Define part categories
type PartCategory =
  | "barrel"
  | "slide"
  | "frame"
  | "trigger"
  | "magazine"
  | "internal";

// Define proper interface for part stats with required properties
interface PartStat {
  name: StatName;
  value: number;
}

// Define specific stat names as a union type
type StatName =
  | "damage"
  | "range"
  | "fireRate"
  | "magazineSize"
  | "reloadTime"
  | "pierce"
  | "projectileCount";

// Define gun part interface
interface GunPart {
  id: string;
  name: string;
  category: PartCategory;
  image: string;
  stats: PartStat[];
  description: string;
  unlocked: boolean;
}

// Define part name prefixes and suffixes for random generation
const partNamePrefixes: Record<PartCategory, string[]> = {
  barrel: [
    "Standard",
    "Extended",
    "Tactical",
    "Heavy",
    "Lightweight",
    "Precision",
    "Compensated",
    "Ported",
  ],
  slide: [
    "Standard",
    "Match",
    "Competition",
    "Lightweight",
    "Reinforced",
    "Milled",
    "Precision",
    "Custom",
  ],
  frame: [
    "Standard",
    "Polymer",
    "Alloy",
    "Skeletonized",
    "Tungsten",
    "Tactical",
    "Competition",
    "Military",
  ],
  trigger: [
    "Standard",
    "Match",
    "Competition",
    "Adjustable",
    "Tactical",
    "Two-Stage",
    "Custom",
    "Performance",
  ],
  magazine: [
    "Standard",
    "Extended",
    "High-Capacity",
    "Tactical",
    "Compact",
    "Combat",
    "Competition",
    "Quick-Release",
  ],
  internal: [
    "Standard",
    "Match-Grade",
    "Competition",
    "Precision",
    "Enhanced",
    "Tuned",
    "Custom",
    "Performance",
  ],
};

const partNameSuffixes: Record<PartCategory, string[]> = {
  barrel: [
    "Barrel",
    "Shroud",
    "System",
    "Assembly",
    "Mod",
    "Extension",
    "Component",
    "Unit",
  ],
  slide: [
    "Slide",
    "Assembly",
    "System",
    "Unit",
    "Component",
    "Housing",
    "Block",
    "Mechanism",
  ],
  frame: [
    "Frame",
    "Grip",
    "Housing",
    "System",
    "Assembly",
    "Chassis",
    "Platform",
    "Structure",
  ],
  trigger: [
    "Trigger",
    "Assembly",
    "System",
    "Group",
    "Mechanism",
    "Unit",
    "Setup",
    "Control",
  ],
  magazine: [
    "Magazine",
    "Mag",
    "Clip",
    "Feeder",
    "System",
    "Assembly",
    "Unit",
    "Module",
  ],
  internal: [
    "Components",
    "Assembly",
    "System",
    "Mechanism",
    "Internals",
    "Package",
    "Setup",
    "Kit",
  ],
};

// Define some interesting part descriptions
const partDescriptions: Record<PartCategory, string[]> = {
  barrel: [
    "A balanced barrel offering standard performance.",
    "Enhanced barrel with improved accuracy and range.",
    "Tactical barrel designed for rapid follow-up shots.",
    "Heavy barrel that increases damage but adds weight.",
    "Lightweight design for faster handling and target acquisition.",
    "Precision-engineered for exceptional accuracy.",
    "Features ports that reduce muzzle climb during rapid fire.",
    "Militaty-spec barrel with exceptional durability.",
  ],
  slide: [
    "Standard slide with balanced performance.",
    "Competition slide offering improved cycling.",
    "Lightweight design for faster cycling and reduced recoil.",
    "Reinforced slide for enhanced durability.",
    "Precision-machined for consistent performance.",
    "Custom slide with enhanced grip serrations.",
    "Features lightening cuts for reduced mass.",
    "Tactical design with enhanced sights.",
  ],
  frame: [
    "Standard frame with balanced weight and durability.",
    "Lightweight polymer frame for improved handling.",
    "Heavy-duty metal alloy frame for reduced recoil.",
    "Skeletonized frame reduces weight without sacrificing stability.",
    "Enhanced with tungsten inserts for improved balance.",
    "Tactical design with improved ergonomics.",
    "Competition frame with optimized grip angle.",
    "Military-spec frame with enhanced durability.",
  ],
  trigger: [
    "Standard trigger offering balanced performance.",
    "Match-grade trigger with crisp break.",
    "Competition trigger with reduced pull weight.",
    "Fully adjustable trigger for customized feel.",
    "Tactical trigger designed for consistent pull.",
    "Precision two-stage trigger for enhanced control.",
    "Custom-tuned for optimal performance.",
    "Performance trigger with minimal travel.",
  ],
  magazine: [
    "Standard capacity magazine with reliable feeding.",
    "Extended magazine offering increased capacity.",
    "High-capacity design for prolonged engagements.",
    "Tactical magazine with improved feeding reliability.",
    "Compact design without sacrificing capacity.",
    "Combat-ready magazine with enhanced durability.",
    "Competition magazine for rapid reloads.",
    "Features quick-release design for faster reloads.",
  ],
  internal: [
    "Standard internal components with balanced performance.",
    "Match-grade components for enhanced reliability.",
    "Competition internals for improved cycling.",
    "Precision-machined for exceptional accuracy.",
    "Enhanced with polished contact surfaces.",
    "Tuned for optimal performance and reliability.",
    "Custom package with premium components.",
    "Performance kit with matched and balanced parts.",
  ],
};

// Helper function to get a random element from an array
const getRandomElement = <T extends unknown>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Define possible stats for each part category
const possibleStats: Record<PartCategory, StatName[]> = {
  barrel: ["damage", "range", "projectileCount"],
  slide: ["fireRate", "pierce"],
  frame: ["fireRate", "damage", "pierce"],
  trigger: ["fireRate", "reloadTime"],
  magazine: ["magazineSize", "reloadTime"],
  internal: ["damage", "fireRate", "projectileCount"],
};

// Helper function to check if a stat is maxed out
const isStatMaxed = (statName: StatName, currentValue: number): boolean => {
  if (statName === "fireRate") {
    const currentRPS = 1 / currentValue;
    return currentRPS >= 50.0; // 50 RPS is the max
  }
  if (statName === "reloadTime") {
    return currentValue <= 0;
  }
  return false;
};

// Helper function to generate stats for a part
const generateStatsForPart = (
  category: PartCategory,
  currentStats: GunCustomizationStats
): PartStat[] => {
  // Get all available stats for this category that aren't maxed out
  const availableStats = possibleStats[category].filter(
    (statName) => !isStatMaxed(statName, currentStats[statName])
  );

  // If no stats are available (all maxed), return empty array to trigger re-roll
  if (availableStats.length === 0) {
    return [];
  }

  const stats: PartStat[] = [];

  // Determine how many stats to increment based on probabilities
  const incrementRoll = Math.random();
  let numStatsToIncrement = 1; // Default to 1

  if (incrementRoll < UPGRADE_PROBABILITIES.threeStatProbability) {
    numStatsToIncrement = 3;
  } else if (
    incrementRoll <
    UPGRADE_PROBABILITIES.threeStatProbability +
      UPGRADE_PROBABILITIES.twoStatProbability
  ) {
    numStatsToIncrement = 2;
  }

  // Limit by available stats
  numStatsToIncrement = Math.min(numStatsToIncrement, availableStats.length);

  // Generate the positive stat changes
  for (let i = 0; i < numStatsToIncrement; i++) {
    if (availableStats.length === 0) break;

    // Pick a random stat
    const statIndex = Math.floor(Math.random() * availableStats.length);
    const statName = availableStats[statIndex];
    availableStats.splice(statIndex, 1); // Remove so we don't pick it again

    // Calculate stat increase using the fixed growth factor
    let scaledValue;

    if (statName === "magazineSize") {
      // For magazine size, add 100% of current value
      scaledValue = Math.max(1, Math.floor(currentStats.magazineSize));
    } else if (statName === "reloadTime") {
      // For reload time, decrease by 50% (equivalent to 100% improvement)
      const currentValue = currentStats.reloadTime;
      // Reduce reload time by 50% without going below 0
      scaledValue = -Math.min(currentValue * 0.5, currentValue);
    } else if (statName === "fireRate") {
      // For fire rate, decrease time between shots (negative value is good)
      const currentRPS = 1 / currentStats.fireRate;
      const targetRPS = currentRPS * 2; // Double the RPS (100% increase)
      // Cap at 50 RPS
      const cappedRPS = Math.min(50, targetRPS);
      const newFireRateTime = 1 / cappedRPS;
      scaledValue = newFireRateTime - currentStats.fireRate;
    } else if (statName === "damage") {
      // Add 100% of current damage
      scaledValue = Math.max(1, Math.floor(currentStats.damage));
    } else if (statName === "pierce") {
      // Add 100% of current pierce, minimum 1
      scaledValue = Math.max(1, Math.floor(currentStats.pierce));
    } else if (statName === "projectileCount") {
      // Add 100% of current projectile count, minimum 1
      scaledValue = Math.max(1, Math.floor(currentStats.projectileCount));
    } else if (statName === "range") {
      // Add 100% of current range
      scaledValue = Math.max(10, Math.floor(currentStats.range));
    } else {
      // Default growth for other stats - 100% increase
      scaledValue = Math.max(1, Math.floor(currentStats[statName]));
    }

    // Ensure we don't have zero values
    if (scaledValue === 0) {
      // If positive increment, set to at least 1
      if (statName !== "reloadTime" && statName !== "fireRate") {
        scaledValue = 1;
      }
      // If negative decrement for stats where lower is better, set to at least -0.1
      else if (statName === "reloadTime" || statName === "fireRate") {
        scaledValue = -0.1;
      }
    }

    stats.push({ name: statName, value: scaledValue });
  }

  return stats;
};

// Function to randomly generate parts
const generateRandomParts = (
  currentStats?: GunCustomizationStats
): GunPart[] => {
  const parts: GunPart[] = [];
  const statsToUse = currentStats || INITIAL_WEAPON_STATS;

  // Keep track of used categories to ensure variety
  const usedCategories = new Set<PartCategory>();

  // Generate exactly 3 random parts (one at a time, from random categories)
  let attempts = 0;
  const maxAttempts = 30; // Increased max attempts to ensure we get valid parts
  let generatedCount = 0;

  while (generatedCount < 3 && attempts < maxAttempts) {
    attempts++;

    // Get available categories (ones that aren't maxed out)
    const availableCategories = WEAPON_CATEGORIES.filter((category) => {
      // Skip if we've already used this category
      if (usedCategories.has(category)) return false;

      // Check if any stats in this category aren't maxed
      const categoryStats = possibleStats[category];
      return categoryStats.some(
        (statName) => !isStatMaxed(statName, statsToUse[statName])
      );
    });

    // If no categories available, clear used categories and try again
    if (availableCategories.length === 0) {
      usedCategories.clear();
      continue;
    }

    // Pick a random category from available ones
    const category =
      availableCategories[
        Math.floor(Math.random() * availableCategories.length)
      ];
    usedCategories.add(category);

    const prefixIndex = Math.floor(
      Math.random() * partNamePrefixes[category].length
    );
    const suffixIndex = Math.floor(
      Math.random() * partNameSuffixes[category].length
    );

    // Skip if we generate "Standard [Category]"
    if (partNamePrefixes[category][prefixIndex] === "Standard") {
      continue;
    }

    const prefix = partNamePrefixes[category][prefixIndex];
    const suffix = partNameSuffixes[category][suffixIndex];
    const descIndex = Math.min(
      prefixIndex,
      partDescriptions[category].length - 1
    );

    // Try to generate valid stats up to 5 times for this part
    let validStats: PartStat[] = [];
    let statAttempts = 0;
    const maxStatAttempts = 5;

    while (statAttempts < maxStatAttempts) {
      statAttempts++;
      // Generate stats using the configuration-based method
      const stats = generateStatsForPart(category, statsToUse);

      // Skip this part if no valid stats were generated (all maxed)
      if (stats.length === 0) {
        continue;
      }

      // Check if any of the generated stats would max out
      const wouldMaxOut = stats.some((stat) => {
        const statName = stat.name;
        const currentValue = statsToUse[statName];
        const newValue = currentValue + stat.value;

        // For fireRate, check if we'd exceed max RPS
        if (statName === "fireRate") {
          const currentRPS = 1 / currentValue;
          const newRPS = 1 / newValue;
          return newRPS >= 50.0;
        }

        // For reloadTime, check if we'd go below 0
        if (statName === "reloadTime") {
          return newValue <= 0;
        }

        return false;
      });

      // If none of the stats would max out, use these stats
      if (!wouldMaxOut) {
        validStats = stats;
        break;
      }
    }

    // If we couldn't generate valid stats after multiple attempts, just use what we have
    if (validStats.length === 0) {
      continue;
    }

    parts.push({
      id: `${prefix.toLowerCase()}-${category}-${generatedCount}`,
      name: `${prefix} ${suffix}`,
      category,
      image: "/gun-parts/internal-standard.png",
      stats: validStats,
      description: partDescriptions[category][descIndex],
      unlocked: true,
    });

    generatedCount++;
  }

  // If we couldn't generate enough parts, return what we have
  return parts;
};

// Default equipped parts (one of each category)
const defaultEquippedParts = DEFAULT_EQUIPPED_PARTS;

// Define custom stats interface with all properties as required
interface GunCustomizationStats {
  damage: number;
  range: number;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  pierce: number;
  projectileCount: number;
}

interface GunCustomizationProps {
  availableCredits: number;
  initialWeaponStats: WeaponStats;
  onSave: (
    equippedParts: Partial<Record<PartCategory, string>>,
    finalStats: WeaponStats
  ) => void;
  onCancel: () => void;
  isOpen: boolean;
  title?: string;
  message?: string;
  isLevelUpCustomization?: boolean;
}

// Add a type for display names that's separate from StatName
type DisplayStatName = string;

// Helper functions for formatting values
const formatDecimal = (value: number): string => {
  return value.toFixed(1);
};

const formatRPS = (fireRate: number): string => {
  const rps = 1 / fireRate;
  return rps.toFixed(1) + " RPS";
};

const formatSeconds = (value: number): string => {
  return value.toFixed(2) + "s";
};

export const GunCustomization: React.FC<GunCustomizationProps> = ({
  availableCredits = 0,
  initialWeaponStats,
  onSave,
  onCancel,
  isOpen,
  title,
  message,
  isLevelUpCustomization = false,
}) => {
  const [gunParts, setGunParts] = useState<GunPart[]>([]);
  const [equippedParts, setEquippedParts] = useState<
    Record<PartCategory, string>
  >(DEFAULT_EQUIPPED_PARTS);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [gunStats, setGunStats] = useState<GunCustomizationStats>({
    damage: initialWeaponStats.damage,
    range: initialWeaponStats.range,
    fireRate: initialWeaponStats.fireRate,
    magazineSize: initialWeaponStats.magazineSize,
    reloadTime: initialWeaponStats.reloadTime,
    pierce: initialWeaponStats.pierce || 1,
    projectileCount: initialWeaponStats.projectileCount,
  });

  // Preview stats when hovering over a part
  const [previewStats, setPreviewStats] =
    useState<GunCustomizationStats | null>(null);

  // Add state for preview game stats
  const [previewGameStats, setPreviewGameStats] = useState<WeaponStats | null>(
    null
  );

  // Generate random parts when component mounts OR when the modal opens
  useEffect(() => {
    if (isOpen) {
      const initialStats = calculateStats();
      setGunParts(generateRandomParts(initialStats));
    }
  }, [isOpen]);

  // Get parts for a category, excluding the equipped part
  const getPartsForCategory = (category: PartCategory) => {
    return gunParts.filter(
      (part) =>
        part.category === category && part.id !== equippedParts[category]
    );
  };

  // Get the currently equipped part for a category
  const getEquippedPart = (category: PartCategory) => {
    const partId = equippedParts[category];
    return gunParts.find((part) => part.id === partId);
  };

  // Create a new shared function to compute final weapon stats directly
  // Apply parts additively (cumulative effects)
  const computeWeaponStats = (
    baseStats: GunCustomizationStats,
    partsToUse: Partial<Record<PartCategory, string>> = equippedParts
  ): WeaponStats => {
    // Clone the base stats to avoid modifying the original
    const newStats = { ...baseStats };

    // Get all parts we need to apply
    const partsToApply = Object.entries(partsToUse)
      .map(([category, partId]) => {
        return gunParts.find((p) => p.id === partId);
      })
      .filter((part): part is GunPart => part !== undefined);

    // Apply each part's stats additively
    partsToApply.forEach((part) => {
      part.stats.forEach((statItem) => {
        let statKey = statItem.name;
        let statValue = statItem.value;

        if (statKey in newStats) {
          // For reload time, apply direct value change (not percentage)
          if (statKey === "reloadTime") {
            // Simply add the value (negative values reduce reload time)
            newStats[statKey as keyof typeof newStats] = Math.max(
              0,
              newStats[statKey as keyof typeof newStats] + statValue
            );
          }
          // All other stats are always applied additively
          else {
            // For all stats, we add the value (negative values for stats where lower is better)
            newStats[statKey as keyof typeof newStats] += statValue;
          }
        }
      });
    });

    // Apply bounds to stats with new maximums from constants
    newStats.reloadTime = Math.max(
      0,
      Math.min(newStats.reloadTime, MAX_STATS.reloadTime)
    );
    newStats.fireRate = Math.max(
      MAX_STATS.fireRate,
      Math.min(2, newStats.fireRate)
    ); // Minimum 50 RPS (1/50), maximum 0.5 RPS (2s)
    newStats.damage = Math.max(1, newStats.damage);
    newStats.range = Math.max(0, newStats.range);
    newStats.magazineSize = Math.max(1, newStats.magazineSize);
    newStats.pierce = Math.max(1, newStats.pierce);
    newStats.projectileCount = Math.max(1, newStats.projectileCount);

    console.log("Stats after calculation:", newStats);

    // Convert to game weapon stats format
    const gameStats: WeaponStats = {
      name: "pistol",
      damage: newStats.damage,
      range: newStats.range,
      fireRate: newStats.fireRate,
      magazineSize: Math.floor(newStats.magazineSize),
      reloadTime: newStats.reloadTime,
      projectileCount: Math.max(1, Math.floor(newStats.projectileCount)), // 1:1 ratio of count
      projectileSpeed: 10, // Fixed value, no longer upgradeable
      reserveAmmo: Infinity, // Always infinite
      customized: true,
      parts: { ...partsToUse } as Required<Record<PartCategory, string>>,
      pierce: newStats.pierce,
      ammoCapacity: Math.floor(newStats.magazineSize),
    };

    console.log("Game stats:", gameStats);

    return gameStats;
  };

  // Function to calculate the BASE stats including initial weapon stats
  // and any currently equipped parts (for display/comparison purposes)
  const calculateBaseStats = (): GunCustomizationStats => {
    // Start with the initial weapon stats
    const baseStats: GunCustomizationStats = {
      damage: initialWeaponStats.damage,
      range: initialWeaponStats.range,
      fireRate: initialWeaponStats.fireRate,
      magazineSize: initialWeaponStats.magazineSize,
      reloadTime: initialWeaponStats.reloadTime,
      pierce: initialWeaponStats.pierce || 1,
      projectileCount: initialWeaponStats.projectileCount,
    };

    // Apply stats from all equipped parts
    Object.values(equippedParts).forEach((partId) => {
      if (!partId) return; // Skip empty slots

      // Find the part in allParts
      const part = gunParts.find((p) => p.id === partId);
      if (!part) return; // Skip if part not found

      // Apply each stat from the part
      part.stats.forEach((stat) => {
        const statName = stat.name as keyof GunCustomizationStats;
        // Apply stat additively
        baseStats[statName] += stat.value;
      });
    });

    // Enforce bounds on stats
    baseStats.reloadTime = Math.max(0, baseStats.reloadTime);
    baseStats.damage = Math.max(1, baseStats.damage);
    baseStats.range = Math.max(1, baseStats.range);
    baseStats.fireRate = Math.max(0.05, baseStats.fireRate);
    baseStats.magazineSize = Math.max(1, baseStats.magazineSize);
    baseStats.pierce = Math.max(1, baseStats.pierce || 0);
    baseStats.projectileCount = Math.max(1, baseStats.projectileCount);

    console.log("Base stats calculated:", baseStats);

    return baseStats;
  };

  // Get final weapon stats by applying all equipped parts additively
  const getFinalWeaponStats = (
    partsToUse: Record<PartCategory, string> = equippedParts
  ): WeaponStats => {
    // Get base stats
    const baseStats = calculateBaseStats();

    // Apply all equipped parts additively
    let cumulativeGameStats = {
      ...initialWeaponStats,
      parts: { ...partsToUse } as Required<Record<PartCategory, string>>,
      customized: true,
    };

    // Get all parts we need to apply
    const partsToApply = Object.entries(partsToUse)
      .map(([category, partId]) => {
        return gunParts.find((p) => p.id === partId);
      })
      .filter((part): part is GunPart => part !== undefined);

    // Create a stats object that will accumulate all changes
    const cumulativeStats = { ...baseStats };

    // Apply each part's stats additively
    partsToApply.forEach((part) => {
      part.stats.forEach((statItem) => {
        let statKey = statItem.name;
        let statValue = statItem.value;

        if (statKey in cumulativeStats) {
          // For reload time, apply direct value change (not percentage)
          if (statKey === "reloadTime") {
            // Simply add the value (negative values reduce reload time)
            cumulativeStats[statKey as keyof typeof cumulativeStats] +=
              statValue;
          }
          // All other stats are applied additively
          else {
            // For all stats, we add the value (negative for improvements where lower is better)
            cumulativeStats[statKey as keyof typeof cumulativeStats] +=
              statValue;
          }
        }
      });
    });

    // Apply bounds
    cumulativeStats.reloadTime = Math.max(0, cumulativeStats.reloadTime);
    cumulativeStats.damage = Math.max(1, cumulativeStats.damage);
    cumulativeStats.range = Math.max(0, cumulativeStats.range);
    cumulativeStats.fireRate = Math.max(
      0.1,
      Math.min(2, cumulativeStats.fireRate)
    );
    cumulativeStats.magazineSize = Math.max(1, cumulativeStats.magazineSize);
    cumulativeStats.pierce = Math.max(1, cumulativeStats.pierce);
    cumulativeStats.projectileCount = Math.max(
      1,
      cumulativeStats.projectileCount
    );

    // Convert to game stats
    const gameStats: WeaponStats = {
      name: "pistol",
      damage: cumulativeStats.damage,
      range: cumulativeStats.range,
      fireRate: cumulativeStats.fireRate,
      magazineSize: Math.floor(cumulativeStats.magazineSize),
      reloadTime: cumulativeStats.reloadTime,
      projectileCount: Math.max(1, Math.floor(cumulativeStats.projectileCount)), // 1:1 ratio
      projectileSpeed: 10, // Fixed value, no longer upgradeable
      reserveAmmo: Infinity, // Always infinite
      customized: true,
      parts: { ...partsToUse } as Required<Record<PartCategory, string>>,
      ammoCapacity: Math.floor(cumulativeStats.magazineSize),
      pierce: cumulativeStats.pierce,
    };

    console.log("Game stats:", gameStats);

    return gameStats;
  };

  // Calculate stats for preview/display
  const calculateStats = (
    previewPartId?: string | null
  ): GunCustomizationStats => {
    console.log("Calculating stats with preview part:", previewPartId);

    // Start with the initial weapon stats
    const stats: GunCustomizationStats = {
      damage: initialWeaponStats.damage,
      range: initialWeaponStats.range,
      fireRate: initialWeaponStats.fireRate,
      magazineSize: initialWeaponStats.magazineSize,
      reloadTime: initialWeaponStats.reloadTime,
      pierce: initialWeaponStats.pierce || 1,
      projectileCount: initialWeaponStats.projectileCount,
    };

    console.log("Initial stats:", stats);

    // Track the preview part category to avoid double-applying stats
    let previewPartCategory: PartCategory | null = null;
    let previewPart: GunPart | null = null;

    if (previewPartId) {
      previewPart = gunParts.find((p) => p.id === previewPartId) || null;
      if (previewPart) {
        previewPartCategory = previewPart.category;
      }
    }

    // Apply stats from all equipped parts, except if we're previewing a part in the same category
    Object.entries(equippedParts).forEach(([category, partId]) => {
      // Skip if we're previewing a part in this category (to avoid double-counting)
      if (previewPartCategory === category && previewPartId) {
        console.log(
          `Skipping equipped part in ${category} because we're previewing in this category`
        );
        return;
      }

      if (!partId) return; // Skip empty slots

      // Find the part in allParts
      const part = gunParts.find((p) => p.id === partId);
      if (!part) return; // Skip if part not found

      console.log(
        `Applying equipped part ${part.name} (${part.id}) in ${category}`
      );

      // Apply each stat from the part
      part.stats.forEach((stat) => {
        const statName = stat.name as keyof GunCustomizationStats;
        // Apply stat additively
        stats[statName] += stat.value;
        console.log(
          `  Applied ${statName}: ${stat.value}, new value: ${stats[statName]}`
        );
      });
    });

    // Apply the preview part's stats if any
    if (previewPart) {
      console.log(
        `Applying preview part ${previewPart.name} (${previewPart.id})`
      );

      previewPart.stats.forEach((stat) => {
        const statName = stat.name as keyof GunCustomizationStats;
        // Apply stat additively
        stats[statName] += stat.value;
        console.log(
          `  Applied ${statName}: ${stat.value}, new value: ${stats[statName]}`
        );
      });
    }

    // Enforce bounds on stats
    stats.reloadTime = Math.max(0, stats.reloadTime);
    stats.damage = Math.max(1, stats.damage);
    stats.range = Math.max(1, stats.range);
    stats.fireRate = Math.max(0.05, stats.fireRate);
    stats.magazineSize = Math.max(1, stats.magazineSize);
    stats.pierce = Math.max(1, stats.pierce || 0);
    stats.projectileCount = Math.max(1, stats.projectileCount);

    console.log("Final calculated stats:", stats);

    return stats;
  };

  // Update effect to use the shared function for preview
  useEffect(() => {
    if (hoveredPart) {
      const hoveredPartObj = gunParts.find((p) => p.id === hoveredPart);
      if (!hoveredPartObj) {
        setPreviewStats(null);
        return;
      }

      console.log(
        `Calculating preview stats for hovered part: ${hoveredPartObj.name} (${hoveredPartObj.id})`
      );

      // Calculate current stats with all equipped parts
      const currentStats = calculateStats();
      console.log("Current base reload time:", currentStats.reloadTime);

      // Create a temporary equipped parts record that includes the hovered part
      const previewEquippedParts = { ...equippedParts };
      previewEquippedParts[hoveredPartObj.category] = hoveredPartObj.id;

      // Calculate preview stats with the hovered part
      const previewGameStats = getFinalWeaponStats(previewEquippedParts);
      console.log("Preview reload time:", previewGameStats.reloadTime);

      // Convert preview game stats to the correct type for display
      const previewUIStats: GunCustomizationStats = {
        damage: previewGameStats.damage,
        range: previewGameStats.range,
        fireRate: previewGameStats.fireRate,
        magazineSize: previewGameStats.magazineSize,
        reloadTime: previewGameStats.reloadTime,
        pierce: previewGameStats.pierce,
        projectileCount: previewGameStats.projectileCount,
      };

      setPreviewStats(previewUIStats);
    } else {
      setPreviewStats(null);
    }
  }, [hoveredPart, gunParts, equippedParts]);

  // Initialize with custom stats if provided
  useEffect(() => {
    if (initialWeaponStats && initialWeaponStats.parts) {
      // First check if the specific parts exist, otherwise use standard parts
      const parts = gunParts;
      if (parts.length > 0) {
        const newEquippedParts = { ...equippedParts };

        Object.entries(initialWeaponStats.parts).forEach(
          ([category, partId]) => {
            // Check if this part exists
            const partExists = parts.some(
              (p) => p.id === partId && p.category === category
            );
            if (partExists) {
              newEquippedParts[category as PartCategory] = partId;
            } else {
              // Default to standard part if the specific part isn't found
              newEquippedParts[
                category as PartCategory
              ] = `standard-${category}`;
            }
          }
        );

        setEquippedParts(newEquippedParts);
      }
    }
  }, [initialWeaponStats, gunParts]);

  // Update gun stats when parts change
  useEffect(() => {
    setGunStats(calculateStats());
  }, [equippedParts, gunParts]);

  // Update equipPart to use the shared function
  const equipPart = (partId: string) => {
    const part = gunParts.find((p) => p.id === partId);
    if (part) {
      console.log("Equipping part:", part.name, "with stats:", part.stats);

      // Update equipped parts
      const updatedEquippedParts = {
        ...equippedParts,
        [part.category]: partId,
      };

      console.log("Updated equipped parts:", updatedEquippedParts);

      // Calculate final game stats with the updated equipped parts
      const finalGameStats = getFinalWeaponStats(updatedEquippedParts);
      console.log("Final game stats after equipping:", finalGameStats);

      // Save changes (no need to close modal here as parent component does that)
      onSave(updatedEquippedParts, finalGameStats);
    }
  };

  // Find the hovered part object
  const hoveredPartObject = hoveredPart
    ? gunParts.find((p) => p.id === hoveredPart)
    : null;

  // Define different barrel types for visualization
  const renderBarrelByType = (type: string) => {
    // Extended barrel
    if (type.includes("extended")) {
      return (
        <>
          <rect
            x="235"
            y="80"
            width="55"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <circle
            cx="280"
            cy="87.5"
            r="5"
            fill="#222"
            stroke="#777"
            strokeWidth="1"
          />
        </>
      );
    }
    // Tactical barrel
    else if (type.includes("tactical")) {
      return (
        <>
          <rect
            x="235"
            y="80"
            width="45"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <rect
            x="245"
            y="70"
            width="30"
            height="5"
            fill="#555"
            stroke="#777"
            strokeWidth="1"
          />
          <circle
            cx="270"
            cy="87.5"
            r="5"
            fill="#222"
            stroke="#777"
            strokeWidth="1"
          />
        </>
      );
    }
    // Heavy barrel
    else if (type.includes("heavy")) {
      return (
        <>
          <rect
            x="235"
            y="77"
            width="45"
            height="21"
            fill="#555"
            stroke="#777"
            strokeWidth="2"
          />
          <circle
            cx="270"
            cy="87.5"
            r="6"
            fill="#222"
            stroke="#777"
            strokeWidth="1.5"
          />
        </>
      );
    }
    // Lightweight barrel
    else if (type.includes("lightweight")) {
      return (
        <>
          <rect
            x="235"
            y="81"
            width="40"
            height="13"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <circle
            cx="265"
            cy="87.5"
            r="4"
            fill="#222"
            stroke="#777"
            strokeWidth="1"
          />
        </>
      );
    }
    // Precision barrel
    else if (type.includes("precision")) {
      return (
        <>
          <rect
            x="235"
            y="80"
            width="50"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <rect
            x="275"
            y="77"
            width="15"
            height="21"
            fill="#666"
            stroke="#777"
            strokeWidth="1"
          />
          <circle
            cx="282.5"
            cy="87.5"
            r="3"
            fill="#222"
            stroke="#777"
            strokeWidth="1"
          />
        </>
      );
    }
    // Default standard barrel
    return (
      <>
        <rect
          x="235"
          y="80"
          width="40"
          height="15"
          fill="#444"
          stroke="#777"
          strokeWidth="2"
        />
        <circle
          cx="265"
          cy="87.5"
          r="5"
          fill="#222"
          stroke="#777"
          strokeWidth="1"
        />
      </>
    );
  };

  // Define different magazine types for visualization
  const renderMagazineByType = (type: string) => {
    // Extended magazine
    if (type.includes("extended")) {
      return (
        <>
          <rect
            x="142"
            y="170"
            width="20"
            height="50"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="140"
            y="220"
            width="24"
            height="5"
            fill="#555"
            stroke="#777"
            strokeWidth="1"
          />
          {/* Ammo viewing holes */}
          {Array.from({ length: 4 }).map((_, i) => (
            <rect
              key={`ammo-window-${i}`}
              x="144"
              y={175 + i * 10}
              width="16"
              height="3"
              fill="#222"
              stroke="#555"
              strokeWidth="0.5"
            />
          ))}
        </>
      );
    }
    // High-capacity magazine
    else if (type.includes("high")) {
      return (
        <>
          <rect
            x="142"
            y="170"
            width="25"
            height="55"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="140"
            y="225"
            width="29"
            height="5"
            fill="#555"
            stroke="#777"
            strokeWidth="1"
          />
          {/* Ammo viewing holes */}
          {Array.from({ length: 5 }).map((_, i) => (
            <rect
              key={`ammo-window-${i}`}
              x="144"
              y={175 + i * 10}
              width="20"
              height="3"
              fill="#222"
              stroke="#555"
              strokeWidth="0.5"
            />
          ))}
        </>
      );
    }
    // Compact magazine
    else if (type.includes("compact")) {
      return (
        <>
          <rect
            x="142"
            y="175"
            width="20"
            height="30"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="140"
            y="205"
            width="24"
            height="3"
            fill="#555"
            stroke="#777"
            strokeWidth="1"
          />
          {/* Ammo viewing holes */}
          {Array.from({ length: 2 }).map((_, i) => (
            <rect
              key={`ammo-window-${i}`}
              x="144"
              y={180 + i * 10}
              width="16"
              height="3"
              fill="#222"
              stroke="#555"
              strokeWidth="0.5"
            />
          ))}
        </>
      );
    }
    // Default standard magazine
    return (
      <>
        <rect
          x="142"
          y="170"
          width="20"
          height="35"
          fill="#444"
          stroke="#777"
          strokeWidth="1.5"
        />
        <rect
          x="140"
          y="205"
          width="24"
          height="5"
          fill="#555"
          stroke="#777"
          strokeWidth="1"
        />
        {/* Ammo viewing holes */}
        {Array.from({ length: 3 }).map((_, i) => (
          <rect
            key={`ammo-window-${i}`}
            x="144"
            y={175 + i * 10}
            width="16"
            height="3"
            fill="#222"
            stroke="#555"
            strokeWidth="0.5"
          />
        ))}
      </>
    );
  };

  // Define different trigger types for visualization
  const renderTriggerByType = (type: string) => {
    // Match trigger
    if (type.includes("match")) {
      return (
        <path
          d="M165 115 L172 115 L171 130 L166 130 Z"
          fill="#666"
          stroke="#777"
          strokeWidth="1.5"
        />
      );
    }
    // Competition trigger
    else if (type.includes("competition")) {
      return (
        <path
          d="M165 115 L172 115 L172 125 L165 125 Z"
          fill="#555"
          stroke="#777"
          strokeWidth="1.5"
        />
      );
    }
    // Custom trigger
    else if (type.includes("custom")) {
      return (
        <path
          d="M165 115 L174 115 L172 132 L167 132 Z"
          fill="#666"
          stroke="#aaa"
          strokeWidth="1.5"
        />
      );
    }
    // Default standard trigger
    return (
      <path
        d="M165 115 L172 115 L170 135 L167 135 Z"
        fill="#444"
        stroke="#777"
        strokeWidth="1.5"
      />
    );
  };

  // Define different slide types for visualization
  const renderSlideByType = (type: string) => {
    // Match slide
    if (type.includes("match")) {
      return (
        <path
          d="M120 70 L240 70 L255 80 L255 100 L120 100 Z"
          fill="#444"
          stroke="#777"
          strokeWidth="2"
        />
      );
    }
    // Lightweight slide
    else if (type.includes("lightweight")) {
      return (
        <path
          d="M120 70 L240 70 L250 80 L250 100 L120 100 Z"
          fill="#666"
          stroke="#777"
          strokeWidth="1.5"
        />
      );
    }
    // Competition slide
    else if (type.includes("competition")) {
      return (
        <path
          d="M120 70 L240 70 L252 80 L252 100 L120 100 Z"
          fill="#555"
          stroke="#999"
          strokeWidth="2"
        />
      );
    }
    // Reinforced slide
    else if (type.includes("reinforced")) {
      return (
        <path
          d="M120 70 L240 70 L250 80 L250 100 L120 100 Z"
          fill="#333"
          stroke="#666"
          strokeWidth="3"
        />
      );
    }
    // Default standard slide
    return (
      <path
        d="M120 70 L240 70 L250 80 L250 100 L120 100 Z"
        fill="#444"
        stroke="#777"
        strokeWidth="2"
      />
    );
  };

  // Define different frame types for visualization
  const renderFrameByType = (type: string) => {
    // Polymer frame
    if (type.includes("polymer")) {
      return (
        <path
          d="M 141 90 L 164 90 L 164 176 L 141 176 Z"
          fill="#555"
          stroke="#777"
          strokeWidth="1.5"
        />
      );
    }
    // Alloy frame
    else if (type.includes("alloy")) {
      return (
        <path
          d="M 141 90 L 166 90 L 166 176 L 141 176 Z"
          fill="#666"
          stroke="#888"
          strokeWidth="2"
        />
      );
    }
    // Skeletonized frame
    else if (type.includes("skeletonized")) {
      return (
        <path
          d="M 141 90 L 164 90 L 164 176 L 141 176 Z"
          fill="#444"
          stroke="#777"
          strokeWidth="2"
          strokeDasharray="3,1"
        />
      );
    }
    // Default standard frame
    return (
      <path
        d="M 141 90 L 164 90 L 164 176 L 141 176 Z"
        fill="#444"
        stroke="#777"
        strokeWidth="2"
      />
    );
  };

  // Define different internal types for visualization
  const renderInternalByType = (type: string) => {
    // Match-grade internals
    if (type.includes("match")) {
      return (
        <rect
          x="160"
          y="90"
          width="20"
          height="15"
          fill="#555"
          stroke="#888"
          strokeWidth="1"
        />
      );
    }
    // Competition internals
    else if (type.includes("competition")) {
      return (
        <rect
          x="160"
          y="90"
          width="20"
          height="15"
          fill="#666"
          stroke="#999"
          strokeWidth="1"
        />
      );
    }
    // Default standard internals
    return (
      <rect
        x="160"
        y="90"
        width="20"
        height="15"
        fill="#444"
        stroke="#777"
        strokeWidth="1"
      />
    );
  };

  const renderGunVisual = () => {
    return (
      <div className="gun-display">
        <div className="gun-image">
          {/* Base pistol image */}
          <svg
            width="300"
            height="220"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Trigger */}
            <g
              className={`gun-part trigger ${
                hoveredPart?.includes("trigger") ? "highlighted" : ""
              }`}
            >
              {hoveredPartObject && hoveredPartObject.category === "trigger"
                ? renderTriggerByType(hoveredPartObject.name.toLowerCase())
                : renderTriggerByType("standard")}
            </g>

            {/* Magazine */}
            <g
              className={`gun-part magazine ${
                hoveredPart?.includes("magazine") ? "highlighted" : ""
              }`}
            >
              {hoveredPartObject && hoveredPartObject.category === "magazine"
                ? renderMagazineByType(hoveredPartObject.name.toLowerCase())
                : renderMagazineByType("standard")}
            </g>

            {/* Internal Components */}
            <g
              className={`gun-part internal ${
                hoveredPart?.includes("internal") ? "highlighted" : ""
              }`}
            >
              {/* Simplified firing mechanism */}
              {hoveredPartObject && hoveredPartObject.category === "internal"
                ? renderInternalByType(hoveredPartObject.name.toLowerCase())
                : renderInternalByType("standard")}
              {/* Firing pin */}
              <line
                x1="160"
                y1="97"
                x2="180"
                y2="97"
                stroke="#666"
                strokeWidth="2"
              />
              {/* Springs */}
              {Array.from({ length: 2 }).map((_, i) => (
                <line
                  key={`spring-${i}`}
                  x1={165 + i * 8}
                  y1="92"
                  x2={165 + i * 8}
                  y2="103"
                  stroke="#666"
                  strokeWidth="1"
                  strokeDasharray="1,1"
                />
              ))}
            </g>
            {/* Frame/Grip */}
            <g
              className={`gun-part frame ${
                hoveredPart?.includes("frame") ? "highlighted" : ""
              }`}
            >
              {/* Main frame and grip */}
              {hoveredPartObject && hoveredPartObject.category === "frame"
                ? renderFrameByType(hoveredPartObject.name.toLowerCase())
                : renderFrameByType("standard")}
              {/* Grip texture/stippling */}
              <path
                d="M142 110 L162 110 L162 165 L142 165 Z"
                fill={equippedParts.frame ? "#3a3a3a" : "#2a2a2a"}
                stroke="none"
              />
              <g opacity="0.7">
                {/* Stippling dots pattern */}
                {Array.from({ length: 10 }).map((_, row) =>
                  Array.from({ length: 3 }).map((_, col) => (
                    <circle
                      key={`stipple-${row}-${col}`}
                      cx={147 + col * 5}
                      cy={115 + row * 5}
                      r={1}
                      fill="#555"
                    />
                  ))
                )}
              </g>
            </g>

            {/* Barrel */}
            <g
              className={`gun-part barrel ${
                hoveredPart?.includes("barrel") ? "highlighted" : ""
              }`}
            >
              {hoveredPartObject && hoveredPartObject.category === "barrel"
                ? renderBarrelByType(hoveredPartObject.name.toLowerCase())
                : renderBarrelByType("standard")}
            </g>

            {/* Slide */}
            <g
              className={`gun-part slide ${
                hoveredPart?.includes("slide") ? "highlighted" : ""
              }`}
            >
              {/* Main slide body */}
              {hoveredPartObject && hoveredPartObject.category === "slide"
                ? renderSlideByType(hoveredPartObject.name.toLowerCase())
                : renderSlideByType("standard")}
              {/* Slide serrations */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`serration-${i}`}
                  x1={205 + i * 6}
                  y1="70"
                  x2={205 + i * 6}
                  y2="100"
                  stroke="#555"
                  strokeWidth="2"
                />
              ))}
              {/* Ejection port */}
              <rect
                x="185"
                y="75"
                width="30"
                height="15"
                fill="#222"
                stroke="#555"
                strokeWidth="1"
              />
              {/* Front sight */}
              <rect x="230" y="67" width="5" height="3" fill="#666" />
              {/* Rear sight */}
              <rect x="130" y="67" width="10" height="3" fill="#666" />
              <path d="M132 67 L138 67 L138 70 L132 70 Z" fill="#222" />
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // Update getStatChanges function to display consistent values across both displays
  const getStatChanges = (
    part: GunPart
  ): {
    name: DisplayStatName;
    value: number | string;
    percentage: number;
    isImprovement: boolean;
  }[] => {
    const statChanges: {
      name: DisplayStatName;
      value: number | string;
      percentage: number;
      isImprovement: boolean;
    }[] = [];

    part.stats.forEach((stat) => {
      let statKey = stat.name;
      let displayName: DisplayStatName = stat.name;
      let statValue = stat.value;

      // Format user-friendly display names
      if (statKey === "fireRate") {
        displayName = "fire rate";
      } else if (statKey === "magazineSize") {
        displayName = "magazine size";
      } else if (statKey === "reloadTime") {
        displayName = "reload time";
      } else if (statKey === "projectileCount") {
        displayName = "count";
      } else if (statKey === "pierce") {
        displayName = "pierce";
      }

      // Get the current base value for this stat from gunStats
      // gunStats includes the effects of all currently equipped parts
      let baseValue = 0;
      let modifiedValue = 0;
      let displayValue = 0;
      let percentageChange = 0;
      let isImprovement = false;

      // Calculate the effect of applying this stat change
      // Apply the exact same logic as in computeWeaponStats to ensure consistency
      switch (statKey) {
        case "damage":
          baseValue = gunStats.damage;
          modifiedValue = baseValue + statValue;
          displayValue = modifiedValue - baseValue;
          percentageChange = Math.round(
            (Math.abs(displayValue) / baseValue) * 100
          );
          isImprovement = displayValue > 0;
          break;
        case "range":
          baseValue = gunStats.range;
          modifiedValue = baseValue + statValue;
          displayValue = modifiedValue - baseValue;
          percentageChange = Math.round(
            (Math.abs(displayValue) / baseValue) * 100
          );
          isImprovement = displayValue > 0;
          break;
        case "fireRate":
          baseValue = gunStats.fireRate;
          // For fireRate, lower values mean faster firing, but display in RPS (inverse)
          modifiedValue = baseValue + statValue; // Apply direct change

          // Convert to RPS for display
          const baseRPS = 1 / baseValue;
          const modifiedRPS = 1 / modifiedValue;
          displayValue = modifiedRPS - baseRPS; // Change in RPS
          percentageChange = Math.round(
            (Math.abs(displayValue) / baseRPS) * 100
          );
          isImprovement = displayValue > 0; // Higher RPS is better
          // Format to 1 decimal place for display
          displayValue = parseFloat(displayValue.toFixed(1));
          break;
        case "reloadTime":
          baseValue = gunStats.reloadTime;
          // For reload time, direct value change (negative is better)
          modifiedValue = baseValue + statValue;

          // Allow reload time to go down to 0
          const boundedModifiedValue = Math.max(0, modifiedValue);
          const actualChange = boundedModifiedValue - baseValue;

          // If the change would be capped by bounds, adjust the display value accordingly
          displayValue = actualChange !== 0 ? actualChange : statValue;

          percentageChange = Math.round(
            (Math.abs(displayValue) / baseValue) * 100
          );
          isImprovement = displayValue < 0;
          // Format to 2 decimal places for display
          displayValue = parseFloat(displayValue.toFixed(2));
          break;
        case "magazineSize":
          baseValue = gunStats.magazineSize;
          modifiedValue = baseValue + statValue;
          displayValue = modifiedValue - baseValue;
          percentageChange = Math.round(
            (Math.abs(displayValue) / baseValue) * 100
          );
          isImprovement = displayValue > 0;
          break;
        case "pierce":
          baseValue = gunStats.pierce;
          modifiedValue = baseValue + statValue;
          displayValue = modifiedValue - baseValue;
          percentageChange = (displayValue / Math.max(0.01, baseValue)) * 100;
          isImprovement = displayValue > 0;
          break;
        case "projectileCount":
          baseValue = gunStats.projectileCount;
          modifiedValue = baseValue + statValue;
          displayValue = modifiedValue - baseValue;
          percentageChange = Math.round(
            (Math.abs(displayValue) / baseValue) * 100
          );
          isImprovement = displayValue > 0;
          break;
      }

      // Add the stat change to the list with proper formatting
      // For numerical values, handle showing appropriate sign and units
      let displayValueWithUnit: string | number = displayValue;

      // Add appropriate units for each stat
      if (statKey === "fireRate") {
        displayValueWithUnit = `${
          displayValue > 0 ? "+" : ""
        }${displayValue} RPS`;
      } else if (statKey === "reloadTime") {
        displayValueWithUnit = `${displayValue}s`;
      }

      statChanges.push({
        name: displayName,
        value: displayValueWithUnit,
        percentage: percentageChange,
        isImprovement,
      });
    });

    return statChanges;
  };

  // Update renderStatChange function to use the improved values
  const renderStatChange = (statChange: {
    name: DisplayStatName;
    value: number | string;
    percentage: number;
    isImprovement: boolean;
  }) => {
    const valueClass = statChange.isImprovement ? "stat-good" : "stat-bad";
    const valuePrefix =
      statChange.isImprovement && typeof statChange.value === "number"
        ? "+"
        : "";

    // For reload time, we don't need to show a + sign because negative is already shown
    const formattedValue =
      typeof statChange.value === "string"
        ? statChange.value
        : `${valuePrefix}${statChange.value}`;

    return (
      <div key={statChange.name} className="stat">
        <div className="stat-name">{statChange.name}:</div>
        <div className={`stat-value ${valueClass}`}>
          {formattedValue} ({statChange.percentage}%)
        </div>
      </div>
    );
  };

  // Get all available parts across all categories, excluding equipped parts
  const getAllAvailableParts = () => {
    // Filter out equipped parts
    const availableParts = gunParts.filter(
      (part) => part.id !== equippedParts[part.category]
    );

    // Sort first by category for better distribution, then by name
    return availableParts.sort((a, b) => {
      // First sort by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  };

  // Render a stat bar with preview changes
  const renderStatBar = (
    label: string,
    currentValue: number,
    previewValue: number | null = null,
    maxValue: number = 100,
    formatValue: (v: number) => string | number = (v) => Math.floor(v)
  ) => {
    const hasChange =
      previewValue !== null && Math.abs(previewValue - currentValue) > 0.01;
    const isPositive = hasChange && previewValue! > currentValue;
    const isNegative = hasChange && previewValue! < currentValue;

    // Format with integer values
    const currentInteger = Math.floor(currentValue);
    const previewInteger =
      previewValue !== null ? Math.floor(previewValue) : currentInteger;

    // Calculate percentage change if there's a change
    const percentageChange = hasChange
      ? Math.round(((previewInteger - currentInteger) / currentInteger) * 100)
      : 0;

    return (
      <div className="stat-line">
        <span className="stat-label">{label}</span>
        <span
          className={`stat-value ${isPositive ? "positive" : ""} ${
            isNegative ? "negative" : ""
          }`}
        >
          {previewInteger}
          {hasChange && (
            <span className="stat-change">
              {isPositive ? " +" : " "}
              {previewInteger - currentInteger} ({percentageChange}%)
            </span>
          )}
        </span>
      </div>
    );
  };

  // Add a function to regenerate parts
  const regenerateUpgrades = () => {
    // Keep the currently equipped parts
    const equippedPartsList = Object.values(equippedParts);
    const currentEquipped = gunParts.filter((part) =>
      equippedPartsList.includes(part.id)
    );

    // Generate new random parts and combine with equipped parts
    const newRandomParts = generateRandomParts().filter(
      (part) => !part.id.startsWith("standard-") // Filter out standard parts
    );

    // Combine standard parts, equipped parts, and new random parts
    const standardParts = gunParts.filter((part) =>
      part.id.startsWith("standard-")
    );
    setGunParts([...standardParts, ...currentEquipped, ...newRandomParts]);
  };

  // Add effect to handle ESC key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLevelUpCustomization) {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onCancel, isLevelUpCustomization]);

  // Filter parts to only show unequipped parts
  const filteredGunParts = gunParts
    .filter((part) => !Object.values(equippedParts).includes(part.id))
    .slice(0, 3);

  // Render weapon stats with numerical values
  const renderWeaponStats = () => {
    return (
      <div className="stat-display">
        <h2 className="header">Weapon Statistics</h2>

        {/* Order and format matches HUD in GameLoopState.ts */}
        <div className="stat-row">
          <span className="stat-label">DMG:</span>
          <span className="stat-value">
            {previewStats && previewStats.damage !== gunStats.damage ? (
              <>
                <span
                  className={
                    previewStats.damage > gunStats.damage
                      ? "stat-increase"
                      : "stat-decrease"
                  }
                >
                  {Math.floor(previewStats.damage)} (
                  {Math.round(
                    (previewStats.damage / gunStats.damage - 1) * 100
                  )}
                  %)
                </span>
              </>
            ) : (
              Math.floor(gunStats.damage)
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">RATE:</span>
          <span className="stat-value">
            {previewStats && previewStats.fireRate !== gunStats.fireRate
              ? (() => {
                  const baseRPS = 1 / gunStats.fireRate;
                  const previewRPS = 1 / previewStats.fireRate;
                  const percentChange = Math.round(
                    (previewRPS / baseRPS - 1) * 100
                  );
                  return (
                    <>
                      <span
                        className={
                          percentChange >= 0 ? "stat-increase" : "stat-decrease"
                        }
                      >
                        {previewRPS.toFixed(1)} RPS ({percentChange}%)
                      </span>
                    </>
                  );
                })()
              : `${(1 / gunStats.fireRate).toFixed(1)} RPS`}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">RANGE:</span>
          <span className="stat-value">
            {previewStats && previewStats.range !== gunStats.range ? (
              <>
                <span
                  className={
                    previewStats.range > gunStats.range
                      ? "stat-increase"
                      : "stat-decrease"
                  }
                >
                  {Math.floor(previewStats.range)} (
                  {Math.round(
                    ((previewStats.range - gunStats.range) / gunStats.range) *
                      100
                  )}
                  %)
                </span>
              </>
            ) : (
              Math.floor(gunStats.range)
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">PIERCE:</span>
          <span className="stat-value">
            {previewStats && previewStats.pierce !== gunStats.pierce ? (
              <>
                <span
                  className={
                    previewStats.pierce > gunStats.pierce
                      ? "stat-increase"
                      : "stat-decrease"
                  }
                >
                  {Math.floor(previewStats.pierce)} (
                  {Math.round(
                    ((previewStats.pierce - gunStats.pierce) /
                      Math.max(0.01, gunStats.pierce)) *
                      100
                  )}
                  %)
                </span>
              </>
            ) : (
              Math.floor(gunStats.pierce)
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">SIZE:</span>
          <span className="stat-value">
            {previewStats &&
            previewStats.projectileCount !== gunStats.projectileCount ? (
              <>
                <span
                  className={
                    previewStats.projectileCount > gunStats.projectileCount
                      ? "stat-increase"
                      : "stat-decrease"
                  }
                >
                  {Math.floor(previewStats.projectileCount)} (
                  {Math.round(
                    (previewStats.projectileCount / gunStats.projectileCount -
                      1) *
                      100
                  )}
                  %)
                </span>
              </>
            ) : (
              Math.floor(gunStats.projectileCount)
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">MAG:</span>
          <span className="stat-value">
            {previewStats &&
            previewStats.magazineSize !== gunStats.magazineSize ? (
              <>
                <span
                  className={
                    previewStats.magazineSize > gunStats.magazineSize
                      ? "stat-increase"
                      : "stat-decrease"
                  }
                >
                  {Math.floor(previewStats.magazineSize)} (
                  {Math.round(
                    (previewStats.magazineSize / gunStats.magazineSize - 1) *
                      100
                  )}
                  %)
                </span>
              </>
            ) : (
              Math.floor(gunStats.magazineSize)
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">RELOAD:</span>
          <span className="stat-value">
            {previewStats && previewStats.reloadTime !== gunStats.reloadTime
              ? (() => {
                  const percentChange = Math.round(
                    (previewStats.reloadTime / gunStats.reloadTime - 1) * 100
                  );
                  // For reload time, negative percentage is better (faster reload)
                  return (
                    <>
                      <span
                        className={
                          percentChange <= 0 ? "stat-increase" : "stat-decrease"
                        }
                      >
                        {previewStats.reloadTime.toFixed(1)}s ({percentChange}%)
                      </span>
                    </>
                  );
                })()
              : `${gunStats.reloadTime.toFixed(1)}s`}
          </span>
        </div>
      </div>
    );
  };

  // Render a part item
  const renderPartItem = (part: GunPart, index: number) => {
    const statChanges = getStatChanges(part);
    console.log(
      `Rendering part ${part.name} with ${statChanges.length} stat changes`
    );

    return (
      <div
        key={part.id}
        className="part-item"
        onClick={() => equipPart(part.id)}
        onMouseEnter={() => {
          console.log("Mouse entering part:", part.id);
          setHoveredPart(part.id);
        }}
        onMouseLeave={() => {
          console.log("Mouse leaving part:", part.id);
          setHoveredPart(null);
        }}
      >
        <div className="part-name">{part.name}</div>
        <div className="part-category">
          {part.category.charAt(0).toUpperCase() + part.category.slice(1)} Part
        </div>
        <div className="part-description">{part.description}</div>
        <div className="part-stats">
          {statChanges.map((stat, idx) => (
            <div key={`${part.id}-${idx}`} className="stat">
              <div className="stat-name">{stat.name}:</div>
              <div
                className={`stat-value ${
                  stat.isImprovement ? "stat-good" : "stat-bad"
                }`}
              >
                {typeof stat.value === "string"
                  ? stat.value
                  : `${stat.isImprovement && stat.value > 0 ? "+" : ""}${
                      stat.value
                    }`}{" "}
                ({stat.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Preview a part - but don't apply it
  const previewPart = (part: GunPart | null) => {
    if (!part) {
      setPreviewStats(null);
      return;
    }

    // Calculate potential stats with this part
    const potentialStats = { ...gunStats };

    // Apply part stats
    part.stats.forEach((stat) => {
      // Ensure the stat property exists before adding to it
      if (potentialStats[stat.name] === undefined) {
        potentialStats[stat.name] = 0;
      }
      potentialStats[stat.name] += stat.value;
    });

    // Make sure pierce is valid
    potentialStats.pierce = potentialStats.pierce || 1;

    // Calculate preview stats with the potential change
    const calculatedPreviewGameStats = computeWeaponStats(potentialStats, {
      ...equippedParts,
      [part.category]: part.id,
    });

    setPreviewStats(potentialStats);
    setPreviewGameStats(calculatedPreviewGameStats);
  };

  // Only render if modal is open
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={isLevelUpCustomization ? (e) => e.stopPropagation() : onCancel}
    >
      <div
        className={`gun-customization ${
          isLevelUpCustomization ? "level-up-customization" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="screen-header">
          <h2>{title || "Weapon Customization"}</h2>
          {message && <p className="level-up-message">{message}</p>}
        </div>

        <div className="top-section">
          <div className="gun-display">{renderGunVisual()}</div>

          <div className="weapon-stats">
            <h3>Weapon Statistics</h3>
            {renderWeaponStats()}
          </div>
        </div>

        <div className="upgrade-section">
          <h3>Available Upgrades</h3>
          <div className="upgrade-row">
            {filteredGunParts.map((part, index) => renderPartItem(part, index))}
          </div>
        </div>

        {/* Add user instructions */}
        <div className="upgrade-instructions">
          Click on a weapon part to apply the upgrade immediately
        </div>
      </div>
    </div>
  );
};

export default GunCustomization;
