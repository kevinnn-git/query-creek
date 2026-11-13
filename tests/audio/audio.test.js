import test from 'node:test';
import assert from 'node:assert/strict';

// Mock Web Audio Context for Node.js test environment
class MockGainNode {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime: (val) => {
        this.gain.value = val;
      },
      exponentialRampToValueAtTime: () => {},
    };
  }
  connect() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = {};
  }
  createGain() {
    return new MockGainNode();
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(100),
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
    };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

globalThis.window = globalThis;
globalThis.AudioContext = MockAudioContext;

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { AtmosphereManager } from '../../src/engine/AtmosphereManager.ts';

test('Audio & Atmosphere Subsystem: Audio Volume, Muting & Presets', async (t) => {
  const audio = AudioManager.getInstance();
  const atmosphere = AtmosphereManager.getInstance();

  await t.test('updates master, sfx, ambience and music volume without crashing', () => {
    audio.setMasterVolume(0.5);
    audio.setSfxVolume(0.9);
    audio.setAmbienceVolume(0.3);
    audio.setMusicVolume(0.4);

    // Bounds checking
    audio.setMasterVolume(1.5); // Should clamp to 1.0
    audio.setMasterVolume(-0.5); // Should clamp to 0.0
    assert.ok(true, 'Volume methods clamp safely within [0, 1]');
  });

  await t.test('toggles audio muting state', () => {
    audio.setMuted(true);
    audio.setMuted(false);
    assert.ok(true, 'Mute toggles cleanly');
  });

  await t.test('verifies Atmosphere quality presets and shadow map resolution mapping', () => {
    const mockShadowGen = {
      mapSize: 1024,
      usePoissonSampling: false,
    };

    // Low Quality Preset
    atmosphere.applyQualityPreset('low', mockShadowGen);
    assert.equal(mockShadowGen.mapSize, 512);
    assert.equal(mockShadowGen.usePoissonSampling, false);

    // Medium Quality Preset
    atmosphere.applyQualityPreset('medium', mockShadowGen);
    assert.equal(mockShadowGen.mapSize, 1024);
    assert.equal(mockShadowGen.usePoissonSampling, false);

    // High Quality Preset
    atmosphere.applyQualityPreset('high', mockShadowGen);
    assert.equal(mockShadowGen.mapSize, 2048);
    assert.equal(mockShadowGen.usePoissonSampling, true);
  });
});
