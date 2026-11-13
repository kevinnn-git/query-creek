import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';

import { PlayerInput } from './PlayerInput';
import { CameraController } from './CameraController';

export class Player {
  public rootNode: TransformNode;
  private scene: Scene;
  private input: PlayerInput;
  private cameraController: CameraController;

  // Animation Groups
  private animGroups: Map<string, AnimationGroup> = new Map();
  private currentAnim: string = 'Idle';

  // Movement Physics
  public position: Vector3 = new Vector3(0, 0, 0);
  public velocity: Vector3 = new Vector3(0, 0, 0);
  public isGrounded: boolean = true;
  public walkSpeed: number = 3.6;
  public sprintSpeed: number = 7.2;
  public jumpForce: number = 7.5;
  public gravity: number = -20.0;
  public rotationSpeed: number = 14.0;

  private currentHeading: number = 0; // in radians
  private characterMeshes: AbstractMesh[] = [];

  constructor(scene: Scene, input: PlayerInput, cameraController: CameraController) {
    this.scene = scene;
    this.input = input;
    this.cameraController = cameraController;
    this.rootNode = new TransformNode('playerRoot', scene);
    this.rootNode.position = this.position;
  }

  public async loadCharacter(shadowGen?: ShadowGenerator | null): Promise<void> {
    console.log('[Player] Loading rigged character model and animation clips...');

    // Load knight_animations.glb which contains HumanArmature + 12 animation clips
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '/assets/characters/knight_animations.glb',
      '',
      this.scene
    );

    const rootMesh = result.meshes[0];
    rootMesh.parent = this.rootNode;
    rootMesh.position = new Vector3(0, 0, 0);
    rootMesh.scaling = new Vector3(1.2, 1.2, 1.2);
    // Face forward initially
    rootMesh.rotation = new Vector3(0, 0, 0);

    this.characterMeshes = result.meshes;

    if (shadowGen) {
      result.meshes.forEach((m) => {
        if (m.name !== '__root__') {
          shadowGen.addShadowCaster(m);
          m.receiveShadows = true;
        }
      });
    }

    // Cache and configure animation groups
    for (const ag of result.animationGroups) {
      // Normalize animation names: e.g. 'HumanArmature|Idle' -> 'Idle'
      const simpleName = ag.name.includes('|') ? ag.name.split('|')[1] : ag.name;
      this.animGroups.set(simpleName, ag);
      ag.stop();
    }

    console.log(`[Player] Loaded ${this.animGroups.size} animations:`, Array.from(this.animGroups.keys()));

    // Start with Idle animation
    this.playAnimation('Idle', 0.2);
  }

  public playAnimation(name: string, transitionDuration: number = 0.15) {
    if (this.currentAnim === name) return;

    const newAnim = this.animGroups.get(name);
    const oldAnim = this.animGroups.get(this.currentAnim);

    if (oldAnim) {
      oldAnim.setWeightForAllAnimatables(0);
      oldAnim.stop();
    }

    if (newAnim) {
      newAnim.start(true, 1.0, newAnim.from, newAnim.to, false);
      newAnim.setWeightForAllAnimatables(1.0);
      this.currentAnim = name;
    }
  }

  public update(deltaTime: number) {
    if (!this.rootNode) return;

    // 1. Calculate input movement vector relative to camera yaw
    const forward = this.cameraController.getForwardVector();
    const right = this.cameraController.getRightVector();

    let moveX = 0;
    let moveZ = 0;

    if (this.input.forward) {
      moveX += forward.x;
      moveZ += forward.z;
    }
    if (this.input.backward) {
      moveX -= forward.x;
      moveZ -= forward.z;
    }
    if (this.input.right) {
      moveX += right.x;
      moveZ += right.z;
    }
    if (this.input.left) {
      moveX -= right.x;
      moveZ -= right.z;
    }

    const inputDir = new Vector3(moveX, 0, moveZ);
    const hasMoveInput = inputDir.lengthSquared() > 0.001;

    // 2. Determine target speed
    const isSprinting = this.input.sprint && hasMoveInput;
    const targetSpeed = hasMoveInput ? (isSprinting ? this.sprintSpeed : this.walkSpeed) : 0;

    // 3. Acceleration & velocity horizontal lerp
    if (hasMoveInput) {
      inputDir.normalize();
      this.velocity.x = inputDir.x * targetSpeed;
      this.velocity.z = inputDir.z * targetSpeed;

      // Smoothly rotate character toward movement heading
      const targetHeading = Math.atan2(inputDir.x, inputDir.z);
      // Angular shortest angle interpolation
      let angleDiff = targetHeading - this.currentHeading;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.currentHeading += angleDiff * Math.min(1.0, deltaTime * this.rotationSpeed);
      this.rootNode.rotation = new Vector3(0, this.currentHeading, 0);
    } else {
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
    }

    // 4. Jump & Gravity
    if (this.isGrounded && this.input.jump) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.playAnimation('Jump', 0.1);
    }

    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // 5. Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // 6. Ground clamping (Boardwalk & Dirt Road height check)
    // In our district, boardwalk is at y ~ 0.25, ground at y ~ 0.0
    const onBoardwalk = this.position.x >= -10 && this.position.x <= -6 && Math.abs(this.position.z) <= 20;
    const groundLevel = onBoardwalk ? 0.25 : 0.0;

    if (this.position.y <= groundLevel) {
      this.position.y = groundLevel;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.rootNode.position.copyFrom(this.position);

    // 7. Select appropriate animation
    if (!this.isGrounded) {
      this.playAnimation('Jump', 0.15);
    } else if (hasMoveInput) {
      if (isSprinting) {
        this.playAnimation('Run', 0.15);
      } else {
        this.playAnimation('Walking', 0.15);
      }
    } else {
      this.playAnimation('Idle', 0.2);
    }
  }

  public getPosition(): Vector3 {
    return this.position;
  }
}
