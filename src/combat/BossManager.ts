import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3, DynamicTexture } from '@babylonjs/core';
import { HybridAssetRegistry } from '../engine/HybridAssetRegistry';
import { useGameStore } from '../store/useGameStore';
import { dbClient } from '../db/DbClient';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';

export class BossManager {
  private static instance: BossManager | null = null;
  private scene: Scene | null = null;
  private bossMesh: Mesh | null = null;
  private shieldMesh: Mesh | null = null;
  private shieldMaterial: StandardMaterial | null = null;
  private billboardMesh: Mesh | null = null;
  private billboardTexture: DynamicTexture | null = null;

  private bossPosition: Vector3 = new Vector3(36, 0, -34);
  private isSpawned: boolean = false;
  private shieldPulseTimer: number = 0;

  public static getInstance(): BossManager {
    if (!BossManager.instance) {
      BossManager.instance = new BossManager();
    }
    return BossManager.instance;
  }

  public async initializeBoss(scene: Scene): Promise<void> {
    this.scene = scene;
    const assetRegistry = HybridAssetRegistry.getInstance();

    try {
      // 1. Instantiate Mayor Gideon Vale in Boss District
      await assetRegistry.loadGlbContainer(scene, 'mayor_gideon');
      const bossInst = assetRegistry.instantiate('mayor_gideon', 'boss_gideon_vale');
      const root = bossInst.rootNodes[0] as Mesh;
      if (root) {
        root.position = this.bossPosition.clone();
        root.scaling = new Vector3(1.6, 1.6, 1.6);
        root.rotation = new Vector3(0, Math.PI, 0);
        this.bossMesh = root;
      }

      // 2. Create Arcane Aegis Shimmering Hex Shield Mesh
      const shield = MeshBuilder.CreateSphere('bossArcaneShield', { diameter: 4.5, segments: 16 }, scene);
      shield.position = this.bossPosition.add(new Vector3(0, 1.8, 0));
      
      const shieldMat = new StandardMaterial('bossShieldMat', scene);
      shieldMat.diffuseColor = new Color3(0.2, 0.7, 1.0);
      shieldMat.emissiveColor = new Color3(0.3, 0.5, 0.9);
      shieldMat.alpha = 0.55;
      shieldMat.wireframe = true;
      shield.material = shieldMat;
      this.shieldMesh = shield;
      this.shieldMaterial = shieldMat;

      // 3. Create Overhead Boss Health & Shield Billboard
      this.createBossBillboard();

      // 4. Query current active shield from SQLite WASM
      await this.syncCurrentShieldFromDb();

      this.isSpawned = true;
      console.log('[BossManager] Mayor Gideon Vale boss encounter initialized at North Ridge Mine.');
    } catch (err) {
      console.error('[BossManager] Error initializing boss:', err);
    }
  }

  private createBossBillboard() {
    if (!this.scene) return;

    const plane = MeshBuilder.CreatePlane('bossBillboard', { width: 5.5, height: 1.8 }, this.scene);
    plane.position = this.bossPosition.add(new Vector3(0, 4.2, 0));
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    const texture = new DynamicTexture('bossBillboardTex', { width: 512, height: 160 }, this.scene, false);
    const mat = new StandardMaterial('bossBillboardMat', this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.specularColor = new Color3(0, 0, 0);
    mat.backFaceCulling = false;
    mat.useAlphaFromDiffuseTexture = true;
    plane.material = mat;

    this.billboardMesh = plane;
    this.billboardTexture = texture;
    this.updateBillboardUI();
  }

  public updateBillboardUI() {
    if (!this.billboardTexture) return;
    const store = useGameStore.getState();
    const ctx = this.billboardTexture.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 512, 160);

    // Dark parchment plate
    ctx.fillStyle = 'rgba(15, 10, 5, 0.88)';
    ctx.fillRect(10, 10, 492, 140);
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 140);

    // Boss Name & Title
    ctx.font = 'bold 22px Georgia';
    ctx.fillStyle = '#f6d078';
    ctx.textAlign = 'center';
    ctx.fillText('MAYOR GIDEON VALE', 256, 40);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#f3e5ab';
    ctx.fillText(
      store.bossShieldActive
        ? `ARCANE AEGIS [${store.bossShieldLayers} LAYERS] • WEAK: ${store.currentShieldWeakness.toUpperCase()}`
        : 'SHIELD BROKEN • VULNERABLE!',
      256,
      64
    );

    // HP Bar
    const hpPct = Math.max(0, store.bossHp / store.bossMaxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(30, 80, 452, 22);

    ctx.fillStyle = store.bossShieldActive ? '#0284c7' : '#dc2626';
    ctx.fillRect(32, 82, 448 * hpPct, 18);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${store.bossHp} / ${store.bossMaxHp} HP`, 256, 96);

    // Status / Lore Note
    ctx.font = 'italic 12px Georgia';
    ctx.fillStyle = '#a89078';
    ctx.fillText(
      store.bossDefeated
        ? 'DEFEATED — THE MASTER LEDGER RESTORED'
        : 'Query boss_shields to analyze frequency vulnerabilities',
      256,
      130
    );

    this.billboardTexture.update();
  }

  public async syncCurrentShieldFromDb(): Promise<void> {
    try {
      const res = await dbClient.query(
        'SELECT shield_layer, layer_name, vulnerability_element, energy_hp FROM boss_shields ORDER BY rotation_sequence ASC LIMIT 1;'
      );
      if (res && res.rows && res.rows.length > 0) {
        const weakness = String(res.rows[0][2] || 'Shock');
        useGameStore.setState({ currentShieldWeakness: weakness });
      }
    } catch (e) {
      console.warn('[BossManager] Could not sync shield from DB:', e);
    }
  }

  public strikeShield(element: string, damage: number): { hit: boolean; shieldBroke: boolean; message: string } {
    const store = useGameStore.getState();
    if (store.bossDefeated) {
      return { hit: false, shieldBroke: false, message: 'Mayor Gideon Vale has already been defeated.' };
    }

    if (store.bossShieldActive) {
      const isWeakness = element.toLowerCase() === store.currentShieldWeakness.toLowerCase();
      if (isWeakness) {
        const broke = store.damageBossShield(damage, element);
        this.updateBillboardUI();
        this.updateShieldVisuals();
        AudioManager.getInstance().playContradictionShatter();

        const remaining = useGameStore.getState().bossShieldLayers;
        const msg = remaining > 0
          ? `SHIELD OVERLOAD! ${element.toUpperCase()} shattered a shield layer! (${remaining} remaining, next weak to ${useGameStore.getState().currentShieldWeakness})`
          : 'ARCANE AEGIS COMPLETELY SHATTERED! Mayor Gideon Vale is now vulnerable to direct attacks!';
        
        return { hit: true, shieldBroke: true, message: msg };
      } else {
        store.damageBossShield(damage, element);
        this.updateBillboardUI();
        return {
          hit: true,
          shieldBroke: false,
          message: `Shield absorbed ${element} strike! Query boss_shields with JSON functions to find current vulnerability (${store.currentShieldWeakness}).`
        };
      }
    } else {
      // Direct health damage
      store.damageBossHp(damage);
      this.updateBillboardUI();
      if (useGameStore.getState().bossDefeated) {
        store.showQuestNotification(
          'MAYOR GIDEON VALE DEFEATED!',
          'The syndicate mastermind has fallen. Rowan Hale’s master ledger has been recovered!'
        );
        this.onBossDefeated();
      }
      return {
        hit: true,
        shieldBroke: false,
        message: `Direct strike struck Mayor Gideon Vale for ${damage} damage!`
      };
    }
  }

  private updateShieldVisuals() {
    if (!this.shieldMaterial || !this.shieldMesh) return;
    const store = useGameStore.getState();

    if (!store.bossShieldActive) {
      this.shieldMesh.setEnabled(false);
      return;
    }

    this.shieldMesh.setEnabled(true);
    if (store.currentShieldWeakness === 'Shock') {
      this.shieldMaterial.diffuseColor = new Color3(0.2, 0.7, 1.0);
      this.shieldMaterial.emissiveColor = new Color3(0.1, 0.4, 0.8);
    } else if (store.currentShieldWeakness === 'Fire') {
      this.shieldMaterial.diffuseColor = new Color3(1.0, 0.4, 0.1);
      this.shieldMaterial.emissiveColor = new Color3(0.8, 0.2, 0.1);
    } else {
      this.shieldMaterial.diffuseColor = new Color3(0.8, 0.2, 1.0);
      this.shieldMaterial.emissiveColor = new Color3(0.5, 0.1, 0.8);
    }
  }

  private onBossDefeated() {
    if (this.shieldMesh) this.shieldMesh.setEnabled(false);
    AudioManager.getInstance().playQuestTriumph();
    SaveManager.getInstance().autoSaveCheckpoint('Epilogue: Frontier Justice Restored');
    
    useGameStore.getState().setObjective(
      'Epilogue: Frontier Justice Restored',
      'Rowan Hale survived in hiding at the Old Belfry. The master ledger is secured and Query Creek is free.'
    );
    useGameStore.getState().setActiveModal('epilogue');
  }

  public update(deltaTime: number, timeScale: number) {
    if (!this.isSpawned || !this.shieldMesh) return;

    this.shieldPulseTimer += deltaTime * timeScale * 2.0;
    const pulse = 1.0 + Math.sin(this.shieldPulseTimer) * 0.08;
    this.shieldMesh.scaling = new Vector3(pulse, pulse, pulse);
  }

  public getBossPosition(): Vector3 {
    return this.bossPosition.clone();
  }

  public isBossDefeated(): boolean {
    return useGameStore.getState().bossDefeated;
  }
}

