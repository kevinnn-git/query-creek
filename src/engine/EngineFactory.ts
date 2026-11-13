import { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

export interface EngineInitResult {
  engine: Engine | WebGPUEngine;
  engineType: 'WebGPU' | 'WebGL2' | 'WebGL1';
  adapterInfo?: GPUAdapterInfo | null;
  glRenderer?: string;
}

export class EngineFactory {
  public static async createEngine(
    canvas: HTMLCanvasElement,
    options: {
      preferWebGPU?: boolean;
      antialias?: boolean;
      powerPreference?: 'high-performance' | 'low-power';
    } = {}
  ): Promise<EngineInitResult> {
    const { preferWebGPU = true, antialias = true, powerPreference = 'high-performance' } = options;

    // 1. Try WebGPU if requested and supported
    if (preferWebGPU && (navigator as any).gpu) {
      try {
        console.log('[EngineFactory] Attempting WebGPU Engine initialization...');
        const webgpuEngine = new WebGPUEngine(canvas, {
          stencil: true,
          antialias: antialias,
          powerPreference: powerPreference,
          audioEngine: false,
        });

        await webgpuEngine.initAsync();
        console.log('[EngineFactory] WebGPU Engine successfully initialized!');

        let adapterInfo: any = null;
        try {
          const adapter = await (navigator as any).gpu.requestAdapter({ powerPreference });
          if (adapter && adapter.requestAdapterInfo) {
            adapterInfo = await adapter.requestAdapterInfo();
          } else if (adapter && (adapter as any).info) {
            adapterInfo = (adapter as any).info;
          }
        } catch (e) {
          console.warn('[EngineFactory] Could not query GPU adapter info:', e);
        }

        const rendererName =
          adapterInfo?.description ||
          adapterInfo?.device ||
          (adapterInfo?.vendor ? `${adapterInfo.vendor} WebGPU` : 'WebGPU Hardware Accelerated');

        return {
          engine: webgpuEngine,
          engineType: 'WebGPU',
          adapterInfo,
          glRenderer: rendererName,
        };
      } catch (err) {
        console.warn('[EngineFactory] WebGPU initialization failed, falling back to WebGL2:', err);
      }
    }

    // 2. WebGL2 Fallback
    console.log('[EngineFactory] Initializing standard WebGL2 Engine...');
    const webglEngine = new Engine(canvas, antialias, {
      preserveDrawingBuffer: false,
      stencil: true,
      powerPreference: powerPreference,
      failIfMajorPerformanceCaveat: false,
      audioEngine: false,
    });

    let glRenderer = 'Unknown WebGL';
    try {
      const gl = webglEngine._gl;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } else {
          glRenderer = gl.getParameter(gl.RENDERER);
        }
      }
    } catch (e) {
      console.warn('[EngineFactory] Could not read GL renderer string:', e);
    }

    const isWebGL2 = webglEngine.webGLVersion >= 2;
    console.log(`[EngineFactory] WebGL initialized (version: ${webglEngine.webGLVersion}, renderer: ${glRenderer})`);

    return {
      engine: webglEngine,
      engineType: isWebGL2 ? 'WebGL2' : 'WebGL1',
      glRenderer,
    };
  }
}
