import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';

export class CameraController {
  private camera: UniversalCamera;
  private scene: Scene;

  public yaw: number = 0; // horizontal angle in radians
  public pitch: number = 0.16; // vertical angle in radians (cinematic golden-hour tilt)
  public distance: number = 6.4; // ideal framing: sheriff occupies ~30-35% of screen height
  public minDistance: number = 1.8;
  public maxDistance: number = 9.5;
  public heightOffset: number = 1.35; // mid-torso anchor on 1.85m sheriff
  public shoulderOffset: number = 0.85; // over-the-shoulder offset: sheriff on left, clear center crosshair
  public mouseSensitivity: number = 0.0022;

  private currentPosition: Vector3 = new Vector3(0.85, 2.3, -6.4);
  private currentLookTarget: Vector3 = new Vector3(0.85, 1.4, 25.0);

  constructor(camera: UniversalCamera, scene: Scene) {
    this.camera = camera;
    this.scene = scene;
    this.camera.fov = 0.82; // ~47 degrees: cinematic western FOV
  }

  public update(targetPosition: Vector3, mouseDeltaX: number, mouseDeltaY: number, deltaTime: number) {
    // 1. Mouse rotation
    this.yaw += mouseDeltaX * this.mouseSensitivity;
    this.pitch += mouseDeltaY * this.mouseSensitivity;

    // 2. Clamp pitch (-0.20 rad to +0.85 rad)
    const minPitch = -0.20; // looking slightly up
    const maxPitch = 0.85; // looking down from above
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

    // 3. Compute directional vectors from yaw & pitch
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Forward vector: aiming vector of the camera
    const camForward = new Vector3(
      sinYaw * cosPitch,
      -sinPitch,
      cosYaw * cosPitch
    ).normalize();

    // Right vector: perpendicular on horizontal plane
    const camRight = new Vector3(cosYaw, 0, -sinYaw).normalize();

    // 4. Player anchor: mid-torso (heightOffset = 1.35)
    const playerChestAnchor = targetPosition.add(new Vector3(0, this.heightOffset, 0));

    // 5. Raycast camera collision test
    let desiredDistance = this.distance;
    const camBackDir = camForward.scale(-1.0);
    const ray = new Ray(playerChestAnchor, camBackDir, this.distance + 0.35);

    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return (
        mesh.isPickable &&
        mesh.checkCollisions &&
        !mesh.name.startsWith('player') &&
        !mesh.name.startsWith('sheriff')
      );
    });

    if (hit && hit.hit && hit.distance < desiredDistance) {
      desiredDistance = Math.max(this.minDistance, hit.distance - 0.25);
    }

    // Camera sits behind the player along camBackDir, offset to the right by camRight * shoulderOffset
    const desiredPosition = playerChestAnchor
      .add(camBackDir.scale(desiredDistance))
      .add(camRight.scale(this.shoulderOffset));

    // 6. Smooth camera position interpolation
    const lerpFactor = Math.min(1.0, deltaTime * 12.0);
    this.currentPosition = Vector3.Lerp(this.currentPosition, desiredPosition, lerpFactor);
    this.camera.position.copyFrom(this.currentPosition);

    // 7. Aim look target: point directly along camera forward vector
    // This guarantees the screen center crosshair points directly forward without obstruction
    const desiredLookTarget = this.currentPosition.add(camForward.scale(30.0));
    this.currentLookTarget = Vector3.Lerp(this.currentLookTarget, desiredLookTarget, Math.min(1.0, deltaTime * 16.0));
    this.camera.setTarget(this.currentLookTarget);
  }

  public getForwardVector(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): Vector3 {
    return new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }
}
