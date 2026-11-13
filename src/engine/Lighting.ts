import { Scene } from '@babylonjs/core/scene';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export class LightingManager {
  private sunLight: DirectionalLight | null = null;
  private hemiLight: HemisphericLight | null = null;
  private shadowGenerator: ShadowGenerator | null = null;
  private lanternLights: PointLight[] = [];

  public setupCinematicLighting(scene: Scene, enableShadows: boolean = true) {
    // 1. Golden Hour Sun Light
    this.sunLight = new DirectionalLight('sunLight', new Vector3(-0.6, -0.7, 0.4).normalize(), scene);
    this.sunLight.position = new Vector3(30, 45, -20);
    this.sunLight.intensity = 2.4;
    this.sunLight.diffuse = new Color3(1.0, 0.86, 0.68); // Warm frontier sunlight
    this.sunLight.specular = new Color3(0.9, 0.8, 0.7);

    // 2. Hemispheric Sky & Sand Ambient Light
    this.hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    this.hemiLight.intensity = 0.65;
    this.hemiLight.diffuse = new Color3(0.55, 0.65, 0.85); // Blue-toned ambient sky
    this.hemiLight.groundColor = new Color3(0.42, 0.32, 0.22); // Desert sand bounce

    // 3. Atmospheric Frontier Dust Fog
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0035;
    scene.fogColor = new Color3(0.68, 0.58, 0.46);

    // 4. Shadows
    if (enableShadows) {
      this.shadowGenerator = new ShadowGenerator(1024, this.sunLight);
      this.shadowGenerator.useBlurExponentialShadowMap = true;
      this.shadowGenerator.blurKernel = 16;
      this.shadowGenerator.bias = 0.001;
      this.shadowGenerator.normalBias = 0.01;
    }

    console.log('[LightingManager] Cinematic western lighting initialized.');
  }

  public createLanternLight(name: string, position: Vector3, scene: Scene): PointLight {
    const lantern = new PointLight(name, position, scene);
    lantern.diffuse = new Color3(1.0, 0.65, 0.25); // Warm kerosene flame
    lantern.intensity = 1.2;
    lantern.range = 14;
    this.lanternLights.push(lantern);
    return lantern;
  }

  public getShadowGenerator(): ShadowGenerator | null {
    return this.shadowGenerator;
  }

  public getSunLight(): DirectionalLight | null {
    return this.sunLight;
  }
}

