export interface Position {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  type: "floor" | "wall" | "hazard" | "exit";
  explored: boolean;
}

export interface ProjectileOptions {
  position: Position;
  velocity: Position;
  damage: number;
  range: number;
  speed: number;
}

export interface WeaponStats {
  name: string;
  damage: number;
  magazineSize: number;
  reserveAmmo: number;
  fireRate: number; // Seconds between shots
  reloadTime: number; // Seconds to reload
  recoil: number; // Amount of recoil
  projectileCount: number; // Number of projectiles per shot (e.g. shotgun)
  spread: number; // Spread angle in degrees
  // New fields for customization
  customized?: boolean;
  range?: number; // Affects projectile distance
  parts?: {
    barrel: string;
    slide: string;
    frame: string;
    trigger: string;
    magazine: string;
    internal: string;
  };
}

export type EnemyType = "Scout" | "Brute" | "Spitter";

export interface EnemyStats {
  type: EnemyType;
  health: number;
  speed: number;
  attackRange: number;
  attackDamage: number;
  attackSpeed: number; // in seconds
  level: number; // Added level for difficulty scaling
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  waveNumber: number;
  difficultyLevel: number; // Added to track current difficulty level
  gameTime: number; // Track elapsed game time in seconds
  nextLevelTime: number; // Time until the next difficulty level increase
}
