import test from 'node:test';
import assert from 'node:assert/strict';

// Setup Mock Browser Storage for Node.js test environment
const mockStorage = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) ?? null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (i) => Array.from(mockStorage.keys())[i] ?? null,
};

import { SaveManager } from '../../src/save/SaveManager.ts';

test('Save & Load Subsystem: State Serialization & Persistence', async (t) => {
  const saveManager = SaveManager.getInstance();

  // Mock Game State Container
  let mockGameState = {
    chapterNumber: 1,
    currentChapter: 'Chapter 1: The Vanished Ledger',
    currentObjective: 'Investigate the Sheriff’s Office.',
    curriculumLevel: 0,
    unlockedDistricts: ['sheriff_office', 'saloon', 'bank'],
    playerHealth: 100,
    playerMaxHealth: 100,
    playerMana: 100,
    playerMaxMana: 100,
    evidenceList: [],
    corkboardPins: [],
    corkboardLinks: [],
    solvedContradictions: [],
    queryHistory: [],
  };

  saveManager.setStateProvider({
    getState: () => ({ ...mockGameState }),
    restoreState: (data) => {
      mockGameState = {
        chapterNumber: data.chapterNumber,
        currentChapter: data.currentChapter,
        currentObjective: data.currentObjective,
        curriculumLevel: data.curriculumLevel,
        unlockedDistricts: data.unlockedDistricts,
        playerHealth: data.playerHealth,
        playerMaxHealth: data.playerMaxHealth,
        playerMana: data.playerMana,
        playerMaxMana: data.playerMaxMana,
        evidenceList: data.evidenceList,
        corkboardPins: data.corkboardPins,
        corkboardLinks: data.corkboardLinks,
        solvedContradictions: data.solvedContradictions,
        queryHistory: data.queryHistory,
      };
    },
    showNotification: () => {},
  });

  t.beforeEach(() => {
    mockStorage.clear();
  });

  await t.test('saves current game state with complete frontier metadata', () => {
    mockGameState.chapterNumber = 3;
    mockGameState.currentChapter = 'Chapter 3: The Broken Manifest';
    mockGameState.currentObjective = 'Examine train shipments at Redrock Train Depot.';
    mockGameState.curriculumLevel = 5;
    mockGameState.playerHealth = 85;
    mockGameState.playerMana = 70;

    const saved = saveManager.saveGame('slot_1', 'Manual Slot 1');
    assert.ok(saved, 'Save data should not be null');
    assert.equal(saved.slotId, 'slot_1');
    assert.equal(saved.slotName, 'Manual Slot 1');
    assert.equal(saved.chapterNumber, 3);
    assert.equal(saved.currentChapter, 'Chapter 3: The Broken Manifest');
    assert.equal(saved.playerHealth, 85);
    assert.equal(saved.playerMana, 70);

    // Verify localStorage key format
    assert.equal(mockStorage.has('qc_save_slot_1'), true);
  });

  await t.test('creates auto-save checkpoint with formatted title', () => {
    mockGameState.chapterNumber = 5;
    mockGameState.currentChapter = 'Chapter 5: The Final Audit at Sunken Mine';
    mockGameState.currentObjective = 'Confront Mayor Gideon Vale at the Sunken Mine.';

    const checkpoint = saveManager.autoSaveCheckpoint('Boss Encounter Entrance');
    assert.ok(checkpoint);
    assert.equal(checkpoint.slotId, 'autosave');
    assert.equal(checkpoint.slotName, 'Auto-Checkpoint: Boss Encounter Entrance');
    assert.equal(mockStorage.has('qc_save_autosave'), true);
  });

  await t.test('loads saved state and restores store values', () => {
    // 1. Seed custom save
    mockGameState.chapterNumber = 2;
    mockGameState.currentChapter = 'Chapter 2: The Saloon Shadows';
    mockGameState.currentObjective = 'Interrogate Silas Thorne.';
    mockGameState.curriculumLevel = 3;
    mockGameState.playerHealth = 50;
    mockGameState.playerMana = 40;
    saveManager.saveGame('slot_restore', 'Restore Test Slot');

    // 2. Tamper store state
    mockGameState.chapterNumber = 1;
    mockGameState.currentChapter = 'Altered Chapter';
    mockGameState.currentObjective = 'Altered Objective';
    mockGameState.playerHealth = 10;
    mockGameState.playerMana = 10;

    // 3. Load from saved slot
    const success = saveManager.loadGame('slot_restore');
    assert.equal(success, true);

    assert.equal(mockGameState.chapterNumber, 2);
    assert.equal(mockGameState.currentChapter, 'Chapter 2: The Saloon Shadows');
    assert.equal(mockGameState.playerHealth, 50);
    assert.equal(mockGameState.playerMana, 40);
  });

  await t.test('retrieves saved slots sorted chronologically', () => {
    saveManager.saveGame('slot_alpha', 'Alpha Save');
    saveManager.saveGame('slot_beta', 'Beta Save');

    const slots = saveManager.getSavedSlots();
    assert.ok(slots.length >= 2);
    const slotIds = slots.map((s) => s.slotId);
    assert.ok(slotIds.includes('slot_alpha'));
    assert.ok(slotIds.includes('slot_beta'));
  });

  await t.test('deletes existing save slot cleanly', () => {
    saveManager.saveGame('slot_to_delete', 'Temporary Slot');
    assert.equal(mockStorage.has('qc_save_slot_to_delete'), true);

    const deleted = saveManager.deleteSave('slot_to_delete');
    assert.equal(deleted, true);
    assert.equal(mockStorage.has('qc_save_slot_to_delete'), false);
  });
});
