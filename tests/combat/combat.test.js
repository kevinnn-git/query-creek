import test from 'node:test';
import assert from 'node:assert';
import { Vector3 } from '@babylonjs/core';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { EnemyAI } from '../../src/combat/EnemyAI.ts';
import { DeadEyeManager } from '../../src/combat/DeadEyeManager.ts';

test('Combat Subsystem: Enemy AI & Elemental Weaknesses', async (t) => {
  const initialData = {
    id: 1,
    name: 'Syndicate Enforcer Vance',
    archetype: 'Enforcer',
    hp: 100,
    maxHp: 100,
    element: 'Physical',
    weakness: 'Shock',
    state: 'PATROL',
    position: new Vector3(0, 0, 10),
    rotationY: 0,
    patrolWaypoints: [new Vector3(0, 0, 10), new Vector3(0, 0, 20)],
    currentWaypointIndex: 0,
    detectionLevel: 0,
    attackCooldown: 1.0,
    stunTimer: 0,
  };

  await t.test('detects nearby player and enters CHASE', () => {
    const ai = new EnemyAI(initialData);
    const playerPos = new Vector3(0, 0, 24); // 14 meters away (inside 18m perception range, outside 10m attack range)

    // Update with 2 seconds of detection
    ai.update(2.0, playerPos, 1.0);
    assert.strictEqual(ai.data.state, 'CHASE', 'Enemy should enter CHASE when player is detected');
  });

  await t.test('enters ATTACK when within range and fires projectile on cooldown', () => {
    const ai = new EnemyAI(initialData);
    ai.data.state = 'ATTACK';
    ai.data.attackCooldown = 0;
    const playerPos = new Vector3(0, 0, 14); // 4 meters away (inside 10m attack range)

    const action = ai.update(0.1, playerPos, 1.0);
    assert.strictEqual(ai.data.state, 'ATTACK', 'Should remain in ATTACK state');
    assert.strictEqual(action.shouldSpawnProjectile, true, 'Should fire projectile when cooldown is ready');
    assert.ok(ai.data.attackCooldown > 0, 'Attack cooldown should reset');
  });

  await t.test('exploits elemental weakness with 2x damage and STUNNED status', () => {
    const ai = new EnemyAI(initialData);
    const damageResult = ai.takeDamage(40, 'Shock'); // Weakness is Shock

    assert.strictEqual(damageResult.wasWeakness, true, 'Should identify elemental weakness');
    assert.strictEqual(damageResult.actualDamage, 80, 'Should deal 2x damage multiplier (80 instead of 40)');
    assert.strictEqual(ai.data.hp, 20, 'HP should be reduced to 20');
    assert.strictEqual(ai.data.state, 'STUNNED', 'Enemy should be stunned by elemental weakness');
    assert.ok(ai.data.stunTimer > 0, 'Stun timer should be active');
  });

  await t.test('transitions to DEFEATED upon fatal damage', () => {
    const ai = new EnemyAI(initialData);
    ai.data.hp = 20;

    const damageResult = ai.takeDamage(30, 'Physical');
    assert.strictEqual(damageResult.isFatal, true, 'Should register fatal damage');
    assert.strictEqual(ai.data.hp, 0, 'HP should bottom out at 0');
    assert.strictEqual(ai.data.state, 'DEFEATED', 'State should be DEFEATED');
  });
});

test('Combat Subsystem: Dead-Eye Slow-Motion Time Dilation', async (t) => {
  const de = DeadEyeManager.getInstance();

  await t.test('activates time dilation to 0.15x', () => {
    de.focusMeter = 100;
    de.activate();
    assert.strictEqual(de.isActive, true);
    assert.strictEqual(de.timeScale, 0.15, 'Time scale should slow to 0.15 during Dead-Eye');
  });

  await t.test('drains focus meter while active and restores 1.0x on deactivation', () => {
    de.update(1.0); // 1 second
    assert.ok(de.focusMeter < 100, 'Focus meter should drain while Dead-Eye is active');

    de.deactivate();
    assert.strictEqual(de.isActive, false);
    assert.strictEqual(de.timeScale, 1.0, 'Time scale should return to 1.0 when Dead-Eye ends');
  });
});

test('Combat Subsystem: SQLite WASM Tactical Spells & Enemy Weakness JOINs', async (t) => {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB(':memory:', 'c');

  db.exec(`
    CREATE TABLE powers (
      power_id INTEGER PRIMARY KEY,
      spell_name TEXT NOT NULL,
      element TEXT NOT NULL,
      damage INTEGER NOT NULL,
      mana_cost INTEGER NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE active_enemies (
      enemy_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      archetype TEXT NOT NULL,
      hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      element TEXT NOT NULL,
      weakness TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    );

    INSERT INTO powers (power_id, spell_name, element, damage, mana_cost, description) VALUES
    (1, 'Arcane Deadeye Volley', 'Arcane', 45, 15, 'Homing bullets'),
    (2, 'Frontier Thunderstrike', 'Shock', 65, 25, 'Lightning burst'),
    (3, 'Hellfire Powder Keg', 'Fire', 80, 35, 'Explosive combustive flame');

    INSERT INTO active_enemies (enemy_id, name, archetype, hp, max_hp, element, weakness, status) VALUES
    (1, 'Syndicate Enforcer Vance', 'Enforcer', 100, 100, 'Physical', 'Shock', 'active'),
    (2, 'Outlaw Rifleman Jesse', 'Rifleman', 75, 75, 'Physical', 'Fire', 'active'),
    (3, 'Ironclad Guard Bronn', 'Brawler', 150, 150, 'Iron', 'Shock', 'active');
  `);

  await t.test('queries Shock elemental power from powers table', () => {
    const spellName = db.selectValue("SELECT spell_name FROM powers WHERE element = 'Shock';");
    assert.strictEqual(spellName, 'Frontier Thunderstrike');
  });

  await t.test('executes tactical JOIN query matching spells against enemy weaknesses', () => {
    const rows = [];
    db.exec({
      sql: `
        SELECT p.spell_name, e.enemy_id, p.damage * 2 AS tactical_damage
        FROM powers p
        JOIN active_enemies e ON p.element = e.weakness
        WHERE e.hp > 0
        ORDER BY e.enemy_id ASC;
      `,
      rowMode: 'array',
      callback: (row) => rows.push(row),
    });

    assert.strictEqual(rows.length, 3, 'Should find 3 tactical weakness matches');
    assert.strictEqual(rows[0][0], 'Frontier Thunderstrike', 'First match should be Thunderstrike for Enforcer Vance');
    assert.strictEqual(rows[0][1], 1, 'Target should be enemy_id 1');
    assert.strictEqual(rows[0][2], 130, 'Tactical damage should be 2x (130)');

    assert.strictEqual(rows[1][0], 'Hellfire Powder Keg', 'Second match should be Hellfire for Rifleman Jesse');
    assert.strictEqual(rows[1][1], 2, 'Target should be enemy_id 2');
  });
});
