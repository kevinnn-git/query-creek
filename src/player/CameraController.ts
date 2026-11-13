import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';

export class CameraController {
  private camera: UniversalCamera;
  private scene: Scene;

  public yaw: number = 0; // horizontal angle in radians
  public pitch: number = 0.25; // vertical angle in radians
  public distance: number = 5.2;
  public minDistance: number = 2.0;
  public maxDistance: number = 10.0;
  public heightOffset: number = 1.6;
  public shoulderOffset: number = 0.45; // Over-the-shoulder offset
  public mouseSensitivity: number = 0.0024;

  private currentPosition: Vector3 = new Vector3(0, 3, -5);

  constructor(camera: UniversalCamera, scene: Scene) {
    this.camera = camera;
    this.scene = scene;
  }

  public update(targetPosition: Vector3, mouseDeltaX: number, mouseDeltaY: number, deltaTime: number) {
    // 1. Apply mouse rotation
    this.yaw += mouseDeltaX * this.mouseSensitivity;
    this.pitch += mouseDeltaY * this.mouseSensitivity;

    // 2. Clamp pitch
    const minPitch = -0.25; // looking up slightly
    const maxPitch = 1.15; // looking down from above
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

    // 3. Compute ideal camera position in world space
    const targetWithHeight = targetPosition.add(new Vector3(0, this.heightOffset, 0));

    // Calculate forward, right, and up directions relative to yaw & pitch
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Direction from target to camera (behind player)
    const backDirection = new Vector3(
      sinYaw * cosPitch,
      sinPitch,
      -cosYaw * cosPitch
    );

    // Right vector for over-the-shoulder framing
    const rightVector = new Vector3(cosYaw, 0, sinYaw);

    let desiredDistance = this.distance;

    // 4. Raycast camera collision test
    const rayOrigin = targetWithHeight;
    const rayDirection = backDirection.normalize();
    const ray = new Ray(rayOrigin, rayDirection, this.distance + 0.3);

    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Ignore player mesh itself and triggers
      return mesh.isPickable && mesh.checkCollisions && !mesh.name.startsWith('player');
    });

    if (hit && hit.hit && hit.distance < desiredDistance) {
      desiredDistance = Math.max(this.minDistance, hit.distance - 0.2);
    }

    const desiredPosition = targetWithHeight
      .add(rayDirection.scale(desiredDistance))
      .add(rightVector.scale(this.shoulderOffset));

    // 5. Smoothly interpolate (lerp) camera position
    const lerpFactor = Math.min(1.0, deltaTime * 14.0);
    this.currentPosition = Vector3.Lerp(this.currentPosition, desiredPosition, lerpFactor);

    this.camera.position.copyFrom(this.currentPosition);

    // Look at target position with slight chest/head offset
    const lookTarget = targetWithHeight.add(rightVector.scale(this.shoulderOffset * 0.4));
    this.camera.setTarget(lookTarget);
  }

  public getForwardVector(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): Vector3 {
    return new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }
}
