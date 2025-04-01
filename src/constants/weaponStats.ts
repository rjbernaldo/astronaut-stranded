import { GunCustomizationStats } from "../types";

// Initial weapon stats with strict typing
export const INITIAL_WEAPON_STATS: Readonly<GunCustomizationStats> = {
  damage: 20,
  range: 300,
  fireRate: 0.5,
  magazineSize: 7,
  reloadTime: 1.0,
  pierce: 1, // Initial pierce value - penetrates 1 enemy
  projectileCount: 1,
} as const;

// Default equipped parts with strict typing
export const DEFAULT_EQUIPPED_PARTS = {
  barrel: "standard-barrel",
  magazine: "standard-magazine",
  trigger: "standard-trigger",
  frame: "standard-frame",
  slide: "standard-slide",
  internal: "standard-internal",
} as const;

// Maximum values for each stat
export const MAX_STATS = {
  damage: Infinity,
  range: Infinity,
  fireRate: 0.05, // 50 RPS maximum (1/0.02)
  magazineSize: Infinity,
  reloadTime: 0,
  pierce: Infinity, // Can penetrate infinite enemies
  projectileCount: Infinity,
} as const;

// Weapon categories with strict typing
export const WEAPON_CATEGORIES = [
  "barrel",
  "slide",
  "frame",
  "trigger",
  "magazine",
  "internal",
] as const;

export type WeaponCategory = typeof WEAPON_CATEGORIES[number];
