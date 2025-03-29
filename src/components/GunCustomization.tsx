import React, { useState, useEffect } from "react";
import { WeaponStats } from "../types";
import { gunCustomizationConfig } from "../config/gunCustomizationConfig";

// Define part categories
type PartCategory =
  | "barrel"
  | "slide"
  | "frame"
  | "trigger"
  | "magazine"
  | "internal";

type StatName =
  | "damage"
  | "fireRate"
  | "magazineSize"
  | "reloadTime"
  | "recoil"
  | "projectileCount"
  | "spread"
  | "range"
  | "accuracy"
  | "reloadSpeed";

interface PartStat {
  name: StatName;
  value: number;
}

// Define gun part interface
interface GunPart {
  id: string;
  name: string;
  category: PartCategory;
  image: string;
  stats: PartStat[];
  description: string;
  unlocked: boolean;
  cost: number;
  price: number;
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

// Function to generate random stat modifications according to config rules
const generateStatsForPart = (category: PartCategory): PartStat[] => {
  const possibleStats: Record<PartCategory, StatName[]> = {
    barrel: ["damage", "range", "recoil", "spread"],
    slide: ["fireRate", "recoil", "spread"],
    frame: ["recoil", "fireRate", "damage"],
    trigger: ["fireRate", "spread", "reloadTime"],
    magazine: ["magazineSize", "reloadTime"],
    internal: ["damage", "spread", "fireRate", "recoil"],
  };

  // Get all available stats for this category
  const availableStats = [...possibleStats[category]];
  const stats: PartStat[] = [];

  // Determine how many stats to increment based on probabilities
  const incrementRoll = Math.random();
  let numStatsToIncrement = 1; // Default to 1

  if (
    incrementRoll < gunCustomizationConfig.statIncrements.threeStatProbability
  ) {
    numStatsToIncrement = 3;
  } else if (
    incrementRoll <
    gunCustomizationConfig.statIncrements.threeStatProbability +
      gunCustomizationConfig.statIncrements.twoStatProbability
  ) {
    numStatsToIncrement = 2;
  }

  // Limit by available stats
  numStatsToIncrement = Math.min(numStatsToIncrement, availableStats.length);

  // Generate the positive stat changes
  let totalIncrementPercentage = 0;
  for (let i = 0; i < numStatsToIncrement; i++) {
    if (availableStats.length === 0) break;

    // Pick a random stat
    const statIndex = Math.floor(Math.random() * availableStats.length);
    const statName = availableStats[statIndex];
    availableStats.splice(statIndex, 1); // Remove so we don't pick it again

    // Determine if this will be a large increment
    const isLargeIncrement =
      Math.random() <
      gunCustomizationConfig.incrementAmounts.largeIncrementProbability;

    // Calculate the increment value
    let incrementValue;
    if (isLargeIncrement) {
      // 110% to 200% increase
      incrementValue =
        Math.random() *
          (gunCustomizationConfig.incrementAmounts.maxLargeIncrement -
            gunCustomizationConfig.incrementAmounts.minLargeIncrement) +
        gunCustomizationConfig.incrementAmounts.minLargeIncrement;
    } else {
      // 10% to 100% increase
      incrementValue =
        Math.random() *
          (gunCustomizationConfig.incrementAmounts.maxNormalIncrement -
            gunCustomizationConfig.incrementAmounts.minNormalIncrement) +
        gunCustomizationConfig.incrementAmounts.minNormalIncrement;
    }

    // Scale the increment based on the stat
    let scaledValue;
    if (statName === "magazineSize") {
      scaledValue = Math.floor(incrementValue * 3); // 0.3-6 extra bullets, rounded down
    } else if (statName === "reloadTime") {
      scaledValue = -Math.floor(incrementValue * 0.5); // Negative because lower is better for reload time
    } else if (statName === "fireRate") {
      scaledValue = Math.floor(incrementValue * 0.2); // 0.02-0.4 fire rate increase
    } else if (statName === "spread") {
      scaledValue = -Math.floor(incrementValue * 5); // Negative because lower spread is better
    } else if (statName === "damage") {
      scaledValue = Math.floor(incrementValue * 5); // 0.5-10 damage increase
    } else if (statName === "recoil") {
      scaledValue = -Math.floor(incrementValue * 5); // Negative because lower recoil is better
    } else if (statName === "range") {
      scaledValue = Math.floor(incrementValue * 10); // 1-20 range increase
    } else {
      scaledValue = Math.floor(incrementValue * 5); // Default scaling
    }

    // Ensure we don't have zero values due to rounding down
    if (scaledValue === 0) {
      // If positive increment, set to at least 1
      if (incrementValue > 0) {
        scaledValue = 1;
      }
      // If negative decrement, set to at least -1
      else if (incrementValue < 0) {
        scaledValue = -1;
      }
    }

    stats.push({ name: statName, value: scaledValue });
    totalIncrementPercentage += incrementValue;
  }

  // Determine if we should decrement stats
  const decrementRoll = Math.random();
  let numStatsToDecrement = 0;

  if (
    decrementRoll < gunCustomizationConfig.statDecrements.twoStatProbability
  ) {
    numStatsToDecrement = 2;
  } else if (
    decrementRoll <
    gunCustomizationConfig.statDecrements.twoStatProbability +
      gunCustomizationConfig.statDecrements.oneStatProbability
  ) {
    numStatsToDecrement = 1;
  }

  // Apply decrements if needed
  if (numStatsToDecrement > 0 && availableStats.length > 0) {
    // Calculate total decrement based on increments
    const decrementPercentage =
      totalIncrementPercentage *
      (Math.random() *
        (gunCustomizationConfig.decrementSizing.maxPercentOfIncrement -
          gunCustomizationConfig.decrementSizing.minPercentOfIncrement) +
        gunCustomizationConfig.decrementSizing.minPercentOfIncrement);

    // Distribute decrement across chosen stats
    const decrementPerStat = decrementPercentage / numStatsToDecrement;

    for (let i = 0; i < numStatsToDecrement; i++) {
      if (availableStats.length === 0) break;

      // Pick a random stat
      const statIndex = Math.floor(Math.random() * availableStats.length);
      const statName = availableStats[statIndex];
      availableStats.splice(statIndex, 1); // Remove so we don't pick it again

      // Scale the decrement based on the stat
      let scaledValue;
      if (statName === "magazineSize") {
        scaledValue = -Math.floor(decrementPerStat * 2); // 0.2-2 fewer bullets
      } else if (statName === "reloadTime") {
        scaledValue = Math.floor(decrementPerStat * 0.3); // Positive because higher is worse for reload time
      } else if (statName === "fireRate") {
        scaledValue = -Math.floor(decrementPerStat * 0.1); // 0.01-0.1 fire rate decrease
      } else if (statName === "spread") {
        scaledValue = Math.floor(decrementPerStat * 3); // Positive because higher spread is worse
      } else if (statName === "damage") {
        scaledValue = -Math.floor(decrementPerStat * 3); // 0.3-3 damage decrease
      } else if (statName === "recoil") {
        scaledValue = Math.floor(decrementPerStat * 3); // Positive because higher recoil is worse
      } else if (statName === "range") {
        scaledValue = -Math.floor(decrementPerStat * 5); // 0.5-5 range decrease
      } else {
        scaledValue = -Math.floor(decrementPerStat * 3); // Default scaling
      }

      // Ensure non-zero values for decrements too
      if (scaledValue === 0) {
        // If supposed to be a negative value, set to -1
        if (
          decrementPerStat > 0 &&
          statName !== "reloadTime" &&
          statName !== "spread" &&
          statName !== "recoil"
        ) {
          scaledValue = -1;
        }
        // If supposed to be positive (for certain stats where higher is worse)
        else if (decrementPerStat > 0) {
          scaledValue = 1;
        }
      }

      stats.push({ name: statName, value: scaledValue });
    }
  }

  return stats;
};

// Function to randomly generate parts
const generateRandomParts = (): GunPart[] => {
  const randomParts: GunPart[] = [];

  // Generate standard parts (always available)
  const categories: PartCategory[] = [
    "barrel",
    "slide",
    "frame",
    "trigger",
    "magazine",
    "internal",
  ];

  categories.forEach((category) => {
    // Add standard part
    randomParts.push({
      id: `standard-${category}`,
      name: `Standard ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      category,
      image: "/gun-parts/internal-standard.png",
      stats: [
        // Standard parts have no stat bonuses
        { name: category === "barrel" ? "damage" : "recoil", value: 0 },
      ],
      description: partDescriptions[category][0],
      unlocked: true, // Keep for compatibility
      cost: 0, // Keep for compatibility
      price: 0, // Keep for compatibility
    });

    // Generate random number of parts per category based on config
    const minParts = gunCustomizationConfig.partGeneration.minPartsPerCategory;
    const maxParts = gunCustomizationConfig.partGeneration.maxPartsPerCategory;
    const numRandomParts =
      Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts;

    for (let i = 0; i < numRandomParts; i++) {
      const prefixIndex = Math.floor(
        Math.random() * partNamePrefixes[category].length
      );
      const suffixIndex = Math.floor(
        Math.random() * partNameSuffixes[category].length
      );

      // Skip if we generate "Standard [Category]" again
      if (partNamePrefixes[category][prefixIndex] === "Standard") {
        continue;
      }

      const prefix = partNamePrefixes[category][prefixIndex];
      const suffix = partNameSuffixes[category][suffixIndex];
      const descIndex = Math.min(
        prefixIndex,
        partDescriptions[category].length - 1
      );

      // Generate stats using the new configuration-based method
      const stats = generateStatsForPart(category);

      // Calculate price based on the value of the stats
      const totalPositiveValue = stats.reduce((sum, stat) => {
        return sum + (stat.value > 0 ? Math.abs(stat.value) : 0);
      }, 0);

      // Price is related to the total positive value with some randomness
      const basePrice = Math.round(totalPositiveValue * 50);
      const price = basePrice + Math.floor(Math.random() * (basePrice / 2));

      randomParts.push({
        id: `${prefix.toLowerCase()}-${category}`,
        name: `${prefix} ${suffix}`,
        category,
        image: "/gun-parts/internal-standard.png",
        stats,
        description: partDescriptions[category][descIndex],
        unlocked: Math.random() > 0.4, // 60% chance to be unlocked
        cost: price, // Cost is the same as price
        price: price, // Set the price
      });
    }
  });

  return randomParts;
};

// Default equipped parts (one of each category)
const defaultEquippedParts = {
  barrel: "standard-barrel",
  magazine: "standard-magazine",
  trigger: "standard-trigger",
  frame: "standard-frame",
  slide: "standard-slide",
  internal: "standard-internal",
};

export interface GunCustomizationProps {
  onSave: (stats: WeaponStats) => void;
  onCancel: () => void;
  initialWeaponStats?: WeaponStats | null;
}

const GunCustomization: React.FC<GunCustomizationProps> = ({
  onSave,
  onCancel,
  initialWeaponStats,
}) => {
  // Remove selectedCategory since we're showing all parts
  const [gunParts, setGunParts] = useState<GunPart[]>([]);
  const [equippedParts, setEquippedParts] =
    useState<Record<PartCategory, string>>(defaultEquippedParts);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [gunStats, setGunStats] = useState({
    damage: 10,
    fireRate: 60,
    magazineSize: 7,
    reloadTime: 2.0,
    recoil: 40,
    range: 50,
    accuracy: 70,
    reloadSpeed: 65,
  });

  // Add preview stats for hovering
  const [previewStats, setPreviewStats] = useState<typeof gunStats | null>(
    null
  );

  // Generate random parts when component mounts
  useEffect(() => {
    setGunParts(generateRandomParts());
  }, []);

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

  // Calculate stats based on equipped parts and optionally a preview part
  const calculateStats = (previewPartId: string | null = null) => {
    // Start with base stats
    const baseStats = {
      damage: 10,
      accuracy: 70,
      range: 50,
      fireRate: 60,
      reloadSpeed: 65,
      recoil: 40,
      magazineSize: 7,
      reloadTime: 2.0,
    };

    // Apply modifiers from all equipped parts
    Object.entries(equippedParts).forEach(([category, partId]) => {
      // Skip this category if we're previewing a part for this category
      if (
        previewPartId &&
        gunParts.find((p) => p.id === previewPartId)?.category === category
      ) {
        return;
      }

      const part = gunParts.find((p) => p.id === partId);
      if (part) {
        part.stats.forEach((statItem) => {
          // Convert the new stat format to the old format for compatibility
          let statKey = statItem.name;
          if (statKey === "spread") statKey = "accuracy"; // Spread is the inverse of accuracy

          if (statKey in baseStats) {
            // For spread/accuracy, the relationship is inverted
            if (statKey === "accuracy") {
              baseStats[statKey as keyof typeof baseStats] -= statItem.value;
            } else {
              baseStats[statKey as keyof typeof baseStats] += statItem.value;
            }
          }
        });
      }
    });

    // Apply the preview part if provided
    if (previewPartId) {
      const previewPart = gunParts.find((p) => p.id === previewPartId);
      if (previewPart) {
        previewPart.stats.forEach((statItem) => {
          // Convert the new stat format to the old format for compatibility
          let statKey = statItem.name;
          if (statKey === "spread") statKey = "accuracy"; // Spread is the inverse of accuracy

          if (statKey in baseStats) {
            // For spread/accuracy, the relationship is inverted
            if (statKey === "accuracy") {
              baseStats[statKey as keyof typeof baseStats] -= statItem.value;
            } else {
              baseStats[statKey as keyof typeof baseStats] += statItem.value;
            }
          }
        });
      }
    }

    // Ensure stats stay within reasonable bounds (0-100)
    Object.keys(baseStats).forEach((key) => {
      const stat = key as keyof typeof baseStats;
      if (stat !== "magazineSize" && stat !== "reloadTime") {
        baseStats[stat] = Math.max(0, Math.min(100, baseStats[stat]));
      }
    });

    return baseStats;
  };

  // Update gun stats when parts change
  useEffect(() => {
    setGunStats(calculateStats());
  }, [equippedParts, gunParts]);

  // Update preview stats when hovering over a part
  useEffect(() => {
    if (hoveredPart) {
      setPreviewStats(calculateStats(hoveredPart));
    } else {
      setPreviewStats(null);
    }
  }, [hoveredPart, equippedParts, gunParts]);

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

  // Handle equipping a part
  const equipPart = (partId: string) => {
    const part = gunParts.find((p) => p.id === partId);
    if (part) {
      setEquippedParts({
        ...equippedParts,
        [part.category]: partId,
      });
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
            width="400"
            height="300"
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

  // Calculate stat changes from a part
  const getStatChanges = (part: GunPart) => {
    const changes: Array<{ name: string; value: number }> = [];

    part.stats.forEach((stat) => {
      // For display only, convert the internal stat name to a human-readable name
      let displayName = stat.name.toString();
      let value = stat.value;

      // Convert spread to accuracy for display
      if (displayName === "spread") {
        displayName = "accuracy";
        value = -value; // Invert spread for accuracy (lower spread = higher accuracy)
      }

      // Convert reloadTime to reloadSpeed for display
      if (displayName === "reloadTime") {
        displayName = "reload speed";
        value = -value; // Invert reload time (lower time = higher speed)
      }

      changes.push({
        name: displayName,
        value: value,
      });
    });

    return changes;
  };

  // Render stat change for a part
  const renderStatChange = (stat: { name: string; value: number }) => {
    const isPositive = stat.value > 0;
    // Round down to integer
    const absValue = Math.floor(Math.abs(stat.value));

    // Calculate the base stat value for percentage calculation
    let baseValue = 10; // Default base value

    // Adjust base value based on stat type
    switch (stat.name) {
      case "damage":
        baseValue = 10;
        break;
      case "accuracy":
        baseValue = 70;
        break;
      case "range":
        baseValue = 50;
        break;
      case "fireRate":
        baseValue = 60;
        break;
      case "reload speed":
        baseValue = 65;
        break;
      case "recoil":
        baseValue = 40;
        break;
      case "magazineSize":
        baseValue = 7;
        break;
    }

    // Calculate percentage
    const percentage = Math.round((absValue / baseValue) * 100);

    // Format display value with percentage
    const displayValue = isPositive
      ? `+${absValue} (${percentage}%)`
      : `-${absValue} (${percentage}%)`;

    return (
      <div
        key={stat.name}
        className={`stat ${isPositive ? "positive" : "negative"}`}
      >
        <span>{stat.name}:</span>
        <span>{displayValue}</span>
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

    const displayValue = previewInteger;
    const barWidth = `${Math.min(
      ((previewValue !== null ? previewValue : currentValue) / maxValue) * 100,
      100
    )}%`;

    // Calculate percentage change if there's a change
    const percentageChange = hasChange
      ? Math.round(((previewInteger - currentInteger) / currentInteger) * 100)
      : 0;

    return (
      <div className="stat-bar">
        <span className="stat-label">{label}</span>
        <div className="bar-container">
          {hasChange && (
            <>
              <div
                className="bar current"
                style={{
                  width: `${Math.min((currentValue / maxValue) * 100, 100)}%`,
                }}
              ></div>
              <div
                className={`bar preview ${
                  isPositive ? "preview-positive" : "preview-negative"
                }`}
                style={{
                  width: barWidth,
                  opacity: 0.9,
                  zIndex: 2,
                }}
              ></div>
            </>
          )}
          {!hasChange && (
            <div className="bar" style={{ width: barWidth }}></div>
          )}
        </div>
        <span
          className={`stat-value ${isPositive ? "positive" : ""} ${
            isNegative ? "negative" : ""
          }`}
        >
          {displayValue}
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

  // Get final weapon stats for saving
  const getFinalWeaponStats = (): WeaponStats => {
    // Calculate final stats based on equipped parts
    let damage = 10; // Base damage
    let fireRate = 0.5; // Base fire rate (in seconds between shots)
    let magazineSize = 7; // Base magazine size
    let reloadTime = 2.0; // Base reload time (in seconds)
    let recoil = 5; // Base recoil
    let projectileCount = 1; // Base projectile count
    let spread = 0; // Base spread
    let range = 300; // Base range

    // Apply part bonuses
    Object.entries(equippedParts).forEach(([category, partId]) => {
      const part = gunParts.find((p) => p.id === partId);
      if (part) {
        part.stats.forEach((stat) => {
          switch (stat.name) {
            case "damage":
              damage += stat.value;
              break;
            case "fireRate":
              fireRate += stat.value;
              break;
            case "magazineSize":
              magazineSize += stat.value;
              break;
            case "reloadTime":
              reloadTime += stat.value;
              break;
            case "recoil":
              recoil += stat.value;
              break;
            case "projectileCount":
              projectileCount += stat.value;
              break;
            case "spread":
              spread += stat.value;
              break;
            case "range":
              range += stat.value;
              break;
          }
        });
      }
    });

    // Ensure no negative values
    damage = Math.max(1, damage);
    fireRate = Math.max(0.1, fireRate);
    magazineSize = Math.max(1, magazineSize);
    reloadTime = Math.max(0.5, reloadTime);
    recoil = Math.max(1, recoil);
    projectileCount = Math.max(1, projectileCount);
    spread = Math.max(0, spread);
    range = Math.max(100, range);

    // Return the final weapon stats
    return {
      name: "custom pistol",
      damage,
      magazineSize,
      reserveAmmo: magazineSize * 3,
      fireRate,
      reloadTime,
      recoil,
      projectileCount,
      spread,
      customized: true,
      range,
      parts: { ...equippedParts },
    };
  };

  return (
    <div className="gun-customization">
      <h1>Gun Customization</h1>

      <div className="top-section">
        {renderGunVisual()}

        <div className="weapon-stats">
          <h3>Weapon Statistics</h3>
          {hoveredPart && (
            <div className="preview-info">
              <span>Previewing changes for: </span>
              <span className="preview-part-name">
                {gunParts.find((p) => p.id === hoveredPart)?.name}
              </span>
            </div>
          )}

          <div className="stat-bars">
            {renderStatBar("Damage", gunStats.damage, previewStats?.damage)}
            {renderStatBar(
              "Accuracy",
              gunStats.accuracy,
              previewStats?.accuracy
            )}
            {renderStatBar("Range", gunStats.range, previewStats?.range)}
            {renderStatBar(
              "Fire Rate",
              gunStats.fireRate,
              previewStats?.fireRate
            )}
            {renderStatBar(
              "Reload Speed",
              gunStats.reloadSpeed,
              previewStats?.reloadSpeed
            )}
            {renderStatBar(
              "Recoil Control",
              gunStats.recoil,
              previewStats?.recoil
            )}
            {renderStatBar(
              "Magazine Size",
              gunStats.magazineSize,
              previewStats?.magazineSize,
              20
            )}
          </div>
        </div>
      </div>

      <div className="upgrades-section">
        <h3>Available Upgrades</h3>
        <div className="upgrade-items">
          {getAllAvailableParts().map((part) => (
            <div
              key={part.id}
              className="part-item"
              onClick={() => equipPart(part.id)}
              onMouseEnter={() => setHoveredPart(part.id)}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <div className="part-name">{part.name}</div>
              <div className="part-category">
                {part.category.charAt(0).toUpperCase() + part.category.slice(1)}{" "}
                Part
              </div>
              <div className="part-description">{part.description}</div>
              <div className="part-stats">
                {getStatChanges(part).map(renderStatChange)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="save-btn"
          onClick={() => onSave(getFinalWeaponStats())}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default GunCustomization;
