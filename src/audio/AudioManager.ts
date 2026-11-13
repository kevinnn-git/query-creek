export type AudioSurface = 'wood' | 'dirt';
export type SpellElement = 'Arcane' | 'Shock' | 'Fire' | 'Frost' | 'Physical';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;

  // Master volume nodes
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private isAmbienceRunning: boolean = false;
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private windNoiseNode: AudioBufferSourceNode | null = null;
  private pianoInterval: any = null;

  private isMuted: boolean = false;

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('[AudioManager] Web Audio not supported or blocked:', e);
    }
  }

  private resumeContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMasterVolume(volume: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    this.initContext();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setAmbienceVolume(volume: number) {
    this.initContext();
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setMusicVolume(volume: number) {
    this.initContext();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  // ==========================================
  // PROCEDURAL SOUND EFFECTS
  // ==========================================

  /**
   * Revolver firing sound with explosive noise crack and metallic chamber ring
   */
  public playRevolverShot() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // 1. Gunpowder noise burst
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);

    // 2. Low-frequency punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);

    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Player locomotion footsteps (wood hollow thud vs dirt crunch)
   */
  public playFootstep(surface: AudioSurface = 'dirt') {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'wood') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 20, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Dead-Eye activation stinger & heartbeat pulse
   */
  public playDeadEyeEnter() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.35);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  /**
   * Dead-Eye exit whoosh back to real-time
   */
  public playDeadEyeExit() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  /**
   * Arcane spell cast sound by element (Shock crackle, Fire explosion, Arcane shimmer)
   */
  public playSpellCast(element: SpellElement = 'Arcane') {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    if (element === 'Shock') {
      // Crackling high-voltage buzz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(220, t + 0.05);
      osc.frequency.setValueAtTime(1760, t + 0.1);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);
    } else if (element === 'Fire') {
      // Deep combustive roar
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    } else {
      // Shimmering harmonic chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.3, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.45);
      });
    }
  }

  /**
   * Contradiction shattered dramatic sting
   */
  public playContradictionShatter() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [220, 277.18, 329.63, 440].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.6);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  /**
   * Quest achievement / clue discovered triumph chime
   */
  public playQuestSuccess() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const chords = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.4, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.55);
    });
  }

  public playQuestTriumph() {
    this.playQuestSuccess();
  }

  /**
   * Parchment document or Grimoire page flip sound
   */
  public playPageTurn() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // ==========================================
  // PROCEDURAL FRONTIER AMBIENCE & SALOON PIANO
  // ==========================================

  public startAmbience() {
    if (this.isAmbienceRunning || this.isMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.ambienceGain) return;

    this.isAmbienceRunning = true;
    const t = this.ctx.currentTime;

    // Gentle canyon wind drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65.41, t); // C2

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(98.0, t); // G2

    droneGain.gain.setValueAtTime(0.15, t);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(this.ambienceGain);

    osc1.start(t);
    osc2.start(t);

    this.ambienceOsc1 = osc1;
    this.ambienceOsc2 = osc2;

    // Distant saloon honky-tonk piano arpeggios (procedural gentle pentatonic tones)
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    this.pianoInterval = setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted || !this.isAmbienceRunning) return;
      if (Math.random() > 0.45) {
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const pt = this.ctx.currentTime;
        const pOsc = this.ctx.createOscillator();
        const pGain = this.ctx.createGain();

        pOsc.type = 'triangle';
        pOsc.frequency.setValueAtTime(freq, pt);

        pGain.gain.setValueAtTime(0.12, pt);
        pGain.gain.exponentialRampToValueAtTime(0.001, pt + 0.8);

        pOsc.connect(pGain);
        pGain.connect(this.musicGain);

        pOsc.start(pt);
        pOsc.stop(pt + 0.85);
      }
    }, 1200);

    console.log('[AudioManager] Procedural frontier ambience and saloon piano started.');
  }

  public stopAmbience() {
    this.isAmbienceRunning = false;
    if (this.ambienceOsc1) {
      try { this.ambienceOsc1.stop(); } catch (e) {}
      this.ambienceOsc1 = null;
    }
    if (this.ambienceOsc2) {
      try { this.ambienceOsc2.stop(); } catch (e) {}
      this.ambienceOsc2 = null;
    }
    if (this.pianoInterval) {
      clearInterval(this.pianoInterval);
      this.pianoInterval = null;
    }
  }

  public dispose() {
    this.stopAmbience();
    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch (e) {}
      this.ctx = null;
    }
  }
}
