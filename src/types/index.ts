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
  pierce?: number;
}

export interface WeaponStats {
  name: string;
  damage: number;
  magazineSize: number;
  reserveAmmo: number;
  fireRate: number;
  reloadTime: number;
  projectileCount: number;
  range: number;
  projectileSpeed: number;
  pierce: number;
  ammoCapacity: number;
  customized?: boolean;
  parts?: Partial<Record<PartCategory, string>>;
}

export type EnemyType = "Scout" | "Brute" | "Spitter";

export interface EnemyStats {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  scoreValue: number;
  type: EnemyType;
  attackDamage: number;
  level: number;
  // Add more properties as needed
}

export interface Notification {
  message: string;
  color: string;
  startTime: number;
  duration: number;
}

// Define a stat history point for tracking stats over time
export interface StatHistoryPoint {
  time: number;
  health: number;
  score: number;
  kills: number;
  level: number;
}

// Define final game stats
export interface FinalGameStats {
  time: number;
  score: number;
  wave: number;
  level: number;
  kills: number;
  history: StatHistoryPoint[];
}

// Update the GameState interface to include all the UI properties we're using
export interface GameState {
  score: number;
  isGameOver: boolean;
  waveNumber: number;
  difficultyLevel: number;
  gameTime: number;
  nextLevelTime: number;
  playerLevel: number;
  playerXp: number;
  xpForNextLevel: number;
  kills: number;
  statsHistory: StatHistoryPoint[];
  finalStats?: FinalGameStats;
}

export interface UIState {
  score: number;
  waveNumber: number;
  difficultyLevel: number;
  gameTime: number;
  nextLevelTime: number;
  isGameOver: boolean;
  playerLevel: number;
  playerXp: number;
  xpForNextLevel: number;
}

export type WeaponType = "pistol" | "rifle" | "shotgun";

export type PartCategory =
  | "barrel"
  | "slide"
  | "frame"
  | "trigger"
  | "magazine"
  | "internal";

// Stats interface for gun customization with strict typing
export interface GunCustomizationStats {
  damage: number;
  range: number;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  pierce: number;
  projectileCount: number;
}
