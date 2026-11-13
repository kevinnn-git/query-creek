import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { Color4 } from '@babylonjs/core/Maths/math.color';

import { HavokSetup } from '../physics/HavokSetup';
import { HybridAssetRegistry } from './HybridAssetRegistry';
import { LightingManager } from './Lighting';
import { CinematicPipelineManager } from './RenderingPipeline';
import { PlayerInput } from '../player/PlayerInput';
import { CameraController } from '../player/CameraController';
import { Player } from '../player/Player';
import { InteractableManager } from '../world/InteractableManager';
import { EnemyManager } from '../combat/EnemyManager';
import { DeadEyeManager } from '../combat/DeadEyeManager';
import { SpellManager } from '../combat/SpellManager';
import { useGameStore } from '../store/useGameStore';

export interface SceneDiagnostics {
  fps: number;
  drawCalls: number;
  activeMeshes: number;
  totalVertices: number;
  engineType: string;
}

export class SceneManager {
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private cameraController: CameraController;
  private lighting: LightingManager;
  private pipeline: CinematicPipelineManager;
  private assetRegistry: HybridAssetRegistry;
  private isRunning: boolean = false;

  // Player & Gameplay
  public playerInput: PlayerInput;
  public player: Player;
  public interactableManager: InteractableManager;
  public enemyManager: EnemyManager;
  public deadEyeManager: DeadEyeManager;

  private lastTime: number = performance.now();

  constructor(engine: Engine) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.08, 0.06, 0.05, 1.0);

    const canvas = this.engine.getRenderingCanvas()!;
    this.playerInput = new PlayerInput(canvas);

    // Universal Camera controlled by CameraController
    this.camera = new UniversalCamera('thirdPersonCamera', new Vector3(0, 3, -6), this.scene);
    this.cameraController = new CameraController(this.camera, this.scene);

    this.lighting = new LightingManager();
    this.pipeline = new CinematicPipelineManager();
    this.assetRegistry = HybridAssetRegistry.getInstance();

    this.player = new Player(this.scene, this.playerInput, this.cameraController);
    this.interactableManager = new InteractableManager(this.scene);
    this.deadEyeManager = DeadEyeManager.getInstance();

    this.enemyManager = new EnemyManager(
      this.scene,
      () => this.player.getPosition(),
      (damage) => {
        if (!this.player.isInvulnerable) {
          useGameStore.getState().damagePlayer(damage);
        }
      }
    );
  }

  public async initializeScene(): Promise<void> {
    console.log('[SceneManager] Initializing Babylon scene, physics, and gameplay...');

    // 1. Initialize Havok Physics
    try {
      await HavokSetup.initPhysics(this.scene);
    } catch (e) {
      console.warn('[SceneManager] Havok physics could not initialize, continuing scene without physics:', e);
    }

    // 2. Setup Cinematic Western Lighting
    this.lighting.setupCinematicLighting(this.scene, true);
    const shadowGen = this.lighting.getShadowGenerator();

    // 3. Load Asset Manifest
    await this.assetRegistry.loadManifest();

    // 4. Build Environment Terrain / Frontier Dirt Ground & Boardwalk
    this.createGround();

    // 5. Populate Frontier District Buildings & Props
    await this.populateInitialFrontierDistrict();

    // 6. Load Animated Character
    await this.player.loadCharacter(shadowGen);

    // 7. Setup Cinematic Post-Processing Pipeline
    this.pipeline.setupPipeline(this.scene, this.camera, 'medium');

    console.log('[SceneManager] Scene & Player initialized successfully.');
  }

  private createGround() {
    // 90x90 meter frontier town dirt ground
    const ground = MeshBuilder.CreateGround('frontierGround', { width: 90, height: 90, subdivisions: 8 }, this.scene);
    ground.receiveShadows = true;

    // PBR Frontier Dirt Material
    try {
      const dirtPbr = this.assetRegistry.createPbrMaterial(this.scene, 'mat_frontier_dirt', {
        diffuseId: 'tex_dirt_diff',
        normalId: 'tex_dirt_nor',
        roughnessId: 'tex_dirt_rough',
        roughness: 0.9,
      });
      ground.material = dirtPbr;
    } catch (e) {
      console.warn('[SceneManager] Could not apply PBR dirt texture to ground:', e);
    }

    try {
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.1, friction: 0.8 }, this.scene);
    } catch (e) {}

    // Main Street wooden boardwalk sidewalks
    const boardwalk = MeshBuilder.CreateBox('boardwalk', { width: 4.5, height: 0.35, depth: 36 }, this.scene);
    boardwalk.position = new Vector3(-8.2, 0.17, 0);
    boardwalk.receiveShadows = true;
    try {
      const woodPbr = this.assetRegistry.createPbrMaterial(this.scene, 'mat_boardwalk_wood', {
        diffuseId: 'tex_wood_diff',
        normalId: 'tex_wood_nor',
        roughnessId: 'tex_wood_rough',
        roughness: 0.75,
      });
      boardwalk.material = woodPbr;
    } catch (e) {}
  }

  private async populateInitialFrontierDistrict() {
    const shadowGen = this.lighting.getShadowGenerator();

    try {
      // 1. Sheriff Office Building & Jail
      await this.assetRegistry.loadGlbContainer(this.scene, 'sheriff_office_building');
      const sheriffOffice = this.assetRegistry.instantiate('sheriff_office_building', 'sheriffOffice');
      const officeRoot = sheriffOffice.rootNodes[0];
      if (officeRoot) {
        officeRoot.position = new Vector3(-14, 0, -4);
        officeRoot.scaling = new Vector3(2.2, 2.2, 2.2);
        officeRoot.rotation = new Vector3(0, Math.PI / 2, 0);
        if (shadowGen) {
          officeRoot.getChildMeshes().forEach((m) => shadowGen.addShadowCaster(m));
        }
      }
      this.lighting.createLanternLight('officeLantern', new Vector3(-10, 3.2, -4), this.scene);

      // 2. Sheriff Office Interior Props (Ledger Desk, Chair, Archive Shelf, Jail Door)
      await this.assetRegistry.loadGlbContainer(this.scene, 'sheriff_desk');
      const desk = this.assetRegistry.instantiate('sheriff_desk', 'sheriffDesk');
      if (desk.rootNodes[0]) {
        desk.rootNodes[0].position = new Vector3(-13.2, 0, -4.2);
        desk.rootNodes[0].scaling = new Vector3(1.4, 1.4, 1.4);
        desk.rootNodes[0].rotation = new Vector3(0, Math.PI, 0);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'saloon_chair');
      const chair = this.assetRegistry.instantiate('saloon_chair', 'deskChair');
      if (chair.rootNodes[0]) {
        chair.rootNodes[0].position = new Vector3(-13.2, 0, -5.2);
        chair.rootNodes[0].scaling = new Vector3(1.3, 1.3, 1.3);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'archive_shelf');
      const shelf = this.assetRegistry.instantiate('archive_shelf', 'archiveShelf');
      if (shelf.rootNodes[0]) {
        shelf.rootNodes[0].position = new Vector3(-15.8, 0, -2.5);
        shelf.rootNodes[0].scaling = new Vector3(1.5, 1.5, 1.5);
        shelf.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'jail_door');
      const jailDoor = this.assetRegistry.instantiate('jail_door', 'jailDoor');
      if (jailDoor.rootNodes[0]) {
        jailDoor.rootNodes[0].position = new Vector3(-11.2, 0, -2.2);
        jailDoor.rootNodes[0].scaling = new Vector3(1.2, 1.2, 1.2);
      }

      // 3. The Gilded Spur Saloon Building
      await this.assetRegistry.loadGlbContainer(this.scene, 'saloon_building');
      const saloon = this.assetRegistry.instantiate('saloon_building', 'saloon');
      const saloonRoot = saloon.rootNodes[0];
      if (saloonRoot) {
        saloonRoot.position = new Vector3(14, 0, 2);
        saloonRoot.scaling = new Vector3(2.4, 2.4, 2.4);
        saloonRoot.rotation = new Vector3(0, -Math.PI / 2, 0);
        if (shadowGen) {
          saloonRoot.getChildMeshes().forEach((m) => shadowGen.addShadowCaster(m));
        }
      }
      this.lighting.createLanternLight('saloonLantern', new Vector3(9, 3.5, 2), this.scene);

      // 4. Ironvault Bank Building
      await this.assetRegistry.loadGlbContainer(this.scene, 'bank_building');
      const bank = this.assetRegistry.instantiate('bank_building', 'bank');
      if (bank.rootNodes[0]) {
        bank.rootNodes[0].position = new Vector3(-14, 0, 14);
        bank.rootNodes[0].scaling = new Vector3(2.2, 2.2, 2.2);
        bank.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
      }

      // 5. Mayor Gideon Vale NPC (standing outside on the boardwalk)
      await this.assetRegistry.loadGlbContainer(this.scene, 'mayor_gideon');
      const mayor = this.assetRegistry.instantiate('mayor_gideon', 'mayor');
      if (mayor.rootNodes[0]) {
        mayor.rootNodes[0].position = new Vector3(-6.0, 0.35, -4.0);
        mayor.rootNodes[0].scaling = new Vector3(1.3, 1.3, 1.3);
        mayor.rootNodes[0].rotation = new Vector3(0, Math.PI / 1.5, 0);
        if (shadowGen) {
          mayor.rootNodes[0].getChildMeshes().forEach((m) => shadowGen.addShadowCaster(m));
        }
      }

      // 6. Wagon Cart & Town Street Props
      await this.assetRegistry.loadGlbContainer(this.scene, 'wooden_cart');
      const cart = this.assetRegistry.instantiate('wooden_cart', 'cart');
      if (cart.rootNodes[0]) {
        cart.rootNodes[0].position = new Vector3(-3.5, 0, 4);
        cart.rootNodes[0].scaling = new Vector3(1.6, 1.6, 1.6);
        cart.rootNodes[0].rotation = new Vector3(0, 0.4, 0);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'wood_barrel');
      const barrel = this.assetRegistry.instantiate('wood_barrel', 'barrel_1');
      if (barrel.rootNodes[0]) {
        barrel.rootNodes[0].position = new Vector3(-8.8, 0.35, -1.8);
        barrel.rootNodes[0].scaling = new Vector3(1.4, 1.4, 1.4);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'wood_crate');
      const crate = this.assetRegistry.instantiate('wood_crate', 'crate_1');
      if (crate.rootNodes[0]) {
        crate.rootNodes[0].position = new Vector3(-8.8, 0.35, -3.0);
        crate.rootNodes[0].scaling = new Vector3(1.5, 1.5, 1.5);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'bench');
      const bench = this.assetRegistry.instantiate('bench', 'bench_1');
      if (bench.rootNodes[0]) {
        bench.rootNodes[0].position = new Vector3(-8.0, 0.35, -8.0);
        bench.rootNodes[0].scaling = new Vector3(1.4, 1.4, 1.4);
        bench.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
      }

      // 7. Pine Trees along the canyon line
      await this.assetRegistry.loadGlbContainer(this.scene, 'pine_tree');
      const tree1 = this.assetRegistry.instantiate('pine_tree', 'pine_1');
      if (tree1.rootNodes[0]) {
        tree1.rootNodes[0].position = new Vector3(-24, 0, 16);
        tree1.rootNodes[0].scaling = new Vector3(2.5, 2.8, 2.5);
      }

      // 8. Canyon Boulders
      await this.assetRegistry.loadGlbContainer(this.scene, 'canyon_rock_01');
      const rock1 = this.assetRegistry.instantiate('canyon_rock_01', 'rock_1');
      if (rock1.rootNodes[0]) {
        rock1.rootNodes[0].position = new Vector3(25, 0, -18);
        rock1.rootNodes[0].scaling = new Vector3(3.0, 3.5, 3.0);
      }

      console.log('[SceneManager] Phase 1 frontier district populated with buildings, props, and NPCs.');
    } catch (err) {
      console.error('[SceneManager] Error populating district:', err);
    }
  }

  public startRenderLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const deltaTime = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;

      const store = useGameStore.getState();

      // Only update player and camera when no modal is open
      const canMove = store.activeModal === 'none';
      this.playerInput.setEnabled(canMove);

      if (canMove) {
        // Handle Dead-Eye Toggle
        if (this.playerInput.deadEye) {
          this.playerInput.deadEye = false;
          this.deadEyeManager.toggle();
        }

        // Update Dead-Eye Time Dilation & Focus
        const deState = this.deadEyeManager.update(deltaTime);
        if (store.isDeadEyeActive !== deState.isActive) {
          store.setDeadEyeActive(deState.isActive);
        }
        store.setDeadEyeFocus(deState.focusMeter);

        const effectiveDt = deltaTime * deState.timeScale;

        // 1. Update Player Movement & Locomotion Animations
        this.player.update(effectiveDt);

        // 2. Consume Mouse Deltas & Update Camera
        const { dx, dy } = this.playerInput.consumeMouseDeltas();
        this.cameraController.update(this.player.getPosition(), dx, dy, effectiveDt);

        // 3. Handle Player Attack (Left-Click)
        if (this.playerInput.attack) {
          this.playerInput.attack = false;
          const aimDir = this.cameraController.getForwardVector();
          const muzzlePos = this.player.getPosition().add(new Vector3(0, 1.2, 0));
          this.enemyManager.shootPlayerBullet(muzzlePos, aimDir);
        }

        // 4. Handle Dead-Eye Quick-Cast Spells [1-4]
        if (deState.isActive && this.playerInput.quickSlot !== null) {
          const slot = this.playerInput.quickSlot;
          this.playerInput.quickSlot = null;
          SpellManager.getInstance().castQuickSlot(slot);
        }

        // 5. Update Enemy AI, Patrols, and Combat Simulation
        this.enemyManager.update(deltaTime, deState.timeScale);

        // 6. Update Nearby Interactables
        const nearby = this.interactableManager.update(this.player.getPosition(), effectiveDt);
        if (nearby) {
          store.setActivePrompt(nearby.prompt);

          // Handle 'E' key interact trigger
          if (this.playerInput.interact) {
            this.playerInput.interact = false;
            this.handleInteraction(nearby);
          }
        } else {
          store.setActivePrompt(null);
        }

        // 7. Handle 'Q' Sheriff's Sense
        if (this.playerInput.sheriffSense) {
          this.playerInput.sheriffSense = false;
          this.interactableManager.triggerSheriffSense(5.0);
        }
      }

      this.scene.render();
    });

    console.log('[SceneManager] Game render loop running.');
  }

  private handleInteraction(interactable: any) {
    const store = useGameStore.getState();
    console.log(`[SceneManager] Interacting with: ${interactable.name}`);

    if (interactable.type === 'clue' || interactable.type === 'document') {
      store.setActiveClue(interactable.payload);
    } else if (interactable.type === 'npc') {
      store.setActiveDialogue(interactable.payload);
    }
  }

  public stopRenderLoop() {
    this.isRunning = false;
    this.engine.stopRenderLoop();
  }

  public getDiagnostics(engineType: string): SceneDiagnostics {
    const engineAny = this.engine as any;
    const drawCalls = typeof engineAny._drawCalls?.current === 'number' ? engineAny._drawCalls.current : 0;
    return {
      fps: Math.round(this.engine.getFps()),
      drawCalls: drawCalls,
      activeMeshes: this.scene.getActiveMeshes().length,
      totalVertices: this.scene.getTotalVertices(),
      engineType,
    };
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getCamera(): UniversalCamera {
    return this.camera;
  }

  public dispose() {
    this.stopRenderLoop();
    this.playerInput.dispose();
    this.assetRegistry.disposeAll();
    this.scene.dispose();
  }
}
