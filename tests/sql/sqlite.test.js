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

  await t.test('verifies Phase 2 bank, saloon, and witness evidence tables', () => {
    db.exec(`
      CREATE TABLE bank_transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_name TEXT NOT NULL,
        amount_gold REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        authorized_by TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE saloon_tabs (
        tab_id INTEGER PRIMARY KEY AUTOINCREMENT,
        patron_name TEXT NOT NULL,
        drinks_ordered INTEGER DEFAULT 1,
        total_cents INTEGER NOT NULL,
        time_in TEXT NOT NULL,
        time_out TEXT NOT NULL,
        table_location TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE witness_statements (
        statement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        witness_name TEXT NOT NULL,
        interview_date TEXT NOT NULL,
        alibi_claim TEXT NOT NULL,
        official_summary TEXT NOT NULL
      );

      INSERT INTO bank_transactions (account_name, amount_gold, transaction_type, authorized_by, timestamp, notes) VALUES
      ('Town Hall Contingency', 2500.0, 'WITHDRAWAL', 'Gideon Vale', '1891-10-14 23:15', 'Emergency withdrawal preceding vault robbery'),
      ('Syndicate Reserve', 15000.0, 'TRANSFER', 'Unknown', '1891-10-14 23:30', NULL);

      INSERT INTO saloon_tabs (patron_name, drinks_ordered, total_cents, time_in, time_out, table_location, notes) VALUES
      ('Mara Voss', 1, 25, '1891-10-14 19:30', '1891-10-14 20:45', 'Front Porch', 'Left on horseback toward south ranch before 9 PM');

      INSERT INTO witness_statements (witness_name, interview_date, alibi_claim, official_summary) VALUES
      ('Gideon Vale', '1891-10-15', 'I was retired in my Town Hall residence by 9:00 PM', 'Claims absolute absence');
    `);

    // Verify Vale contradiction query
    const valeLateWithdrawals = db.selectValue(`
      SELECT count(*) FROM bank_transactions
      WHERE authorized_by = 'Gideon Vale'
        AND timestamp > '1891-10-14 21:00';
    `);
    assert.strictEqual(valeLateWithdrawals, 1, 'Should find 1 late withdrawal authorized by Vale');

    // Verify Mara Voss alibi departure time
    const vossDeparture = db.selectValue(`
      SELECT time_out FROM saloon_tabs WHERE patron_name = 'Mara Voss';
    `);
    assert.strictEqual(vossDeparture, '1891-10-14 20:45', 'Mara Voss departed before 9 PM');

    // Verify IS NULL check
    const nullNotesCount = db.selectValue(`
      SELECT count(*) FROM bank_transactions WHERE notes IS NULL;
    `);
    assert.strictEqual(nullNotesCount, 1, 'Should find 1 transaction with NULL notes');
  });

  db.close();
});

