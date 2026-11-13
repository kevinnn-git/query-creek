import { Scene } from '@babylonjs/core/scene';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { Color4 } from '@babylonjs/core/Maths/math.color';

export class CinematicPipelineManager {
  private pipeline: DefaultRenderingPipeline | null = null;

  public setupPipeline(scene: Scene, camera: Camera, qualityPreset: 'high' | 'medium' | 'low' = 'medium'): DefaultRenderingPipeline {
    // hdr: false ensures clean, universal WebGPU & WebGL2 compatibility (rgba8unorm) without float16 texture validation errors
    this.pipeline = new DefaultRenderingPipeline('cinematicPipeline', false, scene, [camera]);

    // Disable bloom in WebGPU to prevent depth24plus-stencil8 PostProcessRTT validation errors
    this.pipeline.bloomEnabled = false;

    if (qualityPreset === 'high') {
      // Vignette for Noir mystery feel
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.6;
      this.pipeline.imageProcessing.vignetteColor = new Color4(0.04, 0.03, 0.02, 0);

      // Frontier Noir Contrast & Tone Mapping
      this.pipeline.imageProcessing.contrast = 1.15;
      this.pipeline.imageProcessing.exposure = 1.15;

      // Anti-aliasing via multisampling
      this.pipeline.samples = 2;
      this.pipeline.fxaaEnabled = false;
    } else if (qualityPreset === 'medium') {
      // Balanced for GTX 1650 Max-Q
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.15;
      this.pipeline.imageProcessing.vignetteColor = new Color4(0.04, 0.03, 0.02, 0);

      this.pipeline.imageProcessing.contrast = 1.10;
      this.pipeline.imageProcessing.exposure = 1.12;
      this.pipeline.fxaaEnabled = false;
    } else {
      // Low preset: minimal post processing for maximum frame rate
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 1.0;
      this.pipeline.fxaaEnabled = false;
    }

    console.log(`[CinematicPipeline] Initialized with quality preset: ${qualityPreset}`);
    return this.pipeline;
  }

  public getPipeline(): DefaultRenderingPipeline | null {
    return this.pipeline;
  }
}

