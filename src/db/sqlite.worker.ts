import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { WorkerRequest, WorkerResponse, QueryResult, TableSchema, TableColumn } from './types';

let db: any = null;
let sqlite3: any = null;
let storageType: 'opfs' | 'in-memory' = 'in-memory';

const INITIAL_SCHEMA_SQL = `
-- Citizen registry of Query Creek
CREATE TABLE IF NOT EXISTS citizens (
  citizen_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  occupation TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  reputation INTEGER DEFAULT 50,
  notes TEXT
);

-- Sheriff Rowan Hale's archive
CREATE TABLE IF NOT EXISTS sheriff_records (
  record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  investigator TEXT NOT NULL,
  date_filed TEXT NOT NULL,
  confidential INTEGER DEFAULT 0,
  summary TEXT
);

-- Crime and incident blotter
CREATE TABLE IF NOT EXISTS incident_records (
  incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_type TEXT NOT NULL,
  location TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  reported_by TEXT,
  suspect_description TEXT
);

-- Bank transaction ledgers of Ironvault Bank
CREATE TABLE IF NOT EXISTS bank_transactions (
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL,
  amount_gold REAL NOT NULL,
  transaction_type TEXT NOT NULL,
  authorized_by TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  notes TEXT
);

-- Saloon customer ledgers and bar tabs at The Gilded Spur
CREATE TABLE IF NOT EXISTS saloon_tabs (
  tab_id INTEGER PRIMARY KEY AUTOINCREMENT,
  patron_name TEXT NOT NULL,
  drinks_ordered INTEGER DEFAULT 1,
  total_cents INTEGER NOT NULL,
  time_in TEXT NOT NULL,
  time_out TEXT NOT NULL,
  table_location TEXT NOT NULL,
  notes TEXT
);

-- Sworn witness depositions and recorded statements
CREATE TABLE IF NOT EXISTS witness_statements (
  statement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  witness_name TEXT NOT NULL,
  interview_date TEXT NOT NULL,
  alibi_claim TEXT NOT NULL,
  official_summary TEXT NOT NULL
);

-- Initial seed data for Query Creek
INSERT OR IGNORE INTO citizens (citizen_id, name, occupation, status, reputation, notes) VALUES
(1, 'Rowan Hale', 'Sheriff', 'missing', 90, 'Appointed 1888. Disappeared mysteriously 3 weeks ago while investigating bank manifests.'),
(2, 'Gideon Vale', 'Mayor & Bank President', 'active', 95, 'Influential town elder. Owns majority shares in Ironvault Bank and railway spurs.'),
(3, 'Mara Voss', 'Rancher / Outlaw', 'wanted', 20, 'Accused of the Ironvault Bank robbery. Claims she was framed by town authorities.'),
(4, 'Dr. Alistair Vance', 'Town Physician', 'active', 75, 'Operates the Apothecary. Certified recent suspicious mining casualty death certificates.'),
(5, 'Silas Thorne', 'Saloon Proprietor', 'active', 60, 'Owner of The Gilded Spur Saloon. Knows all town rumors and debts.'),
(6, 'Clara Higgins', 'Telegraph Operator', 'active', 80, 'Dispatches encrypted telegrams for the mayor and railway executives.'),
(7, 'Ezekiel Cross', 'Miner Foreman', 'active', 45, 'Leads the night shifts at the Abandoned North Ridge Mine.');

INSERT OR IGNORE INTO sheriff_records (record_id, case_number, title, investigator, date_filed, confidential, summary) VALUES
(1, 'CASE-1891-01', 'Ironvault Ledger Discrepancies', 'Rowan Hale', '1891-09-12', 1, 'Found dual accounting ledgers in bank basement vault. Large gold transfers routed to shell accounts.'),
(2, 'CASE-1891-02', 'Redrock Train Manifest Tampering', 'Rowan Hale', '1891-09-28', 1, 'Unregistered dynamite and mining equipment crates shipped under false agricultural labels.'),
(3, 'CASE-1891-03', 'Whispering Pines Midnight Disturbance', 'Rowan Hale', '1891-10-04', 0, 'Reports of lantern light and digging in the cemetery near the old family crypts.');

INSERT OR IGNORE INTO incident_records (incident_id, incident_type, location, timestamp, reported_by, suspect_description) VALUES
(1, 'Bank Robbery', 'Ironvault Bank', '1891-10-14 23:45', 'Gideon Vale', 'Rider wearing dark duster and brimmed hat, riding a black stallion westward.'),
(2, 'Theft of Telegraph Cable', 'Telegraph Office', '1891-10-12 02:15', 'Clara Higgins', 'Unidentified person cutting Western Union copper lines.'),
(3, 'Suspicious Explosion', 'North Ridge Outlaw Mine', '1891-10-15 01:30', 'Silas Thorne', 'Loud blast heard echoing through the canyon past midnight.');

INSERT OR IGNORE INTO bank_transactions (transaction_id, account_name, amount_gold, transaction_type, authorized_by, timestamp, notes) VALUES
(1, 'Town Hall Contingency Fund', 2500.0, 'WITHDRAWAL', 'Gideon Vale', '1891-10-14 23:15', 'Emergency withdrawal preceding vault robbery'),
(2, 'Gilded Spur Operating', 145.5, 'DEPOSIT', 'Silas Thorne', '1891-10-14 18:30', 'Daily saloon cash register deposit'),
(3, 'Syndicate Reserve Account #9', 15000.0, 'TRANSFER', 'Unknown', '1891-10-14 23:30', NULL),
(4, 'Dr. Vance Apothecary Medical Supplies', 320.0, 'WITHDRAWAL', 'Dr. Alistair Vance', '1891-10-13 14:10', 'Chloral hydrate and surgical tinctures'),
(5, 'Redrock Mining Union Payroll', 4500.0, 'TRANSFER', 'Ezekiel Cross', '1891-10-11 09:00', 'Payroll transfer for North Ridge shafts'),
(6, 'Whispering Pines Cemetery Trust', 80.0, 'DEPOSIT', 'Jeremiah Pike', '1891-10-12 11:20', 'Groundkeeping donation'),
(7, 'Private Courier Retainer', 1200.0, 'WITHDRAWAL', 'Gideon Vale', '1891-10-14 22:45', 'Dispatched private riders before midnight'),
(8, 'Redrock Rail Freight Transit', 850.0, 'TRANSFER', 'Clara Higgins', '1891-10-14 16:00', 'Baggage car booking for express line');

INSERT OR IGNORE INTO saloon_tabs (tab_id, patron_name, drinks_ordered, total_cents, time_in, time_out, table_location, notes) VALUES
(1, 'Silas Thorne', 2, 40, '1891-10-14 17:00', '1891-10-15 01:00', 'Bar Counter', 'Behind the bar entire evening'),
(2, 'Ezekiel Cross', 6, 120, '1891-10-14 20:30', '1891-10-14 23:30', 'Back Booth #3', 'Drinking heavily with two armed mine guards'),
(3, 'Mara Voss', 1, 25, '1891-10-14 19:30', '1891-10-14 20:45', 'Front Porch', 'Left on horseback toward south ranch before 9 PM'),
(4, 'Dr. Alistair Vance', 1, 35, '1891-10-14 21:45', '1891-10-14 22:30', 'Piano Table', 'Quiet whiskey, appeared highly agitated'),
(5, 'Clara Higgins', 1, 15, '1891-10-14 19:00', '1891-10-14 19:40', 'Window Table', 'Purchased sarsaparilla, received encrypted dispatch');

INSERT OR IGNORE INTO witness_statements (statement_id, witness_name, interview_date, alibi_claim, official_summary) VALUES
(1, 'Gideon Vale', '1891-10-15', 'I was retired in my Town Hall residence by 9:00 PM and never went near the bank or touched the vault.', 'Claims absolute absence from Ironvault Bank during night of crime'),
(2, 'Silas Thorne', '1891-10-15', 'The saloon was full until 11 PM. Mara Voss left early around 8:45 PM. Mayor Vale visited my back room around 10:30 PM whispering about ledger audits.', 'Mentions Mayor Vale was outside Town Hall late at night'),
(3, 'Mara Voss', '1891-10-16', 'I never touched the vault. Gideon Vale framed me because Rowan Hale gave me a copy of the second ledger.', 'Alleges Vale is orchestrating the heist to wipe bank debt');
`;

async function initDatabase(): Promise<string> {
  if (db) return storageType;

  sqlite3 = await (sqlite3InitModule as any)({
    print: console.log,
    printErr: console.error,
  });

  // Attempt OPFS if available, otherwise in-memory
  if ('opfs' in sqlite3) {
    try {
      db = new sqlite3.oo1.OpfsDb('/query_creek_noir.sqlite3');
      storageType = 'opfs';
    } catch (e) {
      console.warn('OPFS unavailable, falling back to in-memory SQLite:', e);
      db = new sqlite3.oo1.DB('/query_creek_noir.sqlite3', 'c');
      storageType = 'in-memory';
    }
  } else {
    db = new sqlite3.oo1.DB('/query_creek_noir.sqlite3', 'c');
    storageType = 'in-memory';
  }

  // Seed starter tables
  db.exec(INITIAL_SCHEMA_SQL);
  console.log(`[SQLite Worker] Initialized with storage: ${storageType}`);
  return storageType;
}

function executeQuery(sql: string, maxRows: number = 200): QueryResult {
  if (!db) throw new Error('Database not initialized');

  const start = performance.now();
  const trimmed = sql.trim();

  // Basic security check: disallow destructive system commands
  const upper = trimmed.toUpperCase();
  if (upper.includes('ATTACH') || upper.includes('PRAGMA writable_schema')) {
    throw new Error('Access denied: Unauthorized database directive');
  }

  const columnNames: string[] = [];
  const rows: (string | number | boolean | null)[][] = [];

  let rowCount = 0;
  db.exec({
    sql: trimmed,
    rowMode: 'array',
    columnNames: columnNames,
    callback: (row: any[]) => {
      if (rowCount < maxRows) {
        rows.push(row);
      }
      rowCount++;
    },
  });

  const duration = performance.now() - start;
  return {
    columns: columnNames,
    rows: rows,
    rowCount: rowCount,
    executionTimeMs: Math.round(duration * 100) / 100,
  };
}

function getSchema(): TableSchema[] {
  if (!db) throw new Error('Database not initialized');

  const schemas: TableSchema[] = [];
  const tableRows: any[] = [];

  db.exec({
    sql: "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
    rowMode: 'object',
    callback: (row: any) => {
      tableRows.push(row);
    },
  });

  for (const t of tableRows) {
    const columns: TableColumn[] = [];
    db.exec({
      sql: `PRAGMA table_info("${t.name}");`,
      rowMode: 'object',
      callback: (col: any) => {
        columns.push({
          cid: col.cid,
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          dflt_value: col.dflt_value,
          pk: col.pk,
        });
      },
    });

    schemas.push({
      tableName: t.name,
      sql: t.sql,
      columns,
    });
  }

  return schemas;
}

function resetDatabase(): void {
  if (!db) throw new Error('Database not initialized');
  db.exec(`
    DROP TABLE IF EXISTS citizens;
    DROP TABLE IF EXISTS sheriff_records;
    DROP TABLE IF EXISTS incident_records;
  `);
  db.exec(INITIAL_SCHEMA_SQL);
}

// Handle Worker RPC messages
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;
  const reply = (res: Partial<WorkerResponse>) => {
    self.postMessage({ id, type, ...res });
  };

  try {
    switch (type) {
      case 'init': {
        const storage = await initDatabase();
        reply({ success: true, data: { storage } });
        break;
      }
      case 'query': {
        const result = executeQuery(payload.sql, payload.maxRows);
        reply({ success: true, data: result });
        break;
      }
      case 'getSchema': {
        const schema = getSchema();
        reply({ success: true, data: schema });
        break;
      }
      case 'reset': {
        resetDatabase();
        reply({ success: true });
        break;
      }
      default:
        reply({ success: false, error: `Unknown RPC action: ${type}` });
    }
  } catch (err: any) {
    reply({ success: false, error: err?.message || String(err) });
  }
};
