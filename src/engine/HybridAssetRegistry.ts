import '@babylonjs/loaders/glTF';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { Material } from '@babylonjs/core/Materials/material';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';

export interface AssetManifestEntry {
  id: string;
  name: string;
  category: string;
  creator: string;
  sourceUrl: string;
  downloadUrl: string;
  license: string;
  licenseUrl: string;
  format: string;
  localPath: string;
  fileSize: number;
  status: string;
}

export interface LoadedAsset {
  id: string;
  container: AssetContainer;
  rootMesh: AbstractMesh;
  animationGroups: AnimationGroup[];
  materials: Material[];
}

export class HybridAssetRegistry {
  private static instance: HybridAssetRegistry;
  private manifest: Map<string, AssetManifestEntry> = new Map();
  private containers: Map<string, AssetContainer> = new Map();
  private textures: Map<string, Texture> = new Map();
  private materials: Map<string, Material> = new Map();
  private loadingPromises: Map<string, Promise<AssetContainer>> = new Map();

  private constructor() {}

  public static getInstance(): HybridAssetRegistry {
    if (!HybridAssetRegistry.instance) {
      HybridAssetRegistry.instance = new HybridAssetRegistry();
    }
    return HybridAssetRegistry.instance;
  }

  public async loadManifest(): Promise<AssetManifestEntry[]> {
    if (this.manifest.size > 0) return Array.from(this.manifest.values());
    try {
      const res = await fetch('/assets/manifest.json');
      const entries: AssetManifestEntry[] = await res.json();
      for (const entry of entries) {
        this.manifest.set(entry.id, entry);
      }
      console.log(`[HybridAssetRegistry] Loaded manifest with ${entries.length} entries.`);
      return entries;
    } catch (e) {
      console.error('[HybridAssetRegistry] Failed to load manifest.json:', e);
      return [];
    }
  }

  public getManifestEntry(id: string): AssetManifestEntry | undefined {
    return this.manifest.get(id);
  }

  public getAllManifestEntries(): AssetManifestEntry[] {
    return Array.from(this.manifest.values());
  }

  public async loadGlbContainer(scene: Scene, assetId: string): Promise<AssetContainer> {
    if (this.containers.has(assetId)) {
      return this.containers.get(assetId)!;
    }

    if (this.loadingPromises.has(assetId)) {
      return this.loadingPromises.get(assetId)!;
    }

    const entry = this.manifest.get(assetId);
    if (!entry) {
      throw new Error(`[HybridAssetRegistry] Asset ID "${assetId}" not found in manifest.`);
    }

    const loadPromise = (async () => {
      console.log(`[HybridAssetRegistry] Loading GLB container: ${assetId} (${entry.localPath})`);
      const container = await SceneLoader.LoadAssetContainerAsync('', entry.localPath, scene);
      this.containers.set(assetId, container);
      this.loadingPromises.delete(assetId);
      return container;
    })();

    this.loadingPromises.set(assetId, loadPromise);
    return loadPromise;
  }

  public instantiate(assetId: string, namePrefix: string): { rootNodes: AbstractMesh[]; animationGroups: AnimationGroup[] } {
    const container = this.containers.get(assetId);
    if (!container) {
      throw new Error(`[HybridAssetRegistry] Cannot instantiate asset "${assetId}": Container not loaded.`);
    }

    const instance = container.instantiateModelsToScene(
      (name) => `${namePrefix}_${name}`,
      false,
      { doNotInstantiate: false }
    );

    return {
      rootNodes: instance.rootNodes as AbstractMesh[],
      animationGroups: instance.animationGroups,
    };
  }

  public getTexture(scene: Scene, textureId: string): Texture {
    if (this.textures.has(textureId)) {
      return this.textures.get(textureId)!;
    }
    const entry = this.manifest.get(textureId);
    if (!entry) {
      throw new Error(`[HybridAssetRegistry] Texture ID "${textureId}" not in manifest.`);
    }
    const tex = new Texture(entry.localPath, scene);
    this.textures.set(textureId, tex);
    return tex;
  }

  public createPbrMaterial(scene: Scene, matName: string, config: {
    diffuseId?: string;
    normalId?: string;
    roughnessId?: string;
    metallic?: number;
    roughness?: number;
  }): PBRMaterial {
    if (this.materials.has(matName)) {
      return this.materials.get(matName) as PBRMaterial;
    }

    const pbr = new PBRMaterial(matName, scene);
    pbr.metallic = config.metallic ?? 0.0;
    pbr.roughness = config.roughness ?? 0.8;

    if (config.diffuseId) {
      pbr.albedoTexture = this.getTexture(scene, config.diffuseId);
    }
    if (config.normalId) {
      pbr.bumpTexture = this.getTexture(scene, config.normalId);
    }
    if (config.roughnessId) {
      pbr.microSurfaceTexture = this.getTexture(scene, config.roughnessId);
    }

    this.materials.set(matName, pbr);
    return pbr;
  }

  public getLoadedContainersCount(): number {
    return this.containers.size;
  }

  public disposeAll() {
    this.containers.forEach((c) => c.dispose());
    this.containers.clear();
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
    this.materials.forEach((m) => m.dispose());
    this.materials.clear();
    this.loadingPromises.clear();
    console.log('[HybridAssetRegistry] Disposed all cached assets.');
  }
}

