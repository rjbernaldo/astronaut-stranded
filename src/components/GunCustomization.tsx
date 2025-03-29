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

  // Generate standard parts (always available and free)
  const categories: PartCategory[] = [
    "barrel",
    "slide",
    "frame",
    "trigger",
    "magazine",
    "internal",
  ];

  categories.forEach((category) => {
    // Add standard part (always unlocked and free)
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
      unlocked: true,
      cost: 0,
      price: 0,
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

      const unlocked = Math.random() > 0.4; // 60% chance to be unlocked
      const cost = Math.floor(Math.random() * 80) + 20; // 20-100 cost

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

      // More expensive parts should have better stats overall
      let totalValue = stats.reduce((sum, stat) => {
        // Convert to comparable values
        if (stat.name === "fireRate") return sum + stat.value * -100; // Negative is better
        if (stat.name === "reloadTime") return sum + stat.value * -10; // Negative is better
        return sum + stat.value;
      }, 0);

      // Adjust cost based on stats value
      const adjustedCost = Math.max(20, Math.min(200, cost + totalValue * 5));

      randomParts.push({
        id: `${prefix.toLowerCase()}-${category}`,
        name: `${prefix} ${suffix}`,
        category,
        image: "/gun-parts/internal-standard.png",
        stats,
        description: partDescriptions[category][descIndex],
        unlocked,
        cost: unlocked ? adjustedCost : adjustedCost * 1.5,
        price: unlocked ? adjustedCost : adjustedCost * 1.5,
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
  playerCredits: number;
  onSave: (stats: WeaponStats) => void;
  onCancel: () => void;
  initialWeaponStats?: WeaponStats | null;
}

const GunCustomization: React.FC<GunCustomizationProps> = ({
  playerCredits,
  onSave,
  onCancel,
  initialWeaponStats,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<PartCategory>("barrel");
  const [gunParts, setGunParts] = useState<GunPart[]>([]);
  const [equippedParts, setEquippedParts] =
    useState<Record<PartCategory, string>>(defaultEquippedParts);
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

  // Generate random parts when component mounts
  useEffect(() => {
    setGunParts(generateRandomParts());
  }, []);

  // Get parts for the selected category
  const getPartsForCategory = (category: PartCategory) => {
    return gunParts.filter((part) => part.category === category);
  };

  // Get the currently equipped part for a category
  const getEquippedPart = (category: PartCategory) => {
    const partId = equippedParts[category];
    return gunParts.find((part) => part.id === partId);
  };

  // Update gun stats when parts change
  useEffect(() => {
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
    Object.values(equippedParts).forEach((partId) => {
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

    // Ensure stats stay within reasonable bounds (0-100)
    Object.keys(baseStats).forEach((key) => {
      const stat = key as keyof typeof baseStats;
      if (stat !== "magazineSize" && stat !== "reloadTime") {
        baseStats[stat] = Math.max(0, Math.min(100, baseStats[stat]));
      }
    });

    setGunStats(baseStats);
  }, [equippedParts, gunParts]);

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

  // Replace image paths with appropriate placeholders based on category
  const getImageForPart = (part: GunPart): string => {
    const defaultImages: Record<PartCategory, string> = {
      barrel: "/gun-parts/barrel-standard.png",
      slide: "/gun-parts/slide-standard.png",
      frame: "/gun-parts/frame-standard.png",
      trigger: "/gun-parts/trigger-standard.png",
      magazine: "/gun-parts/magazine-standard.png",
      internal: "/gun-parts/internal-standard.png",
    };

    // For standard parts
    if (part.id.startsWith("standard-")) {
      return defaultImages[part.category];
    }

    // For random parts, use variant image based on prefix
    const prefix = part.name.split(" ")[0].toLowerCase();

    // Return appropriate image based on part type and name
    if (prefix.includes("lightweight") || prefix.includes("compact")) {
      return `/gun-parts/${part.category}-light.png`;
    } else if (prefix.includes("extended") || prefix.includes("heavy")) {
      return `/gun-parts/${part.category}-heavy.png`;
    } else if (prefix.includes("competition") || prefix.includes("match")) {
      return `/gun-parts/${part.category}-match.png`;
    }

    // Default image if no match
    return defaultImages[part.category];
  };

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

  // Check if player can afford a part
  const canAfford = (part: GunPart) => {
    if (part.unlocked) return true;
    return playerCredits >= part.price;
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

  // Handle save button
  const handleSave = () => {
    onSave(getFinalWeaponStats());
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
                selectedCategory === "trigger" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("trigger")}
            >
              <path
                d="M225 190 L232 190 L230 210 L227 210 Z"
                fill={equippedParts.trigger ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="1.5"
              />
              {/* <text
                x="228"
                y="225"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Trigger
              </text> */}
            </g>

            {/* Magazine */}
            <g
              className={`gun-part magazine ${
                selectedCategory === "magazine" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("magazine")}
            >
              <rect
                x="202"
                y="245"
                width="20"
                height="35"
                fill={equippedParts.magazine ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="1.5"
              />
              {/* Magazine floor plate */}
              <rect
                x="200"
                y="280"
                width="24"
                height="5"
                fill={equippedParts.magazine ? "#555" : "#444"}
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
              {/* <text
                x="210"
                y="295"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Magazine
              </text> */}
            </g>

            {/* Internal Components */}
            <g
              className={`gun-part internal ${
                selectedCategory === "internal" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("internal")}
            >
              {/* Simplified firing mechanism */}
              <rect
                x="220"
                y="165"
                width="20"
                height="15"
                fill={equippedParts.internal ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="1"
              />
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
              {/* <text
                x="230"
                y="190"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Internal
              </text> */}
            </g>
            {/* Frame/Grip */}
            <g
              className={`gun-part frame ${
                selectedCategory === "frame" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("frame")}
            >
              {/* Main frame and grip */}
              <path
                d="M 201 165 L 224 165 L 224 251 L 201 251 Z"
                fill={equippedParts.frame ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="2"
              />
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
              {/* Trigger guard */}
              {/* <path
                d="M220 180 L240 180 L245 187 L245 210 L235 220 L215 220 L215 180 Z"
                fill={equippedParts.frame ? "#3a3a3a" : "#2a2a2a"}
                stroke="#777"
                strokeWidth="1"
              /> */}
              {/* <text
                x="212"
                y="255"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Frame
              </text> */}
            </g>

            {/* Barrel */}
            <g
              className={`gun-part barrel ${
                selectedCategory === "barrel" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("barrel")}
            >
              {/* Barrel */}
              <rect
                x="295"
                y="155"
                width="40"
                height="15"
                fill={equippedParts.barrel ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="2"
              />
              {/* Barrel opening */}
              <circle
                cx="325"
                cy="162.5"
                r="5"
                fill="#222"
                stroke="#777"
                strokeWidth="1"
              />
              {/* <text
                x="315"
                y="140"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Barrel
              </text> */}
            </g>

            {/* Slide */}
            <g
              className={`gun-part slide ${
                selectedCategory === "slide" ? "highlighted" : ""
              }`}
              onClick={() => setSelectedCategory("slide")}
            >
              {/* Main slide body */}
              <path
                d="M180 145 L300 145 L310 155 L310 175 L180 175 Z"
                fill={equippedParts.slide ? "#444" : "#333"}
                stroke="#777"
                strokeWidth="2"
              />
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
              {/* <text
                x="220"
                y="130"
                fill="#999"
                fontSize="12"
                textAnchor="middle"
                pointerEvents="none"
              >
                Slide
              </text> */}
            </g>

            {/* Callouts connecting parts to names when hovering */}
            {Object.keys(partPositions).map((selectedCategory) => {
              if (!selectedCategory) return;
              return (
                <g className="part-callout">
                  <line
                    x1={partPositions[selectedCategory].px}
                    y1={partPositions[selectedCategory].py}
                    x2={partPositions[selectedCategory].x}
                    y2={partPositions[selectedCategory].y}
                    stroke="#fff"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={partPositions[selectedCategory].px + 5}
                    y={partPositions[selectedCategory].py + 5}
                    fill="#fff"
                    fontSize="16"
                    textAnchor="start"
                  >
                    {selectedCategory.charAt(0).toUpperCase() +
                      selectedCategory.slice(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // Add this to your component
  const partPositions: Record<
    string,
    { x: number; y: number; px: number; py: number }
  > = {
    barrel: { x: 325, y: 162, px: 325, py: 100 },
    slide: { x: 245, y: 160, px: 245, py: 50 },
    frame: { x: 212, y: 230, px: 262, py: 230 },
    trigger: { x: 228, y: 200, px: 268, py: 200 },
    magazine: { x: 212, y: 265, px: 252, py: 265 },
    internal: { x: 230, y: 172, px: 260, py: 200 },
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

  return (
    <div className="gun-customization">
      <h1>Gun Customization</h1>

      {renderGunVisual()}

      <div className="customization-container">
        <div className="parts-selection">
          <div className="categories-tabs">
            {(
              [
                "barrel",
                "slide",
                "frame",
                "trigger",
                "magazine",
                "internal",
              ] as PartCategory[]
            ).map((category) => (
              <button
                key={category}
                className={`category-tab ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className="parts-grid">
            {getPartsForCategory(selectedCategory).map((part) => {
              const isEquipped = equippedParts[part.category] === part.id;
              const canBuy = canAfford(part);

              return (
                <div
                  key={part.id}
                  className={`part-item ${isEquipped ? "equipped" : ""} ${
                    !part.unlocked && !canAfford(part) ? "locked" : ""
                  }`}
                  onClick={() => canAfford(part) && equipPart(part.id)}
                >
                  <div className="part-name">{part.name}</div>
                  <div className="part-description">{part.description}</div>
                  <div className="part-stats">
                    {getStatChanges(part).map(renderStatChange)}
                  </div>
                  <div className="part-price">
                    {part.price > 0 ? `${part.price} Credits` : "Free"}
                  </div>
                  {!part.unlocked && (
                    <div className="part-status">
                      {canAfford(part)
                        ? "Click to Purchase"
                        : "Insufficient Credits"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-panel">
          <h3>Weapon Statistics</h3>

          <div className="stat-bars">
            <div className="stat-bar">
              <span className="stat-label">Damage</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.damage}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.damage}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Accuracy</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.accuracy}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.accuracy}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Range</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.range}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.range}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Fire Rate</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.fireRate}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.fireRate}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Reload Speed</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.reloadSpeed}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.reloadSpeed}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Recoil Control</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${gunStats.recoil}%` }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.recoil}</span>
            </div>

            <div className="stat-bar">
              <span className="stat-label">Magazine Size</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${Math.min(gunStats.magazineSize * 5, 100)}%`,
                  }}
                ></div>
              </div>
              <span className="stat-value">{gunStats.magazineSize}</span>
            </div>
          </div>

          <div className="credits-display">
            <span>Available Credits: {playerCredits}</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="save-btn" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default GunCustomization;
