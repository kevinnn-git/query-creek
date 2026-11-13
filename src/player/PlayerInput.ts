export class PlayerInput {
  public forward: boolean = false;
  public backward: boolean = false;
  public left: boolean = false;
  public right: boolean = false;
  public sprint: boolean = false;
  public jump: boolean = false;
  public interact: boolean = false;
  public sheriffSense: boolean = false;
  public deadEye: boolean = false;

  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public isPointerLocked: boolean = false;

  private canvas: HTMLCanvasElement;
  private isEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('click', this.requestPointerLock);
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.resetMovement();
      if (document.pointerLockElement === this.canvas) {
        document.exitPointerLock();
      }
    }
  }

  private resetMovement() {
    this.forward = false;
    this.backward = false;
    this.left = false;
    this.right = false;
    this.sprint = false;
    this.jump = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isEnabled) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprint = true;
        break;
      case 'Space':
        this.jump = true;
        break;
      case 'KeyE':
        this.interact = true;
        break;
      case 'KeyQ':
        this.sheriffSense = true;
        break;
      case 'KeyF':
        this.deadEye = true;
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprint = false;
        break;
      case 'Space':
        this.jump = false;
        break;
      case 'KeyE':
        this.interact = false;
        break;
      case 'KeyQ':
        this.sheriffSense = false;
        break;
      case 'KeyF':
        this.deadEye = false;
        break;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isEnabled || !this.isPointerLocked) return;
    this.mouseDeltaX += e.movementX;
    this.mouseDeltaY += e.movementY;
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private requestPointerLock = () => {
    if (this.isEnabled && !this.isPointerLocked) {
      this.canvas.requestPointerLock().catch(() => {});
    }
  };

  public consumeMouseDeltas(): { dx: number; dy: number } {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.requestPointerLock);
  }
}
