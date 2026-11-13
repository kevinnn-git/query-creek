import { Vector3 } from '@babylonjs/core';
import type { EnemyData, EnemyState, ElementType } from './types';

export class EnemyAI {
  public data: EnemyData;
  private readonly patrolSpeed: number = 2.2;
  private readonly chaseSpeed: number = 4.2;
  private readonly attackRange: number = 10.0;
  private readonly perceptionRange: number = 18.0;

  constructor(initialData: EnemyData) {
    this.data = { ...initialData };
  }

  /**
   * Update enemy state machine for one frame
   */
  public update(deltaTime: number, playerPosition: Vector3, timeScale: number = 1.0): {
    shouldSpawnProjectile?: boolean;
    projectileDirection?: Vector3;
  } {
    if (this.data.state === 'DEFEATED') {
      return {};
    }

    const effectiveDt = deltaTime * timeScale;

    // Handle Stun
    if (this.data.state === 'STUNNED') {
      this.data.stunTimer -= effectiveDt;
      if (this.data.stunTimer <= 0) {
        this.data.state = 'CHASE';
      }
      return {};
    }

    // Update attack cooldown
    if (this.data.attackCooldown > 0) {
      this.data.attackCooldown -= effectiveDt;
    }

    const distToPlayer = Vector3.Distance(this.data.position, playerPosition);

    // Perception & Detection Check
    if (this.data.state === 'PATROL' || this.data.state === 'INVESTIGATE') {
      if (distToPlayer < this.perceptionRange) {
        this.data.detectionLevel = Math.min(100, this.data.detectionLevel + effectiveDt * 60);
        if (this.data.detectionLevel >= 100) {
          this.data.state = 'CHASE';
        }
      } else {
        this.data.detectionLevel = Math.max(0, this.data.detectionLevel - effectiveDt * 20);
      }
    }

    // State Behaviors
    if (this.data.state === 'PATROL') {
      this.updatePatrol(effectiveDt);
      return {};
    }

    if (this.data.state === 'CHASE') {
      if (distToPlayer <= this.attackRange) {
        this.data.state = 'ATTACK';
      } else {
        // Move towards player
        this.moveTowards(playerPosition, this.chaseSpeed, effectiveDt);
      }
      return {};
    }

    if (this.data.state === 'ATTACK') {
      // Rotate to face player
      this.faceTarget(playerPosition);

      if (distToPlayer > this.attackRange * 1.3) {
        this.data.state = 'CHASE';
      } else if (this.data.attackCooldown <= 0) {
        // Attack!
        this.data.attackCooldown = 2.5; // Reset cooldown
        const dir = playerPosition.subtract(this.data.position).normalize();
        return {
          shouldSpawnProjectile: true,
          projectileDirection: dir,
        };
      }
    }

    return {};
  }

  private updatePatrol(dt: number) {
    if (this.data.patrolWaypoints.length === 0) return;

    const targetWaypoint = this.data.patrolWaypoints[this.data.currentWaypointIndex];
    const dist = Vector3.Distance(this.data.position, targetWaypoint);

    if (dist < 1.0) {
      this.data.currentWaypointIndex =
        (this.data.currentWaypointIndex + 1) % this.data.patrolWaypoints.length;
    } else {
      this.moveTowards(targetWaypoint, this.patrolSpeed, dt);
    }
  }

  private moveTowards(target: Vector3, speed: number, dt: number) {
    const dir = target.subtract(this.data.position);
    dir.y = 0;
    const distance = dir.length();
    if (distance > 0.1) {
      dir.normalize();
      this.data.position.addInPlace(dir.scale(speed * dt));
      this.data.rotationY = Math.atan2(dir.x, dir.z);
    }
  }

  private faceTarget(target: Vector3) {
    const dir = target.subtract(this.data.position);
    dir.y = 0;
    if (dir.length() > 0.1) {
      dir.normalize();
      this.data.rotationY = Math.atan2(dir.x, dir.z);
    }
  }

  /**
   * Apply damage and check elemental weakness
   */
  public takeDamage(
    amount: number,
    element: ElementType
  ): {
    actualDamage: number;
    wasWeakness: boolean;
    isFatal: boolean;
  } {
    let actualDamage = amount;
    let wasWeakness = false;

    if (element === this.data.weakness) {
      actualDamage = Math.round(amount * 2.0);
      wasWeakness = true;
      this.data.state = 'STUNNED';
      this.data.stunTimer = 3.0;
    }

    this.data.hp = Math.max(0, this.data.hp - actualDamage);
    const isFatal = this.data.hp <= 0;

    if (isFatal) {
      this.data.state = 'DEFEATED';
    } else if (this.data.state === 'PATROL') {
      this.data.state = 'CHASE';
      this.data.detectionLevel = 100;
    }

    return { actualDamage, wasWeakness, isFatal };
  }
}
