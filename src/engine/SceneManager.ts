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
import { BossManager } from '../combat/BossManager';
import { DistrictManager } from '../world/DistrictManager';
import { useGameStore } from '../store/useGameStore';
import { AudioManager } from '../audio/AudioManager';
import { AtmosphereManager } from './AtmosphereManager';

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
  private footstepTimer: number = 0;

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

    // 5. Populate All 8 Frontier Districts & Boss Encounter
    await this.populateAllDistricts();
    await BossManager.getInstance().initializeBoss(this.scene);

    // 6. Load Animated Character
    await this.player.loadCharacter(shadowGen);

    // 7. Setup Cinematic Post-Processing Pipeline
    this.pipeline.setupPipeline(this.scene, this.camera, 'medium');

    // 8. Setup Atmospheric Dust & Wind Particles
    AtmosphereManager.getInstance().setupAtmosphere(this.scene, 'medium');

    // 9. Start Procedural Ambient Sound
    AudioManager.getInstance().startAmbience();

    console.log('[SceneManager] Scene, Districts & Player initialized successfully.');
  }

  private createGround() {
    // 180x180 meter connected open-world frontier ground
    const ground = MeshBuilder.CreateGround('frontierGround', { width: 180, height: 180, subdivisions: 16 }, this.scene);
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

  private async populateAllDistricts() {
    const shadowGen = this.lighting.getShadowGenerator();

    // ==========================================
    // DISTRICT 1: SHERIFF'S OFFICE & JAIL (Town Center)
    // ==========================================
    try {
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

      // Sheriff Office Interior Props (Ledger Desk, Chair, Archive Shelf, Jail Door)
      try {
        await this.assetRegistry.loadGlbContainer(this.scene, 'sheriff_desk');
        const desk = this.assetRegistry.instantiate('sheriff_desk', 'sheriffDesk');
        if (desk.rootNodes[0]) {
          desk.rootNodes[0].position = new Vector3(-13.2, 0, -4.2);
          desk.rootNodes[0].scaling = new Vector3(1.4, 1.4, 1.4);
          desk.rootNodes[0].rotation = new Vector3(0, Math.PI, 0);
        }
      } catch (e) { console.warn('[District 1] desk load warning:', e); }

      try {
        await this.assetRegistry.loadGlbContainer(this.scene, 'saloon_chair');
        const chair = this.assetRegistry.instantiate('saloon_chair', 'deskChair');
        if (chair.rootNodes[0]) {
          chair.rootNodes[0].position = new Vector3(-13.2, 0, -5.2);
          chair.rootNodes[0].scaling = new Vector3(1.3, 1.3, 1.3);
        }
      } catch (e) { console.warn('[District 1] chair load warning:', e); }

      try {
        await this.assetRegistry.loadGlbContainer(this.scene, 'archive_shelf');
        const shelf = this.assetRegistry.instantiate('archive_shelf', 'archiveShelf');
        if (shelf.rootNodes[0]) {
          shelf.rootNodes[0].position = new Vector3(-15.8, 0, -2.5);
          shelf.rootNodes[0].scaling = new Vector3(1.5, 1.5, 1.5);
          shelf.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
        }
      } catch (e) { console.warn('[District 1] shelf load warning:', e); }

      try {
        await this.assetRegistry.loadGlbContainer(this.scene, 'jail_door');
        const jailDoor = this.assetRegistry.instantiate('jail_door', 'jailDoor');
        if (jailDoor.rootNodes[0]) {
          jailDoor.rootNodes[0].position = new Vector3(-11.2, 0, -2.2);
          jailDoor.rootNodes[0].scaling = new Vector3(1.2, 1.2, 1.2);
        }
      } catch (e) { console.warn('[District 1] jail_door load warning:', e); }
    } catch (e) {
      console.warn('[SceneManager] District 1 load error:', e);
    }

    // ==========================================
    // DISTRICT 2: THE GILDED SPUR SALOON
    // ==========================================
    try {
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
    } catch (e) {
      console.warn('[SceneManager] District 2 load error:', e);
    }

    // ==========================================
    // DISTRICT 3: IRONVAULT BANK
    // ==========================================
    try {
      await this.assetRegistry.loadGlbContainer(this.scene, 'bank_building');
      const bank = this.assetRegistry.instantiate('bank_building', 'bank');
      if (bank.rootNodes[0]) {
        bank.rootNodes[0].position = new Vector3(-14, 0, 14);
        bank.rootNodes[0].scaling = new Vector3(2.2, 2.2, 2.2);
        bank.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
      }

      // Mayor Gideon Vale NPC (Town Hall / Bank Boardwalk)
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
    } catch (e) {
      console.warn('[SceneManager] District 3 load error:', e);
    }

    // ==========================================
    // DISTRICT 4: WESTERN UNION TELEGRAPH OFFICE (x=16, z=-16)
    // ==========================================
    try {
      const telegraph = this.assetRegistry.instantiate('bank_building', 'telegraphOffice');
      if (telegraph.rootNodes[0]) {
        telegraph.rootNodes[0].position = new Vector3(16, 0, -16);
        telegraph.rootNodes[0].scaling = new Vector3(1.6, 1.6, 1.6);
        telegraph.rootNodes[0].rotation = new Vector3(0, -Math.PI / 2, 0);
      }
      this.lighting.createLanternLight('telegraphLantern', new Vector3(14, 3.0, -14), this.scene);

      // Register Telegraph POI Clue
      this.interactableManager.addInteractable({
        id: 'poi_wire_terminal',
        name: 'Encrypted Telegraph Terminal',
        type: 'clue',
        position: new Vector3(16, 0.5, -16),
        prompt: 'Press [E] to Intercept Western Union Telegraph Dispatches',
        interactionRadius: 4.0,
        payload: {
          id: 'doc_telegraph',
          title: 'Intercepted Western Union Dispatch #77',
          type: 'document',
          dateDiscovered: '1891-10-15',
          source: 'Telegraph Office Terminal',
          snippet: 'Encrypted transmission from Gideon Vale to Ezekiel Cross: "Prepare North Ridge shaft. Intercept freight car 402."',
          fullContent: `WESTERN UNION TELEGRAPH CO. - TERRITORIAL DISPATCH
FROM: G. Vale (Query Creek)
TO: E. Cross (North Ridge Mine)
PRIORITY: URGENT / PRIVATE WIRE 4

"Prepare North Ridge shaft. The second ledger was not found in Hale desk. Intercept freight car 402 at siding. Vance prepared the counterfeit certificate. Let no one inspect the train manifest."`
        }
      });
    } catch (e) {
      console.warn('[SceneManager] District 4 load error:', e);
    }

    // ==========================================
    // DISTRICT 5: DR. VANCE'S APOTHECARY (x=-18, z=-20)
    // ==========================================
    try {
      const apothecary = this.assetRegistry.instantiate('sheriff_office_building', 'apothecaryBuilding');
      if (apothecary.rootNodes[0]) {
        apothecary.rootNodes[0].position = new Vector3(-18, 0, -20);
        apothecary.rootNodes[0].scaling = new Vector3(1.7, 1.7, 1.7);
        apothecary.rootNodes[0].rotation = new Vector3(0, Math.PI / 3, 0);
      }
      this.lighting.createLanternLight('apothecaryLantern', new Vector3(-16, 3.0, -18), this.scene);

      // Register Apothecary POI Clue
      this.interactableManager.addInteractable({
        id: 'poi_autopsy_log',
        name: "Dr. Vance's Medical Autopsy Ledger",
        type: 'clue',
        position: new Vector3(-18, 0.5, -20),
        prompt: 'Press [E] to Inspect Suspicious Autopsy Records',
        interactionRadius: 4.0,
        payload: {
          id: 'doc_autopsy',
          title: 'Autopsy Report #4 (Rowan Hale Case)',
          type: 'document',
          dateDiscovered: '1891-10-12',
          source: "Dr. Vance's Apothecary",
          snippet: 'Autopsy notes reveal lethal chloral hydrate sedative in blood prior to alleged fall. Death certificate was forged!',
          fullContent: `TERRITORIAL CORONER EXAMINATION
RECORD: John Doe #4 (Identified as Sheriff Rowan Hale)
EXAMINER: Dr. Alistair Vance
CAUSE OF DEATH: Apparent fall from canyon

FORENSIC TOXICOLOGY:
Lethal concentrations of chloral hydrate sedative detected in bloodstream. Blunt force trauma sustained post-mortem.
[CONFIDENTIAL FORGERY NOTE]: Signed under duress from Mayor Vale to cover mine extraction.`
        }
      });
    } catch (e) {
      console.warn('[SceneManager] District 5 load error:', e);
    }

    // ==========================================
    // DISTRICT 6: REDROCK TRAIN DEPOT (x=28, z=24)
    // ==========================================
    try {
      const depot = this.assetRegistry.instantiate('saloon_building', 'trainDepot');
      if (depot.rootNodes[0]) {
        depot.rootNodes[0].position = new Vector3(28, 0, 24);
        depot.rootNodes[0].scaling = new Vector3(1.8, 1.8, 1.8);
        depot.rootNodes[0].rotation = new Vector3(0, -Math.PI / 3, 0);
      }
      this.lighting.createLanternLight('depotLantern', new Vector3(26, 3.2, 22), this.scene);

      // Register Train Depot Manifest POI Clue
      this.interactableManager.addInteractable({
        id: 'poi_cargo_manifest',
        name: 'Redrock Freight Siding Manifest',
        type: 'clue',
        position: new Vector3(28, 0.5, 24),
        prompt: 'Press [E] to Inspect Freight Car 402 Manifest',
        interactionRadius: 4.0,
        payload: {
          id: 'doc_train_manifest',
          title: 'Redrock Railway Waybill — Car 402',
          type: 'document',
          dateDiscovered: '1891-10-15',
          source: 'Redrock Train Depot',
          snippet: 'Car 402 weighed 34,200 lbs despite declaring 25,000 lbs of timber. 9,200 lbs of concealed gold bullion!',
          fullContent: `REDROCK RAILROAD FREIGHT SIDING
WAYBILL: TRAIN-FREIGHT-402
ORIGIN: Denver Central -> DESTINATION: North Ridge Siding
DECLARED CARGO: Timber & Rails (25,000 lbs)
ACTUAL SCALE WEIGHT: 34,200 lbs

INSPECTION FLAG: CONCEALED_GOLD_BULLION_SAFES & DYNAMITE
Authorized by: G. Vale & E. Cross`
        }
      });
    } catch (e) {
      console.warn('[SceneManager] District 6 load error:', e);
    }

    // ==========================================
    // DISTRICT 7: WHISPERING PINES CEMETERY (x=-30, z=28)
    // ==========================================
    try {
      await this.assetRegistry.loadGlbContainer(this.scene, 'pine_tree');
      const pineCoords = [
        [-30, 28], [-34, 30], [-26, 26], [-32, 24], [-28, 32]
      ];
      pineCoords.forEach(([px, pz], idx) => {
        const tree = this.assetRegistry.instantiate('pine_tree', `cemetery_pine_${idx}`);
        if (tree.rootNodes[0]) {
          tree.rootNodes[0].position = new Vector3(px, 0, pz);
          tree.rootNodes[0].scaling = new Vector3(2.4, 2.7, 2.4);
        }
      });

      // Register Cemetery Empty Grave Clue
      this.interactableManager.addInteractable({
        id: 'poi_plot_47',
        name: 'Plot 47: Disinterred Grave (Rowan Hale)',
        type: 'clue',
        position: new Vector3(-30, 0.5, 28),
        prompt: "Press [E] to Inspect Rowan Hale's Tombstone",
        interactionRadius: 4.0,
        payload: {
          id: 'doc_cemetery_tomb',
          title: 'Whispering Pines Cemetery Register — Plot 47',
          type: 'document',
          dateDiscovered: '1891-10-12',
          source: 'Whispering Pines Cemetery',
          snippet: 'Plot 47 is an EMPTY TOMB! The coffin contains only stones and iron weights. Rowan Hale is alive!',
          fullContent: `WHISPERING PINES CEMETERY RECORD
PLOT: 47 (Northwest Hillside)
INSCRIPTION: "Rowan Hale — A Faithful Lawman Who Departed in Silence"
GRAVE DEPTH: 2.1 feet (Abnormally shallow)
STATUS: EMPTY_TOMB

EXHUMATION FINDING:
The pine coffin was disinterred under moonlight. No body was found—only iron scrap weights and river stones. Sheriff Rowan Hale was never buried here; he was captured and relocated to the North Ridge Mine!`
        }
      });
    } catch (e) {
      console.warn('[SceneManager] District 7 load error:', e);
    }

    // ==========================================
    // DISTRICT 8: NORTH RIDGE ABANDONED MINE (x=36, z=-34)
    // ==========================================
    try {
      await this.assetRegistry.loadGlbContainer(this.scene, 'canyon_rock_01');
      const mineRocks = [
        [36, -34], [40, -32], [32, -36], [42, -38]
      ];
      mineRocks.forEach(([rx, rz], idx) => {
        const rock = this.assetRegistry.instantiate('canyon_rock_01', `mine_rock_${idx}`);
        if (rock.rootNodes[0]) {
          rock.rootNodes[0].position = new Vector3(rx, 0, rz);
          rock.rootNodes[0].scaling = new Vector3(3.2, 3.8, 3.2);
        }
      });

      await this.assetRegistry.loadGlbContainer(this.scene, 'gold_nugget');
      const goldOre = this.assetRegistry.instantiate('gold_nugget', 'mine_gold_ore');
      if (goldOre.rootNodes[0]) {
        goldOre.rootNodes[0].position = new Vector3(37, 0.2, -35);
        goldOre.rootNodes[0].scaling = new Vector3(1.8, 1.8, 1.8);
      }

      // Register Recovered Master Ledger POI
      this.interactableManager.addInteractable({
        id: 'poi_master_ledger',
        name: 'The Recovered Master Syndicate Ledger',
        type: 'clue',
        position: new Vector3(38, 0.5, -36),
        prompt: 'Press [E] to Inspect the Recovered Master Ledger',
        interactionRadius: 4.5,
        payload: {
          id: 'doc_master_ledger',
          title: 'The Master Syndicate Ledger of Query Creek',
          type: 'document',
          dateDiscovered: '1891-10-16',
          source: 'North Ridge Mine Vault',
          snippet: 'The complete financial conspiracy documenting Mayor Vale as "The Architect", banking theft, and railroad payoffs.',
          fullContent: `THE MASTER LEDGER OF QUERY CREEK — 1891
RECOVERED BY THE ARCANE SHERIFF

SYNDICATE HIERARCHY:
1. "The Architect" — Gideon Vale (45% Cut, 125,000 Gold)
2. "The Enforcer" — Ezekiel Cross (20% Cut, 42,000 Gold)
3. "The Apothecary" — Dr. Alistair Vance (15% Cut, 28,000 Gold)
4. "The Ear" — Silas Thorne (10% Cut, 18,500 Gold)
5. "The Wire" — Clara Higgins (10% Cut, 14,000 Gold)

CONSPIRACY AUDIT CONFIRMED:
The bank robbery was staged, the murder reports were forged, and the entire frontier territory was under syndicate seizure. With this ledger, the law is restored to Query Creek.`
        }
      });
    } catch (e) {
      console.warn('[SceneManager] District 8 load error:', e);
    }

    // ==========================================
    // TOWN PROPS: Cart, Barrels, Crates, Bench
    // ==========================================
    try {
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

      await this.assetRegistry.loadGlbContainer(this.scene, 'boardwalk_bench');
      const bench = this.assetRegistry.instantiate('boardwalk_bench', 'bench_1');
      if (bench.rootNodes[0]) {
        bench.rootNodes[0].position = new Vector3(-8.0, 0.35, -8.0);
        bench.rootNodes[0].scaling = new Vector3(1.4, 1.4, 1.4);
        bench.rootNodes[0].rotation = new Vector3(0, Math.PI / 2, 0);
      }
    } catch (e) {
      console.warn('[SceneManager] Town props load error:', e);
    }

    console.log('[SceneManager] All 8 frontier districts populated with buildings, props, POIs, and boss encounter.');
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
          if (this.deadEyeManager.isActive) {
            AudioManager.getInstance().playDeadEyeEnter();
          } else {
            AudioManager.getInstance().playDeadEyeExit();
          }
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

        // Footstep Audio
        const isMoving =
          this.playerInput.forward ||
          this.playerInput.backward ||
          this.playerInput.left ||
          this.playerInput.right;
        if (isMoving && !this.playerInput.jump) {
          const stepInterval = this.playerInput.sprint ? 0.32 : 0.48;
          this.footstepTimer += effectiveDt;
          if (this.footstepTimer >= stepInterval) {
            this.footstepTimer = 0;
            const pos = this.player.getPosition();
            const isBoardwalk = Math.abs(pos.x - -8.2) < 3.0 && Math.abs(pos.z) < 18.0;
            AudioManager.getInstance().playFootstep(isBoardwalk ? 'wood' : 'dirt');
          }
        } else {
          this.footstepTimer = 0.2;
        }

        // 2. Consume Mouse Deltas & Update Camera
        const { dx, dy } = this.playerInput.consumeMouseDeltas();
        this.cameraController.update(this.player.getPosition(), dx, dy, effectiveDt);

        // 3. Handle Player Attack (Left-Click)
        if (this.playerInput.attack) {
          this.playerInput.attack = false;
          AudioManager.getInstance().playRevolverShot();
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

        // 8. Update Boss Simulation & Aegis Shield Pulse
        BossManager.getInstance().update(deltaTime, deState.timeScale);

        // 9. Update Player District Position & Boundary Warnings
        DistrictManager.getInstance().updatePlayerPosition(this.player.getPosition(), store.chapterNumber);
      }

      this.scene.render();
    });

    console.log('[SceneManager] Game render loop running.');
  }

  private handleInteraction(interactable: any) {
    const store = useGameStore.getState();
    console.log(`[SceneManager] Interacting with: ${interactable.name}`);

    if (interactable.type === 'clue' || interactable.type === 'document') {
      AudioManager.getInstance().playPageTurn();
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
    AtmosphereManager.getInstance().dispose();
    AudioManager.getInstance().dispose();
    this.playerInput.dispose();
    this.assetRegistry.disposeAll();
    this.scene.dispose();
  }
}
