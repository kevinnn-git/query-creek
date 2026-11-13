import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from '@babylonjs/core';
import { QUERY_CREEK_DISTRICTS, DistrictManager } from '../../src/world/Districts.ts';

test('World Districts Subsystem: Geographic Bounds & Unlocking', async (t) => {
  const districtManager = DistrictManager.getInstance();

  await t.test('verifies all 8 canonical districts exist and have valid coordinates', () => {
    assert.equal(QUERY_CREEK_DISTRICTS.length, 8);
    
    const districtIds = QUERY_CREEK_DISTRICTS.map((d) => d.id);
    assert.ok(districtIds.includes('sheriff_office'));
    assert.ok(districtIds.includes('saloon'));
    assert.ok(districtIds.includes('bank'));
    assert.ok(districtIds.includes('telegraph'));
    assert.ok(districtIds.includes('apothecary'));
    assert.ok(districtIds.includes('train_depot'));
    assert.ok(districtIds.includes('cemetery'));
    assert.ok(districtIds.includes('abandoned_mine'));

    for (const d of QUERY_CREEK_DISTRICTS) {
      assert.ok(typeof d.center.x === 'number');
      assert.ok(typeof d.center.z === 'number');
      assert.ok(d.radius > 0);
      assert.ok(d.pointsOfInterest.length > 0);
    }
  });

  await t.test('evaluates progressive district unlocking by chapter', () => {
    // Chapter 1: Town Center (Sheriff Office, Saloon, Bank)
    assert.equal(districtManager.isDistrictUnlocked('sheriff_office', 1), true);
    assert.equal(districtManager.isDistrictUnlocked('saloon', 1), true);
    assert.equal(districtManager.isDistrictUnlocked('bank', 1), true);
    assert.equal(districtManager.isDistrictUnlocked('telegraph', 1), false);
    assert.equal(districtManager.isDistrictUnlocked('abandoned_mine', 1), false);

    // Chapter 2: Telegraph & Apothecary unlock
    assert.equal(districtManager.isDistrictUnlocked('telegraph', 2), true);
    assert.equal(districtManager.isDistrictUnlocked('apothecary', 2), true);
    assert.equal(districtManager.isDistrictUnlocked('train_depot', 2), false);

    // Chapter 3: Train Depot & Cemetery unlock
    assert.equal(districtManager.isDistrictUnlocked('train_depot', 3), true);
    assert.equal(districtManager.isDistrictUnlocked('cemetery', 3), true);
    assert.equal(districtManager.isDistrictUnlocked('abandoned_mine', 3), false);

    // Chapter 4+: Abandoned Mine fortress unlocks
    assert.equal(districtManager.isDistrictUnlocked('abandoned_mine', 4), true);
    assert.equal(districtManager.isDistrictUnlocked('abandoned_mine', 5), true);
  });

  await t.test('tracks player position and detects nearest district boundary', () => {
    // Position at Sheriff Office
    const pos1 = new Vector3(-14, 0, -4);
    const result1 = districtManager.updatePlayerPosition(pos1, 1);
    assert.equal(result1.currentDistrict.id, 'sheriff_office');
    assert.equal(result1.isInsideLockedDistrict, false);

    // Position at Abandoned Mine while still in Chapter 1
    const posMine = new Vector3(36, 0, -34);
    const resultMine = districtManager.updatePlayerPosition(posMine, 1);
    assert.equal(resultMine.currentDistrict.id, 'abandoned_mine');
    assert.equal(resultMine.isInsideLockedDistrict, true);

    // Position at Abandoned Mine in Chapter 4
    const resultMineCh4 = districtManager.updatePlayerPosition(posMine, 4);
    assert.equal(resultMineCh4.isInsideLockedDistrict, false);
  });
});
