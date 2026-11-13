import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

export interface PhysicsInitResult {
  plugin: HavokPlugin;
  instance: any;
}

export class HavokSetup {
  private static instance: any = null;

  public static async initPhysics(scene: Scene, gravity: Vector3 = new Vector3(0, -9.81, 0)): Promise<PhysicsInitResult> {
    if (!this.instance) {
      console.log('[HavokSetup] Loading Havok Physics WASM instance...');
      try {
        // Point to our self-hosted wasm binary in public/wasm/HavokPhysics.wasm or fallback
        this.instance = await HavokPhysics({
          locateFile: () => '/wasm/HavokPhysics.wasm'
        });
      } catch (e) {
        console.warn('[HavokSetup] LocateFile failed, trying default Havok loader:', e);
        this.instance = await HavokPhysics();
      }
    }

    const plugin = new HavokPlugin(true, this.instance);
    scene.enablePhysics(gravity, plugin);
    console.log('[HavokSetup] Havok Physics V2 plugin enabled on scene.');

    return {
      plugin,
      instance: this.instance
    };
  }
}

