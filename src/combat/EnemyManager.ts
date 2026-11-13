import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { EnemyAI } from './EnemyAI';
import { EnemyData, ElementType, Projectile, DamageNumber } from './types';
import { SpellManager } from './SpellManager';
import { dbClient } from '../db/DbClient';

export class EnemyManager {
  private scene: Scene;
  private enemies: EnemyAI[] = [];
  private projectiles: Projectile[] = [];
  private damageNumbers: DamageNumber[] = [];
  private playerPositionProvider: () => Vector3;
  private onPlayerDamaged: (amount: number) => void;

  constructor(
    scene: Scene,
    playerPositionProvider: () => Vector3,
    onPlayerDamaged: (amount: number) => void
  ) {
    this.scene = scene;
    this.playerPositionProvider = playerPositionProvider;
    this.onPlayerDamaged = onPlayerDamaged;

    SpellManager.getInstance().setEnemyManager(this);
    this.spawnInitialEnemies();
  }

  private spawnInitialEnemies() {
    // 1. Syndicate Enforcer Vance (Weak to Shock)
    const enforcerData: EnemyData = {
      id: 1,
      name: 'Syndicate Enforcer Vance',
      archetype: 'Enforcer',
      hp: 100,
      maxHp: 100,
      element: 'Physical',
      weakness: 'Shock',
      state: 'PATROL',
      position: new Vector3(-8.0, 0.1, 14.0),
      rotationY: 0,
      patrolWaypoints: [
        new Vector3(-8.0, 0.1, 14.0),
        new Vector3(-8.0, 0.1, 22.0),
        new Vector3(-3.0, 0.1, 20.0),
      ],
      currentWaypointIndex: 0,
      detectionLevel: 0,
      attackCooldown: 1.0,
      stunTimer: 0,
    };

    // 2. Outlaw Rifleman Jesse (Weak to Fire)
    const riflemanData: EnemyData = {
      id: 2,
      name: 'Outlaw Rifleman Jesse',
      archetype: 'Rifleman',
      hp: 75,
      maxHp: 75,
      element: 'Physical',
      weakness: 'Fire',
      state: 'PATROL',
      position: new Vector3(14.0, 0.1, 8.0),
      rotationY: Math.PI / 2,
      patrolWaypoints: [
        new Vector3(14.0, 0.1, 8.0),
        new Vector3(18.0, 0.1, -4.0),
        new Vector3(12.0, 0.1, -2.0),
      ],
      currentWaypointIndex: 0,
      detectionLevel: 0,
      attackCooldown: 2.0,
      stunTimer: 0,
    };

    // 3. Ironclad Guard Bronn (Weak to Shock)
    const brawlerData: EnemyData = {
      id: 3,
      name: 'Ironclad Guard Bronn',
      archetype: 'Brawler',
      hp: 150,
      maxHp: 150,
      element: 'Physical',
      weakness: 'Shock',
      state: 'PATROL',
      position: new Vector3(4.0, 0.1, 25.0),
      rotationY: Math.PI,
      patrolWaypoints: [
        new Vector3(4.0, 0.1, 25.0),
        new Vector3(-2.0, 0.1, 26.0),
        new Vector3(2.0, 0.1, 18.0),
      ],
      currentWaypointIndex: 0,
      detectionLevel: 0,
      attackCooldown: 1.5,
      stunTimer: 0,
    };

    [enforcerData, riflemanData, brawlerData].forEach((data) => {
      const ai = new EnemyAI(data);
      this.createEnemyMesh(ai);
      this.enemies.push(ai);
    });
  }

  private createEnemyMesh(ai: EnemyAI) {
    const root = new TransformNode(`enemy_root_${ai.data.id}`, this.scene);
    root.position = ai.data.position;

    // Body Capsule
    const body = MeshBuilder.CreateCapsule(
      `enemy_body_${ai.data.id}`,
      { radius: 0.35, height: 1.8 },
      this.scene
    );
    body.parent = root;
    body.position.y = 0.9;

    const mat = new StandardMaterial(`enemy_mat_${ai.data.id}`, this.scene);
    if (ai.data.archetype === 'Enforcer') {
      mat.diffuseColor = new Color3(0.55, 0.15, 0.15); // Dark red outlaw coat
    } else if (ai.data.archetype === 'Rifleman') {
      mat.diffuseColor = new Color3(0.2, 0.35, 0.2); // Outlaw green duster
    } else {
      mat.diffuseColor = new Color3(0.35, 0.35, 0.4); // Ironclad gunmetal
    }
    body.material = mat;

    // Overhead Health & Weakness Billboard
    const plane = MeshBuilder.CreatePlane(`enemy_hp_${ai.data.id}`, { width: 1.2, height: 0.25 }, this.scene);
    plane.parent = root;
    plane.position.y = 2.2;
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    const hpMat = new StandardMaterial(`enemy_hp_mat_${ai.data.id}`, this.scene);
    hpMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
    hpMat.emissiveColor = new Color3(0.4, 0.1, 0.1);
    plane.material = hpMat;

    ai.data.mesh = root;
  }

  public update(deltaTime: number, timeScale: number = 1.0) {
    const playerPos = this.playerPositionProvider();

    // 1. Update Enemies
    for (const ai of this.enemies) {
      if (ai.data.state === 'DEFEATED') continue;

      const action = ai.update(deltaTime, playerPos, timeScale);

      // Update Mesh position and rotation
      if (ai.data.mesh) {
        ai.data.mesh.position.copyFrom(ai.data.position);
        ai.data.mesh.rotation.y = ai.data.rotationY;
      }

      // Handle Enemy Shooting
      if (action.shouldSpawnProjectile && action.projectileDirection) {
        this.spawnProjectile(
          ai.data.position.add(new Vector3(0, 1.2, 0)),
          action.projectileDirection.scale(14.0),
          15,
          'Physical',
          true
        );
      }
    }

    // 2. Update Projectiles
    this.updateProjectiles(deltaTime * timeScale, playerPos);
  }

  private spawnProjectile(
    startPos: Vector3,
    velocity: Vector3,
    damage: number,
    element: ElementType,
    isEnemy: boolean
  ) {
    const mesh = MeshBuilder.CreateSphere(
      `proj_${Date.now()}`,
      { diameter: isEnemy ? 0.2 : 0.25 },
      this.scene
    );
    mesh.position.copyFrom(startPos);

    const mat = new StandardMaterial(`proj_mat_${Date.now()}`, this.scene);
    if (isEnemy) {
      mat.emissiveColor = new Color3(1.0, 0.4, 0.1); // Orange bullet tracer
    } else if (element === 'Shock') {
      mat.emissiveColor = new Color3(0.2, 0.7, 1.0); // Electric blue
    } else if (element === 'Fire') {
      mat.emissiveColor = new Color3(1.0, 0.2, 0.1); // Hellfire crimson
    } else {
      mat.emissiveColor = new Color3(0.9, 0.7, 0.2); // Golden arcane bullet
    }
    mesh.material = mat;

    this.projectiles.push({
      id: `p_${Date.now()}_${Math.random()}`,
      position: startPos,
      velocity,
      damage,
      element,
      isEnemy,
      lifetime: 3.5,
      mesh,
    });
  }

  private updateProjectiles(dt: number, playerPos: Vector3) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;

      p.position.addInPlace(p.velocity.scale(dt));
      if (p.mesh) {
        p.mesh.position.copyFrom(p.position);
      }

      let shouldDespawn = p.lifetime <= 0;

      // Enemy Projectile hitting Player
      if (p.isEnemy) {
        const distToPlayer = Vector3.Distance(p.position, playerPos);
        if (distToPlayer < 1.0) {
          this.onPlayerDamaged(p.damage);
          shouldDespawn = true;
        }
      } else {
        // Player Projectile hitting Enemy
        for (const ai of this.enemies) {
          if (ai.data.state === 'DEFEATED') continue;
          const dist = Vector3.Distance(p.position, ai.data.position.add(new Vector3(0, 1.0, 0)));
          if (dist < 1.2) {
            this.damageEnemy(ai.data.id, p.damage, p.element);
            shouldDespawn = true;
            break;
          }
        }
      }

      if (shouldDespawn) {
        if (p.mesh) p.mesh.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * Fire Arcane Sheriff bullet from player's weapon toward aim direction
   */
  public shootPlayerBullet(startPos: Vector3, direction: Vector3, element: ElementType = 'Arcane') {
    this.spawnProjectile(startPos, direction.scale(26.0), 35, element, false);
  }

  /**
   * Apply direct or spell damage to a specific enemy
   */
  public damageEnemy(
    enemyId: number,
    amount: number,
    element: ElementType
  ): { actualDamage: number; wasWeakness: boolean; isFatal: boolean } | null {
    const ai = this.enemies.find((e) => e.data.id === enemyId);
    if (!ai || ai.data.state === 'DEFEATED') return null;

    const result = ai.takeDamage(amount, element);

    // Sync HP update to SQLite WASM active_enemies table!
    dbClient
      .query(
        `UPDATE active_enemies SET hp = ${ai.data.hp}, status = '${
          result.isFatal ? 'defeated' : 'active'
        }' WHERE enemy_id = ${enemyId};`
      )
      .catch(console.error);

    // Visual defeat reaction
    if (result.isFatal && ai.data.mesh) {
      ai.data.mesh.rotation.x = Math.PI / 2; // Tumble / fall to ground
      ai.data.mesh.position.y = 0.2;
    }

    return result;
  }

  public getClosestActiveEnemy(): EnemyAI | null {
    const playerPos = this.playerPositionProvider();
    let closest: EnemyAI | null = null;
    let minDist = Infinity;

    for (const ai of this.enemies) {
      if (ai.data.state === 'DEFEATED') continue;
      const d = Vector3.Distance(playerPos, ai.data.position);
      if (d < minDist) {
        minDist = d;
        closest = ai;
      }
    }

    return closest;
  }

  public getEnemies(): EnemyAI[] {
    return this.enemies;
  }
}
