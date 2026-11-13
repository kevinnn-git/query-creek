import test from 'node:test';
import assert from 'node:assert/strict';
import { ChallengeValidator } from '../../src/sql/ChallengeValidator.ts';
import { SQL_CURRICULUM } from '../../src/sql/CurriculumManager.ts';

test('Advanced SQL Curriculum & Semantic Validation (Levels 4 to 9)', async (t) => {
  const level4 = SQL_CURRICULUM.find((c) => c.id === 'level_4_relational_accounts');
  const level5 = SQL_CURRICULUM.find((c) => c.id === 'level_5_forensic_aggregation');
  const level6 = SQL_CURRICULUM.find((c) => c.id === 'level_6_subquery_veil');
  const level7 = SQL_CURRICULUM.find((c) => c.id === 'level_7_manifest_reconciliation');
  const level8 = SQL_CURRICULUM.find((c) => c.id === 'level_8_cte_window_audit');
  const level9 = SQL_CURRICULUM.find((c) => c.id === 'level_9_json_boss_cipher');

  assert.ok(level4, 'Level 4 must exist');
  assert.ok(level5, 'Level 5 must exist');
  assert.ok(level6, 'Level 6 must exist');
  assert.ok(level7, 'Level 7 must exist');
  assert.ok(level8, 'Level 8 must exist');
  assert.ok(level9, 'Level 9 must exist');

  await t.test('Level 4: validates INNER JOIN between bank_accounts and citizens', () => {
    const mockResult = {
      columns: ['name', 'account_number', 'balance_gold', 'tier'],
      rows: [['Gideon Vale', 'ACT-1001-VALE', 84500.0, 'platinum']],
      rowCount: 1,
      executionTimeMs: 1.5,
    };

    const validQuery =
      'SELECT c.name, a.account_number, a.balance_gold, a.tier FROM bank_accounts a JOIN citizens c ON a.citizen_id = c.citizen_id;';
    const res = ChallengeValidator.validate(validQuery, mockResult, level4);
    assert.equal(res.passed, true);
    assert.match(res.message, /ACCOUNTS UNMASKED/);

    const invalidQuery = 'SELECT * FROM bank_accounts;';
    const invalidRes = ChallengeValidator.validate(invalidQuery, mockResult, level4);
    assert.equal(invalidRes.passed, false);
    assert.match(invalidRes.message, /does not join bank_accounts with citizens/);
  });

  await t.test('Level 5: validates GROUP BY and HAVING with SUM aggregation', () => {
    const mockResult = {
      columns: ['authorized_by', 'total_gold', 'txn_count'],
      rows: [
        ['Gideon Vale', 3700.0, 2],
        ['Unknown', 15000.0, 1],
      ],
      rowCount: 2,
      executionTimeMs: 2.1,
    };

    const validQuery =
      'SELECT authorized_by, SUM(amount_gold) as total_gold, COUNT(*) as txn_count FROM bank_transactions GROUP BY authorized_by HAVING SUM(amount_gold) > 2000;';
    const res = ChallengeValidator.validate(validQuery, mockResult, level5);
    assert.equal(res.passed, true);
    assert.match(res.message, /LAUNDERING VOLUMES REVEALED/);

    const missingGroup =
      'SELECT authorized_by, SUM(amount_gold) FROM bank_transactions WHERE amount_gold > 2000;';
    const invalidRes = ChallengeValidator.validate(missingGroup, mockResult, level5);
    assert.equal(invalidRes.passed, false);
    assert.match(invalidRes.message, /does not aggregate by authorized authority/);
  });

  await t.test('Level 6: validates Subqueries and CASE WHEN classification', () => {
    const mockResult = {
      columns: ['transaction_id', 'account_name', 'amount_gold', 'classification'],
      rows: [[3, 'Syndicate Reserve Account #9', 15000.0, 'CRITICAL_LAUNDERING']],
      rowCount: 1,
      executionTimeMs: 1.8,
    };

    const validQuery =
      'SELECT transaction_id, account_name, amount_gold, CASE WHEN amount_gold >= 5000 THEN "CRITICAL_LAUNDERING" ELSE "ROUTINE" END as classification FROM bank_transactions WHERE account_name NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL);';
    const res = ChallengeValidator.validate(validQuery, mockResult, level6);
    assert.equal(res.passed, true);
    assert.match(res.message, /SHELL PIPELINE CONFIRMED/);
  });

  await t.test('Level 7: validates correlated subquery with EXISTS and weight discrepancy', () => {
    const mockResult = {
      columns: ['manifest_id', 'train_number', 'actual_weight_lbs', 'contraband_flags'],
      rows: [[2, 'TRAIN-FREIGHT-402', 34200, 'CONCEALED_GOLD_BULLION_SAFES']],
      rowCount: 1,
      executionTimeMs: 1.4,
    };

    const validQuery =
      'SELECT manifest_id, train_number, cargo_type, actual_weight_lbs FROM train_cargo_manifests WHERE actual_weight_lbs > declared_weight_lbs AND EXISTS (SELECT 1 FROM telegraph_dispatches WHERE priority = "CRITICAL");';
    const res = ChallengeValidator.validate(validQuery, mockResult, level7);
    assert.equal(res.passed, true);
    assert.match(res.message, /CONTRABAND SHIPMENT UNCOVERED/);
  });

  await t.test('Level 8: validates Common Table Expressions (WITH) and Window Functions (ROW_NUMBER)', () => {
    const mockResult = {
      columns: ['sequence_step', 'timestamp', 'account_name', 'amount_gold', 'authorized_by'],
      rows: [
        [1, '1891-10-14 18:30', 'Gilded Spur Operating', 145.5, 'Silas Thorne'],
        [2, '1891-10-14 22:45', 'Private Courier Retainer', 1200.0, 'Gideon Vale'],
      ],
      rowCount: 2,
      executionTimeMs: 2.3,
    };

    const validQuery =
      'WITH robbery_timeline AS (SELECT transaction_id, account_name, amount_gold, timestamp, authorized_by, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as sequence_step FROM bank_transactions WHERE timestamp LIKE "1891-10-14%") SELECT * FROM robbery_timeline;';
    const res = ChallengeValidator.validate(validQuery, mockResult, level8);
    assert.equal(res.passed, true);
    assert.match(res.message, /CONSPIRACY TIMELINE PROVED/);
  });

  await t.test('Level 9: validates json_extract() parsing for Mayor Gideon Vale boss shield cipher', () => {
    const mockResult = {
      columns: ['shield_layer', 'layer_name', 'overload_element', 'frequency_code'],
      rows: [
        [1, 'Aegis of the Ironvault', 'Shock', 440],
        [2, 'Infernal Powder Barrier', 'Fire', 587],
        [3, 'Syndicate Arcane Core', 'Arcane', 880],
      ],
      rowCount: 3,
      executionTimeMs: 1.9,
    };

    const validQuery =
      'SELECT shield_layer, layer_name, json_extract(cipher_key_json, "$.overload_element") as overload_element, json_extract(cipher_key_json, "$.harmonic_code") as frequency_code FROM boss_shields ORDER BY rotation_sequence ASC;';
    const res = ChallengeValidator.validate(validQuery, mockResult, level9);
    assert.equal(res.passed, true);
    assert.match(res.message, /ARCANE SHIELD CIPHER DECIPHERED/);
  });
});

