import test from 'node:test';
import assert from 'node:assert';
import { ChallengeValidator } from '../../src/sql/ChallengeValidator.ts';
import { SQL_CURRICULUM } from '../../src/sql/CurriculumManager.ts';

test('SQL Curriculum & Challenge Validation', async (t) => {
  const level0 = SQL_CURRICULUM[0];
  const level1 = SQL_CURRICULUM[1];

  await t.test('Level 0: validates SELECT * FROM citizens correctly', () => {
    const mockResult = {
      columns: ['citizen_id', 'name', 'occupation', 'status'],
      rows: [
        [1, 'Rowan Hale', 'Sheriff', 'missing'],
        [2, 'Gideon Vale', 'Mayor', 'active'],
        [3, 'Mara Voss', 'Outlaw', 'wanted']
      ],
      rowCount: 3,
      executionTimeMs: 1.2
    };

    const res = ChallengeValidator.validate('SELECT * FROM citizens;', mockResult, level0);
    assert.strictEqual(res.passed, true);
    assert.match(res.message, /LEDGER DECRYPTED/);
  });

  await t.test('Level 0: fails if querying wrong table', () => {
    const mockResult = {
      columns: ['case_number', 'title'],
      rows: [['CASE-01', 'Test']],
      rowCount: 1,
      executionTimeMs: 0.8
    };

    const res = ChallengeValidator.validate('SELECT * FROM sheriff_records;', mockResult, level0);
    assert.strictEqual(res.passed, false);
    assert.match(res.message, /does not target the citizens table/);
  });

  await t.test('Level 1: validates WHERE confidential = 1', () => {
    const mockResult = {
      columns: ['case_number', 'title', 'confidential'],
      rows: [['CASE-1891-01', 'Ironvault Ledger Discrepancies', 1]],
      rowCount: 1,
      executionTimeMs: 0.9
    };

    const res = ChallengeValidator.validate('SELECT * FROM sheriff_records WHERE confidential = 1;', mockResult, level1);
    assert.strictEqual(res.passed, true);
    assert.match(res.message, /CONFIDENTIAL ARCHIVE ACCESSED/);
  });

  await t.test('Level 2: validates Gideon Vale bank alibi query', () => {
    const level2 = SQL_CURRICULUM[2];
    const mockResult = {
      columns: ['transaction_id', 'account_name', 'amount_gold', 'authorized_by', 'timestamp'],
      rows: [[1, 'Town Hall Contingency', 2500.0, 'Gideon Vale', '1891-10-14 23:15']],
      rowCount: 1,
      executionTimeMs: 1.1
    };

    const res = ChallengeValidator.validate(
      "SELECT * FROM bank_transactions WHERE authorized_by = 'Gideon Vale' AND amount_gold >= 1000;",
      mockResult,
      level2
    );
    assert.strictEqual(res.passed, true);
    assert.match(res.message, /CONTRADICTION DISCOVERED/);
  });

  await t.test('Level 2B: validates IS NULL and LIKE pattern query', () => {
    const level3 = SQL_CURRICULUM[3];
    const mockResult = {
      columns: ['transaction_id', 'account_name', 'notes'],
      rows: [[3, 'Syndicate Reserve Account #9', null]],
      rowCount: 1,
      executionTimeMs: 0.8
    };

    const res = ChallengeValidator.validate(
      "SELECT * FROM bank_transactions WHERE notes IS NULL OR account_name LIKE '%Syndicate%';",
      mockResult,
      level3
    );
    assert.strictEqual(res.passed, true);
    assert.match(res.message, /CLANDESTINE TRANSFER EXPOSED/);
  });
});

