import test from 'node:test';
import assert from 'node:assert';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

test('SQLite WASM Database Integration & Schema Integrity', async (t) => {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB(':memory:', 'c');

  await t.test('seeds canonical tables and data', () => {
    db.exec(`
      CREATE TABLE citizens (
        citizen_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        occupation TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        reputation INTEGER DEFAULT 50,
        notes TEXT
      );

      CREATE TABLE sheriff_records (
        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        investigator TEXT NOT NULL,
        date_filed TEXT NOT NULL,
        confidential INTEGER DEFAULT 0,
        summary TEXT
      );

      CREATE TABLE incident_records (
        incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_type TEXT NOT NULL,
        location TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        reported_by TEXT,
        suspect_description TEXT
      );

      INSERT INTO citizens (name, occupation, status) VALUES
      ('Rowan Hale', 'Sheriff', 'missing'),
      ('Gideon Vale', 'Mayor & Bank President', 'active'),
      ('Mara Voss', 'Rancher / Outlaw', 'wanted'),
      ('Dr. Alistair Vance', 'Town Physician', 'active');

      INSERT INTO sheriff_records (case_number, title, investigator, date_filed, confidential) VALUES
      ('CASE-1891-01', 'Ironvault Ledger Discrepancies', 'Rowan Hale', '1891-09-12', 1),
      ('CASE-1891-02', 'Redrock Train Manifest Tampering', 'Rowan Hale', '1891-09-28', 1);
    `);

    // Verify row counts
    const citizenCount = db.selectValue('SELECT count(*) FROM citizens;');
    assert.strictEqual(citizenCount, 4, 'Should have 4 citizens');

    const missingSheriff = db.selectValue("SELECT name FROM citizens WHERE status = 'missing';");
    assert.strictEqual(missingSheriff, 'Rowan Hale', 'Missing sheriff should be Rowan Hale');

    const confidentialCases = db.selectValue('SELECT count(*) FROM sheriff_records WHERE confidential = 1;');
    assert.strictEqual(confidentialCases, 2, 'Should have 2 confidential cases');
  });

  db.close();
});
