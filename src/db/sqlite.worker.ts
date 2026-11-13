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

-- Initial seed data for Query Creek
INSERT INTO citizens (name, occupation, status, reputation, notes) VALUES
('Rowan Hale', 'Sheriff', 'missing', 90, 'Appointed 1888. Disappeared mysteriously 3 weeks ago while investigating bank manifests.'),
('Gideon Vale', 'Mayor & Bank President', 'active', 95, 'Influential town elder. Owns majority shares in Ironvault Bank and railway spurs.'),
('Mara Voss', 'Rancher / Outlaw', 'wanted', 20, 'Accused of the Ironvault Bank robbery. Claims she was framed by town authorities.'),
('Dr. Alistair Vance', 'Town Physician', 'active', 75, 'Operates the Apothecary. Certified recent suspicious mining casualty death certificates.'),
('Silas Thorne', 'Saloon Proprietor', 'active', 60, 'Owner of The Gilded Spur Saloon. Knows all town rumors and debts.'),
('Clara Higgins', 'Telegraph Operator', 'active', 80, 'Dispatches encrypted telegrams for the mayor and railway executives.'),
('Ezekiel Cross', 'Miner Foreman', 'active', 45, 'Leads the night shifts at the Abandoned North Ridge Mine.');

INSERT INTO sheriff_records (case_number, title, investigator, date_filed, confidential, summary) VALUES
('CASE-1891-01', 'Ironvault Ledger Discrepancies', 'Rowan Hale', '1891-09-12', 1, 'Found dual accounting ledgers in bank basement vault. Large gold transfers routed to shell accounts.'),
('CASE-1891-02', 'Redrock Train Manifest Tampering', 'Rowan Hale', '1891-09-28', 1, 'Unregistered dynamite and mining equipment crates shipped under false agricultural labels.'),
('CASE-1891-03', 'Whispering Pines Midnight Disturbance', 'Rowan Hale', '1891-10-04', 0, 'Reports of lantern light and digging in the cemetery near the old family crypts.');

INSERT INTO incident_records (incident_type, location, timestamp, reported_by, suspect_description) VALUES
('Bank Robbery', 'Ironvault Bank', '1891-10-14 23:45', 'Gideon Vale', 'Rider wearing dark duster and brimmed hat, riding a black stallion westward.'),
('Theft of Telegraph Cable', 'Telegraph Office', '1891-10-12 02:15', 'Clara Higgins', 'Unidentified person cutting Western Union copper lines.'),
('Suspicious Explosion', 'North Ridge Outlaw Mine', '1891-10-15 01:30', 'Silas Thorne', 'Loud blast heard echoing through the canyon past midnight.');
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
