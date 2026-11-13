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
    // 1. Golden Hour Sun Light (Warm frontier sunlight from horizon)
    this.sunLight = new DirectionalLight('sunLight', new Vector3(-0.55, -0.65, 0.52).normalize(), scene);
    this.sunLight.position = new Vector3(35, 45, -25);
    this.sunLight.intensity = 3.0;
    this.sunLight.diffuse = new Color3(1.0, 0.88, 0.70); // Warm rich sunlight
    this.sunLight.specular = new Color3(0.9, 0.75, 0.55);

    // 2. Hemispheric Sky & Desert Ambient Fill (prevents muddy black shadows)
    this.hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    this.hemiLight.intensity = 1.05;
    this.hemiLight.diffuse = new Color3(0.70, 0.78, 0.92); // Soft blue sky ambient
    this.hemiLight.groundColor = new Color3(0.55, 0.42, 0.28); // Warm canyon sand bounce

    // 3. Atmospheric Distance Haze
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0022;
    scene.fogColor = new Color3(0.72, 0.60, 0.46);

    // 4. Soft Shadows
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
    lantern.range = 8.0;
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

