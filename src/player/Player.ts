import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
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

  // Combat Dodge
  public isDodging: boolean = false;
  public isInvulnerable: boolean = false;
  private dodgeTimer: number = 0;
  private readonly dodgeDuration: number = 0.55;
  private readonly dodgeSpeed: number = 9.5;
  private dodgeDirection: Vector3 = new Vector3(0, 0, 1);

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

    // Load sheriff_animated.glb which contains CharacterArmature + 12 animation clips
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '/assets/characters/sheriff_animated.glb',
      '',
      this.scene
    );

    const rootMesh = result.meshes[0];
    rootMesh.parent = this.rootNode;
    rootMesh.position = new Vector3(0, 0, 0);
    // Real-world adult human proportions (1.85m tall)
    rootMesh.scaling = new Vector3(1.0, 1.0, 1.0);
    // Face forward initially
    rootMesh.rotation = new Vector3(0, 0, 0);

    this.characterMeshes = result.meshes;

    // Enhance character materials for cinematic PBR western look & WebGPU compliance
    result.meshes.forEach((m) => {
      if (m.material) {
        (m.material as any).maxSimultaneousLights = 2;
        if (m.material instanceof PBRMaterial) {
          m.material.roughness = Math.max(0.68, m.material.roughness || 0.75);
          m.material.metallic = Math.min(0.2, m.material.metallic || 0.05);
        }
      }
      if (shadowGen && m.name !== '__root__') {
        shadowGen.addShadowCaster(m);
        m.receiveShadows = true;
      }
    });

    // Attach western cowboy hat to the Head bone/mesh
    const headNode = this.scene.getTransformNodeByName('Head') || this.scene.getMeshByName('Adventurer_Head');
    if (headNode) {
      this.createCowboyHat(headNode, shadowGen);
    }

    // Cache and configure animation groups
    for (const ag of result.animationGroups) {
      // Normalize animation names: e.g. 'CharacterArmature|Idle' -> 'Idle'
      const simpleName = ag.name.includes('|') ? ag.name.split('|')[1] : ag.name;
      this.animGroups.set(simpleName, ag);
      ag.stop();
    }

    console.log(`[Player] Loaded ${this.animGroups.size} animations:`, Array.from(this.animGroups.keys()));

    // Start with Idle animation
    this.playAnimation('Idle', 0.2);
  }

  private createCowboyHat(headNode: TransformNode | AbstractMesh, shadowGen?: ShadowGenerator | null): AbstractMesh {
    // 1. Hat Crown with cattleman crease
    const crown = MeshBuilder.CreateCylinder('sheriffHatCrown', {
      diameterTop: 0.26,
      diameterBottom: 0.32,
      height: 0.22,
      tessellation: 32,
    }, this.scene);
    crown.position = new Vector3(0, 0.14, 0.02);
    crown.scaling = new Vector3(1.0, 0.9, 1.15);

    // 2. Wide curved brim
    const brim = MeshBuilder.CreateCylinder('sheriffHatBrim', {
      diameterTop: 0.62,
      diameterBottom: 0.60,
      height: 0.025,
      tessellation: 36,
    }, this.scene);
    brim.position = new Vector3(0, 0.04, 0.02);
    brim.scaling = new Vector3(1.15, 0.8, 1.35);
    brim.rotation = new Vector3(-0.06, 0, 0);

    // 3. Hatband
    const band = MeshBuilder.CreateTorus('sheriffHatBand', {
      diameter: 0.31,
      thickness: 0.035,
      tessellation: 28,
    }, this.scene);
    band.position = new Vector3(0, 0.06, 0.02);
    band.scaling = new Vector3(1.0, 0.5, 1.15);

    // Merge into single mesh
    const hatMesh = Mesh.MergeMeshes([crown, brim, band], true, true, undefined, false, true);
    if (!hatMesh) return crown;
    hatMesh.name = 'sheriffCowboyHat';

    // Saddle-brown weathered leather PBR material
    const hatMat = new PBRMaterial('mat_cowboy_hat', this.scene);
    hatMat.albedoColor = new Color3(0.18, 0.12, 0.06);
    hatMat.roughness = 0.82;
    hatMat.metallic = 0.05;
    hatMat.maxSimultaneousLights = 2;
    hatMesh.material = hatMat;

    hatMesh.parent = headNode;
    hatMesh.position = new Vector3(0, 0.12, 0.02);

    if (shadowGen) {
      shadowGen.addShadowCaster(hatMesh);
      hatMesh.receiveShadows = true;
    }

    return hatMesh;
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

    // Handle Active Dodge Roll
    if (this.isDodging) {
      this.dodgeTimer -= deltaTime;
      this.velocity.x = this.dodgeDirection.x * this.dodgeSpeed;
      this.velocity.z = this.dodgeDirection.z * this.dodgeSpeed;
      this.playAnimation('Roll', 0.1);

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvulnerable = false;
      }
    } else if (this.isGrounded && this.input.dodge) {
      this.isDodging = true;
      this.isInvulnerable = true;
      this.dodgeTimer = this.dodgeDuration;

      // Dodge in current move direction or forward
      const forward = this.cameraController.getForwardVector();
      this.dodgeDirection = hasMoveInput ? inputDir.clone() : new Vector3(forward.x, 0, forward.z).normalize();
      this.playAnimation('Roll', 0.1);
    } else if (hasMoveInput) {
      inputDir.normalize();
      this.velocity.x = inputDir.x * targetSpeed;
      this.velocity.z = inputDir.z * targetSpeed;

      // Smoothly rotate character toward movement heading
      const targetHeading = Math.atan2(inputDir.x, inputDir.z);
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
    // West and East boardwalks are at y ~ 0.35, dirt thoroughfare at y ~ 0.0
    const onBoardwalk =
      ((this.position.x >= -10.5 && this.position.x <= -5.8) ||
       (this.position.x >= 5.8 && this.position.x <= 10.5)) &&
      Math.abs(this.position.z) <= 22;
    const groundLevel = onBoardwalk ? 0.35 : 0.0;

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

