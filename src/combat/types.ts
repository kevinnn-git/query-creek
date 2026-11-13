import { Vector3 } from '@babylonjs/core';

export type EnemyState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'STUNNED' | 'DEFEATED';
export type ElementType = 'Physical' | 'Arcane' | 'Shock' | 'Fire' | 'Frost';

export interface EnemyData {
  id: number;
  name: string;
  archetype: 'Enforcer' | 'Rifleman' | 'Brawler';
  hp: number;
  maxHp: number;
  element: ElementType;
  weakness: ElementType;
  state: EnemyState;
  position: Vector3;
  rotationY: number;
  patrolWaypoints: Vector3[];
  currentWaypointIndex: number;
  detectionLevel: number; // 0 to 100
  attackCooldown: number; // seconds remaining
  stunTimer: number; // seconds remaining
  mesh?: any;
}

export interface SpellData {
  powerId: number;
  spellName: string;
  element: ElementType;
  damage: number;
  manaCost: number;
  description: string;
}

export interface Projectile {
  id: string;
  position: Vector3;
  velocity: Vector3;
  damage: number;
  element: ElementType;
  isEnemy: boolean;
  lifetime: number;
  mesh?: any;
}

export interface DamageNumber {
  id: string;
  text: string;
  position: Vector3;
  color: string;
  lifetime: number;
}
