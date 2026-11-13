export class DeadEyeManager {
  private static instance: DeadEyeManager | null = null;
  public isActive: boolean = false;
  public focusMeter: number = 100.0;
  public readonly maxFocus: number = 100.0;
  public timeScale: number = 1.0;
  private readonly slowTimeScale: number = 0.15;
  private readonly drainRate: number = 18.0; // focus points per second
  private readonly rechargeRate: number = 12.0;

  public static getInstance(): DeadEyeManager {
    if (!this.instance) {
      this.instance = new DeadEyeManager();
    }
    return this.instance;
  }

  public toggle(): boolean {
    if (this.isActive) {
      this.deactivate();
    } else if (this.focusMeter > 15.0) {
      this.activate();
    }
    return this.isActive;
  }

  public activate() {
    if (this.focusMeter < 15.0) return;
    this.isActive = true;
    this.timeScale = this.slowTimeScale;
  }

  public deactivate() {
    this.isActive = false;
    this.timeScale = 1.0;
  }

  public update(deltaTime: number): {
    isActive: boolean;
    timeScale: number;
    focusMeter: number;
  } {
    if (this.isActive) {
      // Drain focus
      this.focusMeter = Math.max(0, this.focusMeter - this.drainRate * deltaTime);
      if (this.focusMeter <= 0) {
        this.deactivate();
      }
    } else {
      // Recharge focus
      this.focusMeter = Math.min(this.maxFocus, this.focusMeter + this.rechargeRate * deltaTime);
    }

    return {
      isActive: this.isActive,
      timeScale: this.timeScale,
      focusMeter: this.focusMeter,
    };
  }
}
