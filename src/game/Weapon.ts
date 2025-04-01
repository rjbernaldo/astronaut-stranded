import { Position, WeaponStats } from "../types";
import { Projectile } from "./Projectile";

export class Weapon {
  stats: WeaponStats;
  private readonly FIXED_SPREAD = 15; // Increased spread for better visibility of multiple projectiles
  private readonly BASE_SPREAD = 4; // Base spread for single projectiles

  constructor(stats: WeaponStats) {
    this.stats = stats;
  }

  createProjectiles(position: Position, rotation: number): Projectile[] {
    const projectiles: Projectile[] = [];
    const baseRadians = (rotation * Math.PI) / 180;

    // For multiple projectiles, create a circular pattern
    if (this.stats.projectileCount > 1) {
      const spreadRadius = (this.FIXED_SPREAD * Math.PI) / 180; // Convert spread to radians
      const angleStep = (2 * Math.PI) / this.stats.projectileCount; // Divide circle into equal parts

      for (let i = 0; i < this.stats.projectileCount; i++) {
        // Calculate base circular position
        const circleAngle = i * angleStep;
        const offsetX = Math.cos(circleAngle) * spreadRadius;
        const offsetY = Math.sin(circleAngle) * spreadRadius;

        // Add random variation to each projectile
        const randomSpread = (this.BASE_SPREAD * Math.PI) / 180;
        const randomAngle = (Math.random() - 0.5) * randomSpread;

        // Combine the circular pattern angle with base rotation and random spread
        const finalAngle = baseRadians + offsetX + randomAngle;

        // Calculate velocity based on final angle
        const velocity = {
          x: Math.cos(finalAngle) * this.stats.projectileSpeed,
          y: Math.sin(finalAngle) * this.stats.projectileSpeed,
        };

        // Create projectile with calculated trajectory
        projectiles.push(
          new Projectile({
            position: { x: position.x, y: position.y },
            velocity,
            damage: this.stats.damage,
            range: this.stats.range || 500,
            speed: this.stats.projectileSpeed || 10,
            pierce: this.stats.pierce || 1,
          })
        );
      }
    } else {
      // For single projectile, just apply random spread
      const spreadInRadians = (this.BASE_SPREAD * Math.PI) / 180;
      const angleOffset = (Math.random() - 0.5) * spreadInRadians;
      const finalAngle = baseRadians + angleOffset;

      // Calculate velocity based on angle
      const velocity = {
        x: Math.cos(finalAngle) * this.stats.projectileSpeed,
        y: Math.sin(finalAngle) * this.stats.projectileSpeed,
      };

      // Create single projectile
      projectiles.push(
        new Projectile({
          position: { x: position.x, y: position.y },
          velocity,
          damage: this.stats.damage,
          range: this.stats.range || 500,
          speed: this.stats.projectileSpeed || 10,
          pierce: this.stats.pierce || 1,
        })
      );
    }

    return projectiles;
  }
}
