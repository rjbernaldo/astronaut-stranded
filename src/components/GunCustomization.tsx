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
}

// Define sample gun parts data
const gunParts: GunPart[] = [
  // Barrels
  {
    id: "standard-barrel",
    name: "Standard Barrel",
    category: "barrel",
    image: "/gun-parts/barrel-standard.png",
    stats: [
      { name: "damage", value: 0 },
      { name: "range", value: 0 },
    ],
    description: "Standard-issue barrel with balanced performance.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "long-barrel",
    name: "Long Barrel",
    category: "barrel",
    image: "/gun-parts/barrel-long.png",
    stats: [
      { name: "damage", value: 5 },
      { name: "range", value: 20 },
      { name: "recoil", value: 2 },
    ],
    description: "Extended barrel for increased damage and range.",
    unlocked: true,
    cost: 50,
  },
  {
    id: "suppressor",
    name: "Suppressor",
    category: "barrel",
    image: "/gun-parts/barrel-suppressor.png",
    stats: [
      { name: "damage", value: -3 },
      { name: "spread", value: -5 },
    ],
    description: "Reduces sound signature and improves accuracy.",
    unlocked: false,
    cost: 75,
  },
  // Magazines
  {
    id: "standard-magazine",
    name: "Standard Magazine",
    category: "magazine",
    image: "/gun-parts/magazine-standard.png",
    stats: [{ name: "magazineSize", value: 0 }],
    description: "Standard-issue magazine with 7 rounds.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "extended-magazine",
    name: "Extended Magazine",
    category: "magazine",
    image: "/gun-parts/magazine-extended.png",
    stats: [
      { name: "magazineSize", value: 5 },
      { name: "reloadTime", value: 0.2 },
    ],
    description: "Larger magazine capacity but slower to reload.",
    unlocked: true,
    cost: 40,
  },
  {
    id: "quick-release",
    name: "Quick-Release Magazine",
    category: "magazine",
    image: "/gun-parts/magazine-quick.png",
    stats: [
      { name: "magazineSize", value: -2 },
      { name: "reloadTime", value: -0.5 },
    ],
    description: "Faster reload time but reduced capacity.",
    unlocked: false,
    cost: 60,
  },
  // Triggers
  {
    id: "standard-trigger",
    name: "Standard Trigger",
    category: "trigger",
    image: "/gun-parts/trigger-standard.png",
    stats: [{ name: "fireRate", value: 0 }],
    description: "Standard-issue trigger with balanced performance.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "match-trigger",
    name: "Match Trigger",
    category: "trigger",
    image: "/gun-parts/trigger-match.png",
    stats: [
      { name: "fireRate", value: -0.1 },
      { name: "spread", value: 2 },
    ],
    description: "Competition-grade trigger for faster firing.",
    unlocked: false,
    cost: 80,
  },

  // Frame options
  {
    id: "standard-frame",
    name: "Standard Frame",
    category: "frame",
    image: "/gun-parts/frame-standard.png",
    stats: [{ name: "recoil", value: 0 }],
    description: "Standard-issue frame with balanced weight.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "polymer-frame",
    name: "Polymer Frame",
    category: "frame",
    image: "/gun-parts/frame-polymer.png",
    stats: [
      { name: "recoil", value: 2 },
      { name: "fireRate", value: -0.05 },
    ],
    description: "Lightweight frame for faster handling.",
    unlocked: false,
    cost: 70,
  },

  // Slide options
  {
    id: "standard-slide",
    name: "Standard Slide",
    category: "slide",
    image: "/gun-parts/slide-standard.png",
    stats: [
      { name: "recoil", value: 0 },
      { name: "spread", value: 0 },
    ],
    description: "Standard-issue slide with balanced performance.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "lightweight-slide",
    name: "Lightweight Slide",
    category: "slide",
    image: "/gun-parts/slide-lightweight.png",
    stats: [
      { name: "recoil", value: -2 },
      { name: "spread", value: 2 },
    ],
    description: "Reduced weight for faster cycling but less accuracy.",
    unlocked: false,
    cost: 65,
  },

  // Internal options
  {
    id: "standard-internal",
    name: "Standard Components",
    category: "internal",
    image: "/gun-parts/internal-standard.png",
    stats: [
      { name: "damage", value: 0 },
      { name: "spread", value: 0 },
    ],
    description: "Standard-issue internal components.",
    unlocked: true,
    cost: 0,
  },
  {
    id: "match-internal",
    name: "Match-Grade Components",
    category: "internal",
    image: "/gun-parts/internal-match.png",
    stats: [
      { name: "damage", value: 3 },
      { name: "spread", value: -5 },
    ],
    description: "Precision-machined parts for improved performance.",
    unlocked: false,
    cost: 90,
  },
];

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
  const [equippedParts, setEquippedParts] =
    useState<Record<PartCategory, string>>(defaultEquippedParts);
  const [gunStats, setGunStats] = useState({
    damage: 10,
    accuracy: 70,
    range: 50,
    fireRate: 60,
    reloadSpeed: 65,
    recoil: 40,
    magazineSize: 7,
  });

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
    };

    // Apply modifiers from all equipped parts
    Object.values(equippedParts).forEach((partId) => {
      const part = gunParts.find((p) => p.id === partId);
      if (part) {
        part.stats.forEach((statItem) => {
          // Convert the new stat format to the old format for compatibility
          let statKey = statItem.name;
          if (statKey === "spread") statKey = "accuracy"; // Spread is the inverse of accuracy
          if (statKey === "reloadTime") statKey = "reloadSpeed"; // Same stat, different name

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
      if (stat !== "magazineSize") {
        baseStats[stat] = Math.max(0, Math.min(100, baseStats[stat]));
      }
    });

    setGunStats(baseStats);
  }, [equippedParts]);

  // Initialize with custom stats if provided
  useEffect(() => {
    if (initialWeaponStats && initialWeaponStats.parts) {
      setEquippedParts({
        barrel: initialWeaponStats.parts.barrel || "standard-barrel",
        slide: initialWeaponStats.parts.slide || "standard-slide",
        frame: initialWeaponStats.parts.frame || "standard-frame",
        trigger: initialWeaponStats.parts.trigger || "standard-trigger",
        magazine: initialWeaponStats.parts.magazine || "standard-magazine",
        internal: initialWeaponStats.parts.internal || "standard-internal",
      });
    }
  }, [initialWeaponStats]);

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
    return playerCredits >= part.cost;
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
              console.log("partPositions", partPositions);
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
                    !canBuy ? "locked" : ""
                  }`}
                  onClick={() => canBuy && equipPart(part.id)}
                >
                  <div className="part-image">
                    <img src={part.image} alt={part.name} />
                    {isEquipped && (
                      <div className="equipped-badge">Equipped</div>
                    )}
                    {!part.unlocked && (
                      <div className="cost-badge">{part.cost} Credits</div>
                    )}
                  </div>

                  <div className="part-details">
                    <h4>{part.name}</h4>
                    <p>{part.description}</p>

                    <div className="part-stats">
                      {getStatChanges(part).map(renderStatChange)}
                    </div>
                  </div>
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
