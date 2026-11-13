import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

import { HavokSetup } from '../physics/HavokSetup';
import { HybridAssetRegistry } from './HybridAssetRegistry';
import { LightingManager } from './Lighting';
import { CinematicPipelineManager } from './RenderingPipeline';

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
  private camera: ArcRotateCamera | null = null;
  private lighting: LightingManager;
  private pipeline: CinematicPipelineManager;
  private assetRegistry: HybridAssetRegistry;
  private isRunning: boolean = false;
  private playerNode: TransformNode | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.08, 0.06, 0.05, 1.0);
    this.lighting = new LightingManager();
    this.pipeline = new CinematicPipelineManager();
    this.assetRegistry = HybridAssetRegistry.getInstance();
  }

  public async initializeScene(): Promise<void> {
    console.log('[SceneManager] Initializing Babylon scene and physics...');

    // 1. Setup Camera
    this.camera = new ArcRotateCamera(
      'thirdPersonCamera',
      -Math.PI / 2,
      Math.PI / 2.8,
      12,
      new Vector3(0, 1.5, 0),
      this.scene
    );
    this.camera.attachControl(this.engine.getRenderingCanvas(), true);
    this.camera.lowerRadiusLimit = 4;
    this.camera.upperRadiusLimit = 25;
    this.camera.wheelPrecision = 30;

    // 2. Initialize Havok Physics
    try {
      await HavokSetup.initPhysics(this.scene);
    } catch (e) {
      console.warn('[SceneManager] Havok physics could not initialize, continuing scene without physics:', e);
    }

    // 3. Setup Cinematic Western Lighting
    this.lighting.setupCinematicLighting(this.scene, true);

    // 4. Load Asset Manifest
    await this.assetRegistry.loadManifest();

    // 5. Build Environment Terrain / Frontier Dirt Ground
    this.createGround();

    // 6. Load Frontier District Buildings & Props
    await this.populateInitialFrontierDistrict();

    // 7. Setup Cinematic Post-Processing Pipeline
    this.pipeline.setupPipeline(this.scene, this.camera, 'medium');

    console.log('[SceneManager] Scene initialized successfully.');
  }

  private createGround() {
    // 80x80 meter frontier town dirt ground
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

    // Static ground physics collider
    try {
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.1, friction: 0.8 }, this.scene);
    } catch (e) {
      // Physics aggregate fallback
    }

    // Main Street wooden boardwalk sidewalks
    const boardwalk = MeshBuilder.CreateBox('boardwalk', { width: 4, height: 0.25, depth: 40 }, this.scene);
    boardwalk.position = new Vector3(-8, 0.12, 0);
    boardwalk.receiveShadows = true;
    try {
      const woodPbr = this.assetRegistry.createPbrMaterial(this.scene, 'mat_boardwalk_wood', {
        diffuseId: 'tex_wood_diff',
        normalId: 'tex_wood_nor',
        roughnessId: 'tex_wood_rough',
        roughness: 0.75,
      });
      boardwalk.material = woodPbr;
    } catch (e) {
      // Fallback
    }
  }

  private async populateInitialFrontierDistrict() {
    const shadowGen = this.lighting.getShadowGenerator();

    try {
      // 1. Sheriff Office Building
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

      // Add a warm lantern light at the Sheriff Office entrance
      this.lighting.createLanternLight('officeLantern', new Vector3(-10, 3.2, -4), this.scene);

      // 2. The Gilded Spur Saloon
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

      // 3. Wagon Cart & Town Props
      await this.assetRegistry.loadGlbContainer(this.scene, 'wooden_cart');
      const cart = this.assetRegistry.instantiate('wooden_cart', 'cart');
      const cartRoot = cart.rootNodes[0];
      if (cartRoot) {
        cartRoot.position = new Vector3(-4, 0, 8);
        cartRoot.scaling = new Vector3(1.6, 1.6, 1.6);
        cartRoot.rotation = new Vector3(0, 0.4, 0);
      }

      // 4. Barrels & Crates
      await this.assetRegistry.loadGlbContainer(this.scene, 'wood_barrel');
      const barrel = this.assetRegistry.instantiate('wood_barrel', 'barrel_1');
      const barrelRoot = barrel.rootNodes[0];
      if (barrelRoot) {
        barrelRoot.position = new Vector3(-8.5, 0.25, -2);
        barrelRoot.scaling = new Vector3(1.4, 1.4, 1.4);
      }

      await this.assetRegistry.loadGlbContainer(this.scene, 'wood_crate');
      const crate = this.assetRegistry.instantiate('wood_crate', 'crate_1');
      const crateRoot = crate.rootNodes[0];
      if (crateRoot) {
        crateRoot.position = new Vector3(-8.5, 0.25, -3.2);
        crateRoot.scaling = new Vector3(1.5, 1.5, 1.5);
      }

      // 5. Pine Trees along the frontier road
      await this.assetRegistry.loadGlbContainer(this.scene, 'pine_tree');
      const tree1 = this.assetRegistry.instantiate('pine_tree', 'pine_1');
      if (tree1.rootNodes[0]) {
        tree1.rootNodes[0].position = new Vector3(-24, 0, 16);
        tree1.rootNodes[0].scaling = new Vector3(2.5, 2.8, 2.5);
      }

      // 6. Canyon Boulders
      await this.assetRegistry.loadGlbContainer(this.scene, 'canyon_rock_01');
      const rock1 = this.assetRegistry.instantiate('canyon_rock_01', 'rock_1');
      if (rock1.rootNodes[0]) {
        rock1.rootNodes[0].position = new Vector3(25, 0, -18);
        rock1.rootNodes[0].scaling = new Vector3(3.0, 3.5, 3.0);
      }

      // 7. Arcane Sheriff Character (Adventurer GLB)
      await this.assetRegistry.loadGlbContainer(this.scene, 'sheriff_model');
      const sheriff = this.assetRegistry.instantiate('sheriff_model', 'sheriff');
      const sheriffRoot = sheriff.rootNodes[0];
      if (sheriffRoot) {
        sheriffRoot.position = new Vector3(0, 0, 0);
        sheriffRoot.scaling = new Vector3(1.3, 1.3, 1.3);
        if (shadowGen) {
          sheriffRoot.getChildMeshes().forEach((m) => shadowGen.addShadowCaster(m));
        }
        this.playerNode = sheriffRoot;
        // Point camera target to sheriff
        if (this.camera) {
          this.camera.setTarget(sheriffRoot.position.add(new Vector3(0, 1.4, 0)));
        }
      }

      // 8. Mayor Gideon Vale NPC
      await this.assetRegistry.loadGlbContainer(this.scene, 'mayor_gideon');
      const mayor = this.assetRegistry.instantiate('mayor_gideon', 'mayor');
      const mayorRoot = mayor.rootNodes[0];
      if (mayorRoot) {
        mayorRoot.position = new Vector3(-6, 0.25, -5);
        mayorRoot.scaling = new Vector3(1.3, 1.3, 1.3);
        mayorRoot.rotation = new Vector3(0, Math.PI / 1.5, 0);
        if (shadowGen) {
          mayorRoot.getChildMeshes().forEach((m) => shadowGen.addShadowCaster(m));
        }
      }

      console.log('[SceneManager] Frontier district assets spawned and placed.');
    } catch (err) {
      console.error('[SceneManager] Error populating district:', err);
    }
  }

  public startRenderLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    console.log('[SceneManager] Render loop started.');
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

  public getCamera(): ArcRotateCamera | null {
    return this.camera;
  }

  public dispose() {
    this.stopRenderLoop();
    this.assetRegistry.disposeAll();
    this.scene.dispose();
  }
}
