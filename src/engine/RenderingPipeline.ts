import { Scene } from '@babylonjs/core/scene';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { Color4 } from '@babylonjs/core/Maths/math.color';

export class CinematicPipelineManager {
  private pipeline: DefaultRenderingPipeline | null = null;

  public setupPipeline(scene: Scene, camera: Camera, qualityPreset: 'high' | 'medium' | 'low' = 'medium'): DefaultRenderingPipeline {
    this.pipeline = new DefaultRenderingPipeline('cinematicPipeline', true, scene, [camera]);

    if (qualityPreset === 'high') {
      // Bloom for glowing saloon lanterns and arcane spells
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomThreshold = 0.8;
      this.pipeline.bloomWeight = 0.25;
      this.pipeline.bloomKernel = 32;
      this.pipeline.bloomScale = 0.5;

      // Vignette for Noir mystery feel
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.8;
      this.pipeline.imageProcessing.vignetteColor = new Color4(0.05, 0.04, 0.03, 0);

      // Frontier Noir Contrast & Tone Mapping
      this.pipeline.imageProcessing.contrast = 1.15;
      this.pipeline.imageProcessing.exposure = 1.05;

      // Anti-aliasing
      this.pipeline.samples = 4;
      this.pipeline.fxaaEnabled = true;
    } else if (qualityPreset === 'medium') {
      // Balanced for GTX 1650 Max-Q
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomThreshold = 0.85;
      this.pipeline.bloomWeight = 0.2;
      this.pipeline.bloomKernel = 16;
      this.pipeline.bloomScale = 0.5;

      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.5;
      this.pipeline.imageProcessing.vignetteColor = new Color4(0.05, 0.04, 0.03, 0);

      this.pipeline.imageProcessing.contrast = 1.1;
      this.pipeline.imageProcessing.exposure = 1.0;
      this.pipeline.fxaaEnabled = true;
    } else {
      // Low preset: minimal post processing for maximum frame rate
      this.pipeline.bloomEnabled = false;
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.2;
      this.pipeline.fxaaEnabled = false;
    }

    console.log(`[CinematicPipeline] Initialized with quality preset: ${qualityPreset}`);
    return this.pipeline;
  }

  public getPipeline(): DefaultRenderingPipeline | null {
    return this.pipeline;
  }
}

