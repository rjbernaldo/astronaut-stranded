import { Position, WeaponStats } from "../types";
import { Projectile } from "./Projectile";

export class Weapon {
  stats: WeaponStats;

  constructor(stats: WeaponStats) {
    this.stats = stats;
  }

  createProjectiles(position: Position, rotation: number): Projectile[] {
    const projectiles: Projectile[] = [];
    const radians = (rotation * Math.PI) / 180;

    for (let i = 0; i < this.stats.projectileCount; i++) {
      // Calculate spread angle
      let projectileAngle = radians;
      if (this.stats.projectileCount > 1) {
        // Apply spread for shotguns and multi-projectile weapons
        const spreadInRadians = (this.stats.spread * Math.PI) / 180;
        const angleOffset = (Math.random() - 0.5) * spreadInRadians;
        projectileAngle += angleOffset;
      }

      // Calculate velocity based on angle
      const velocity = {
        x: Math.cos(projectileAngle) * 10,
        y: Math.sin(projectileAngle) * 10,
      };

      // Create projectile
      projectiles.push(
        new Projectile({
          position: { x: position.x, y: position.y },
          velocity,
          damage: this.stats.damage,
          range: 500,
          speed: 10,
        })
      );
    }

    return projectiles;
  }
}
