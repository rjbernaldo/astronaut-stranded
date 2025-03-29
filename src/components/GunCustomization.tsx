import React, { useState, useEffect } from "react";
import { WeaponStats } from "../types";

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

    // Generate 2-4 random parts per category
    const numRandomParts = Math.floor(Math.random() * 3) + 2; // 2-4 parts

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

      // Generate 1-3 random stats for this part
      const numStats = Math.floor(Math.random() * 3) + 1;
      const stats: PartStat[] = [];

      // Define possible stats per category
      const possibleStats: Record<PartCategory, StatName[]> = {
        barrel: ["damage", "range", "recoil", "spread"],
        slide: ["fireRate", "recoil", "spread"],
        frame: ["recoil", "fireRate", "damage"],
        trigger: ["fireRate", "spread", "reloadTime"],
        magazine: ["magazineSize", "reloadTime"],
        internal: ["damage", "spread", "fireRate", "recoil"],
      };

      // Choose random stats from possible stats for this category
      const categoryStats = [...possibleStats[category]];
      for (let j = 0; j < numStats && categoryStats.length > 0; j++) {
        const statIndex = Math.floor(Math.random() * categoryStats.length);
        const statName = categoryStats[statIndex];

        // Remove this stat so we don't pick it again
        categoryStats.splice(statIndex, 1);

        // Random value between -5 and 10, weighted more toward positive
        let value = Math.floor(Math.random() * 16) - 5;

        // Adjust value ranges based on stat type
        if (statName === "magazineSize") {
          value = Math.max(1, Math.floor(value / 2)); // -2 to +5
        } else if (statName === "reloadTime") {
          value = Math.max(-0.5, Math.min(0.5, value / 10)); // -0.5 to +0.5 seconds
        } else if (statName === "fireRate") {
          value = Math.max(-0.15, Math.min(0.15, value / 100)); // -0.15 to +0.15 seconds
        } else if (statName === "spread") {
          value = value / 2; // -2.5 to +5
        } else if (statName === "damage") {
          value = value / 2; // -2.5 to +5
        }

        stats.push({ name: statName, value });
      }

      randomParts.push({
        id: `${prefix.toLowerCase()}-${category}`,
        name: `${prefix} ${suffix}`,
        category,
        image: "/gun-parts/internal-standard.png",
        stats,
        description: partDescriptions[category][descIndex],
        unlocked: true, // Always unlocked now
        cost: 0, // Cost is 0
        price: 0, // Price is 0
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
            x="295"
            y="155"
            width="55"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <circle
            cx="340"
            cy="162.5"
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
            x="295"
            y="155"
            width="45"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <rect
            x="305"
            y="145"
            width="30"
            height="5"
            fill="#555"
            stroke="#777"
            strokeWidth="1"
          />
          <circle
            cx="330"
            cy="162.5"
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
            x="295"
            y="152"
            width="45"
            height="21"
            fill="#555"
            stroke="#777"
            strokeWidth="2"
          />
          <circle
            cx="330"
            cy="162.5"
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
            x="295"
            y="156"
            width="40"
            height="13"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <circle
            cx="325"
            cy="162.5"
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
            x="295"
            y="155"
            width="50"
            height="15"
            fill="#444"
            stroke="#777"
            strokeWidth="2"
          />
          <rect
            x="335"
            y="152"
            width="15"
            height="21"
            fill="#666"
            stroke="#777"
            strokeWidth="1"
          />
          <circle
            cx="342.5"
            cy="162.5"
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
          x="295"
          y="155"
          width="40"
          height="15"
          fill="#444"
          stroke="#777"
          strokeWidth="2"
        />
        <circle
          cx="325"
          cy="162.5"
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
            x="202"
            y="245"
            width="20"
            height="50"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="200"
            y="295"
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
              x="204"
              y={250 + i * 10}
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
            x="202"
            y="245"
            width="25"
            height="55"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="200"
            y="300"
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
              x="204"
              y={250 + i * 10}
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
            x="202"
            y="250"
            width="20"
            height="30"
            fill="#444"
            stroke="#777"
            strokeWidth="1.5"
          />
          <rect
            x="200"
            y="280"
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
              x="204"
              y={255 + i * 10}
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
          x="202"
          y="245"
          width="20"
          height="35"
          fill="#444"
          stroke="#777"
          strokeWidth="1.5"
        />
        <rect
          x="200"
          y="280"
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
            x="204"
            y={250 + i * 10}
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
          d="M225 190 L232 190 L231 205 L226 205 Z"
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
          d="M225 190 L232 190 L232 200 L225 200 Z"
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
          d="M225 190 L234 190 L232 207 L227 207 Z"
          fill="#666"
          stroke="#aaa"
          strokeWidth="1.5"
        />
      );
    }
    // Default standard trigger
    return (
      <path
        d="M225 190 L232 190 L230 210 L227 210 Z"
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
          d="M180 145 L300 145 L315 155 L315 175 L180 175 Z"
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
          d="M180 145 L300 145 L310 155 L310 175 L180 175 Z"
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
          d="M180 145 L300 145 L312 155 L312 175 L180 175 Z"
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
          d="M180 145 L300 145 L310 155 L310 175 L180 175 Z"
          fill="#333"
          stroke="#666"
          strokeWidth="3"
        />
      );
    }
    // Default standard slide
    return (
      <path
        d="M180 145 L300 145 L310 155 L310 175 L180 175 Z"
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
          d="M 201 165 L 224 165 L 224 251 L 201 251 Z"
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
          d="M 201 165 L 226 165 L 226 251 L 201 251 Z"
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
          d="M 201 165 L 224 165 L 224 251 L 201 251 Z"
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
        d="M 201 165 L 224 165 L 224 251 L 201 251 Z"
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
          x="220"
          y="165"
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
          x="220"
          y="165"
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
        x="220"
        y="165"
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
                x1="220"
                y1="172"
                x2="240"
                y2="172"
                stroke="#666"
                strokeWidth="2"
              />
              {/* Springs */}
              {Array.from({ length: 2 }).map((_, i) => (
                <line
                  key={`spring-${i}`}
                  x1={225 + i * 8}
                  y1="167"
                  x2={225 + i * 8}
                  y2="178"
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
                d="M202 185 L222 185 L222 240 L202 240 Z"
                fill={equippedParts.frame ? "#3a3a3a" : "#2a2a2a"}
                stroke="none"
              />
              <g opacity="0.7">
                {/* Stippling dots pattern */}
                {Array.from({ length: 10 }).map((_, row) =>
                  Array.from({ length: 3 }).map((_, col) => (
                    <circle
                      key={`stipple-${row}-${col}`}
                      cx={207 + col * 5}
                      cy={190 + row * 5}
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
                  x1={265 + i * 6}
                  y1="145"
                  x2={265 + i * 6}
                  y2="175"
                  stroke="#555"
                  strokeWidth="2"
                />
              ))}
              {/* Ejection port */}
              <rect
                x="245"
                y="150"
                width="30"
                height="15"
                fill="#222"
                stroke="#555"
                strokeWidth="1"
              />
              {/* Front sight */}
              <rect x="290" y="142" width="5" height="3" fill="#666" />
              {/* Rear sight */}
              <rect x="190" y="142" width="10" height="3" fill="#666" />
              <path d="M192 142 L198 142 L198 145 L192 145 Z" fill="#222" />
            </g>

            {/* Display part label when hovering */}
            {hoveredPart && (
              <g className="part-callout">
                <text
                  x="50"
                  y="45"
                  fill="#fff"
                  fontSize="16"
                  textAnchor="start"
                >
                  {hoveredPartObject?.name ||
                    hoveredPart.split("-")[0].charAt(0).toUpperCase() +
                      hoveredPart.split("-")[0].slice(1)}
                </text>
              </g>
            )}
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
    const displayValue = isPositive ? `+${stat.value}` : stat.value;

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
    formatValue: (v: number) => string | number = (v) => v
  ) => {
    const hasChange =
      previewValue !== null && Math.abs(previewValue - currentValue) > 0.01;
    const isPositive = hasChange && previewValue! > currentValue;
    const isNegative = hasChange && previewValue! < currentValue;
    const displayValue =
      previewValue !== null
        ? formatValue(previewValue)
        : formatValue(currentValue);
    const barWidth = `${Math.min(
      ((previewValue !== null ? previewValue : currentValue) / maxValue) * 100,
      100
    )}%`;

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
              {Math.round((previewValue! - currentValue) * 100) / 100}
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

      {renderGunVisual()}

      <div className="customization-container">
        <div className="all-upgrades">
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
                  {part.category.charAt(0).toUpperCase() +
                    part.category.slice(1)}{" "}
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

        <div className="stats-panel">
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
