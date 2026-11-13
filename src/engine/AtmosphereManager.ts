import { Scene, ParticleSystem, Texture, Vector3, Color4, ShadowGenerator } from '@babylonjs/core';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export class AtmosphereManager {
  private static instance: AtmosphereManager | null = null;
  private scene: Scene | null = null;
  private dustParticles: ParticleSystem | null = null;
  private currentQuality: GraphicsQuality = 'medium';

  public static getInstance(): AtmosphereManager {
    if (!AtmosphereManager.instance) {
      AtmosphereManager.instance = new AtmosphereManager();
    }
    return AtmosphereManager.instance;
  }

  public setupAtmosphere(scene: Scene, quality: GraphicsQuality = 'medium') {
    this.scene = scene;
    this.currentQuality = quality;

    // 1. Frontier Atmospheric Dust Particles
    this.createDustParticleSystem(quality);

    console.log(`[AtmosphereManager] Atmosphere setup completed at quality: ${quality}`);
  }

  private createDustParticleSystem(quality: GraphicsQuality) {
    if (!this.scene) return;

    if (this.dustParticles) {
      this.dustParticles.dispose();
      this.dustParticles = null;
    }

    if (quality === 'low') {
      // Disabled on low preset to maximize FPS
      return;
    }

    const particleCapacity = quality === 'high' ? 800 : 350;
    const dust = new ParticleSystem('frontierDust', particleCapacity, this.scene);

    // Procedural particle texture using fallback 1x1 dot
    dust.particleTexture = new Texture('/assets/textures/ground_dirt_diff_1k.jpg', this.scene);

    // Emitter bounds: blowing westward across Main Street
    dust.emitter = new Vector3(0, 1.5, 0);
    dust.minEmitBox = new Vector3(-35, 0, -35);
    dust.maxEmitBox = new Vector3(35, 3.5, 35);

    // Warm golden-hour dust colors
    dust.color1 = new Color4(0.85, 0.70, 0.40, 0.25);
    dust.color2 = new Color4(0.70, 0.55, 0.30, 0.15);
    dust.colorDead = new Color4(0.40, 0.30, 0.15, 0.0);

    // Particle sizes
    dust.minSize = 0.08;
    dust.maxSize = 0.28;

    // Lifespan & Speed
    dust.minLifeTime = 3.5;
    dust.maxLifeTime = 6.5;
    dust.emitRate = quality === 'high' ? 120 : 60;

    // Westward drift velocity
    dust.direction1 = new Vector3(-1.8, -0.1, -0.5);
    dust.direction2 = new Vector3(-2.8, 0.2, 0.5);
    dust.minEmitPower = 0.5;
    dust.maxEmitPower = 1.8;
    dust.updateSpeed = 0.012;

    dust.start();
    this.dustParticles = dust;
  }

  public applyQualityPreset(quality: GraphicsQuality, shadowGen?: ShadowGenerator | null) {
    this.currentQuality = quality;

    // Adjust shadow map resolution based on quality preset
    if (shadowGen) {
      if (quality === 'high') {
        shadowGen.mapSize = 2048;
        shadowGen.usePoissonSampling = true;
      } else if (quality === 'medium') {
        shadowGen.mapSize = 1024;
        shadowGen.usePoissonSampling = false;
      } else {
        shadowGen.mapSize = 512;
        shadowGen.usePoissonSampling = false;
      }
    }

    if (!this.scene) return;

    // Recreate particle system with new capacity
    this.createDustParticleSystem(quality);

    console.log(`[AtmosphereManager] Applied graphics quality preset: ${quality}`);
  }

  public getCurrentQuality(): GraphicsQuality {
    return this.currentQuality;
  }

  public dispose() {
    if (this.dustParticles) {
      this.dustParticles.dispose();
      this.dustParticles = null;
    }
  }
}
