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

-- Bank accounts at Ironvault Bank
CREATE TABLE IF NOT EXISTS bank_accounts (
  account_id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id INTEGER,
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance_gold REAL NOT NULL,
  tier TEXT DEFAULT 'standard',
  created_date TEXT NOT NULL,
  is_frozen INTEGER DEFAULT 0,
  FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

-- Telegraph dispatches through Western Union station
CREATE TABLE IF NOT EXISTS telegraph_dispatches (
  dispatch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL,
  encoded_cipher TEXT NOT NULL,
  decrypted_message TEXT NOT NULL,
  priority TEXT DEFAULT 'routine',
  timestamp TEXT NOT NULL
);

-- Apothecary medical and forensic examination reports
CREATE TABLE IF NOT EXISTS medical_examinations (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deceased_name TEXT NOT NULL,
  examiner TEXT NOT NULL,
  cause_of_death TEXT NOT NULL,
  toxicology_notes TEXT,
  date_recorded TEXT NOT NULL,
  is_tampered INTEGER DEFAULT 0
);

-- Redrock Train Depot cargo shipping manifests
CREATE TABLE IF NOT EXISTS train_cargo_manifests (
  manifest_id INTEGER PRIMARY KEY AUTOINCREMENT,
  train_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  declared_weight_lbs INTEGER NOT NULL,
  actual_weight_lbs INTEGER NOT NULL,
  contraband_flags TEXT,
  shipment_date TEXT NOT NULL
);

-- Whispering Pines Cemetery plot register
CREATE TABLE IF NOT EXISTS cemetery_plots (
  plot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deceased_name TEXT NOT NULL,
  burial_date TEXT NOT NULL,
  grave_status TEXT NOT NULL,
  inscribed_epitaph TEXT,
  depth_feet REAL NOT NULL
);

-- The Syndicate Master Ledger (Rowan Hale's recovery target)
CREATE TABLE IF NOT EXISTS syndicate_ledger (
  ledger_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias TEXT NOT NULL,
  real_name TEXT NOT NULL,
  syndicate_role TEXT NOT NULL,
  cut_percentage REAL NOT NULL,
  payout_total_gold REAL NOT NULL,
  tier_level INTEGER NOT NULL
);

-- Boss Arcane Shield Layers (Mayor Gideon Vale's boss barrier)
CREATE TABLE IF NOT EXISTS boss_shields (
  shield_layer INTEGER PRIMARY KEY,
  layer_name TEXT NOT NULL,
  frequency_hz INTEGER NOT NULL,
  energy_hp INTEGER NOT NULL,
  vulnerability_element TEXT NOT NULL,
  cipher_key_json TEXT NOT NULL,
  rotation_sequence INTEGER NOT NULL
);

-- Arcane Spells & Combat Powers
CREATE TABLE IF NOT EXISTS powers (
  power_id INTEGER PRIMARY KEY AUTOINCREMENT,
  spell_name TEXT NOT NULL,
  element TEXT NOT NULL,
  damage INTEGER NOT NULL,
  mana_cost INTEGER NOT NULL,
  description TEXT NOT NULL
);

-- Active Combat Enemies (dynamically synced with engine simulation)
CREATE TABLE IF NOT EXISTS active_enemies (
  enemy_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  element TEXT NOT NULL,
  weakness TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Enemy Elemental Weakness Reference
CREATE TABLE IF NOT EXISTS enemy_weaknesses (
  enemy_type TEXT PRIMARY KEY,
  weakness_element TEXT NOT NULL,
  damage_multiplier REAL DEFAULT 2.0,
  tactical_notes TEXT
);

-- Spell Status Effects
CREATE TABLE IF NOT EXISTS spell_effects (
  effect_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  element TEXT NOT NULL,
  status_inflicted TEXT NOT NULL,
  duration_sec REAL NOT NULL
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

INSERT OR IGNORE INTO powers (power_id, spell_name, element, damage, mana_cost, description) VALUES
(1, 'Arcane Deadeye Volley', 'Arcane', 45, 15, 'Homing arcane bullets seeking enemy weakpoints.'),
(2, 'Frontier Thunderstrike', 'Shock', 65, 25, 'High-voltage lightning burst that stuns mechanical and ironclad armor.'),
(3, 'Hellfire Powder Keg', 'Fire', 80, 35, 'Explosive combustive flame causing massive area burn damage.'),
(4, 'Glacial Frost Ward', 'Frost', 40, 20, 'Freezing shards that shatter enemy shields and slow movement.');

INSERT OR IGNORE INTO active_enemies (enemy_id, name, archetype, hp, max_hp, element, weakness, status) VALUES
(1, 'Syndicate Enforcer Vance', 'Enforcer', 100, 100, 'Physical', 'Shock', 'active'),
(2, 'Outlaw Rifleman Jesse', 'Rifleman', 75, 75, 'Physical', 'Fire', 'active'),
(3, 'Ironclad Guard Bronn', 'Brawler', 150, 150, 'Iron', 'Shock', 'active');

INSERT OR IGNORE INTO enemy_weaknesses (enemy_type, weakness_element, damage_multiplier, tactical_notes) VALUES
('Enforcer', 'Shock', 2.0, 'Heavy iron breastplate conducts electrical arcs, causing immediate stun.'),
('Rifleman', 'Fire', 2.0, 'Carries dry gunpowder bandoliers susceptible to ignition.'),
('Brawler', 'Shock', 2.5, 'Reinforced hydraulic mining prosthetics fail under electrical current.');

INSERT OR IGNORE INTO spell_effects (effect_id, name, element, status_inflicted, duration_sec) VALUES
(1, 'Electrocuted', 'Shock', 'STUNNED', 3.0),
(2, 'Ignited', 'Fire', 'BURNING', 4.5),
(3, 'Frozen', 'Frost', 'SLOWED', 4.0);

-- Phase 4: Extended Relational Bank, Telegraph, Medical, Depot, and Syndicate Records
INSERT OR IGNORE INTO bank_accounts (account_id, citizen_id, account_number, account_name, balance_gold, tier, created_date, is_frozen) VALUES
(1, 2, 'ACT-1001-VALE', 'Gideon Vale Personal Trust', 84500.0, 'platinum', '1885-04-12', 0),
(2, 2, 'ACT-1002-TH', 'Town Hall Contingency Fund', 12500.0, 'government', '1887-01-15', 0),
(3, 5, 'ACT-2005-SPUR', 'Gilded Spur Operating', 3420.0, 'standard', '1888-06-20', 0),
(4, 4, 'ACT-3004-APOTH', 'Dr. Vance Medical Practice', 1850.0, 'standard', '1889-02-10', 0),
(5, 7, 'ACT-4007-MINE', 'Redrock Mining Union Payroll', 6200.0, 'commercial', '1890-08-01', 0),
(6, NULL, 'ACT-9999-SYND', 'Syndicate Reserve Account #9', 142000.0, 'clandestine', '1891-01-05', 0),
(7, 3, 'ACT-5003-VOSS', 'Voss Ranch Settlement', 450.0, 'standard', '1889-11-12', 1),
(8, 1, 'ACT-0001-HALE', 'Rowan Hale Escrow', 890.0, 'standard', '1888-03-01', 0);

INSERT OR IGNORE INTO telegraph_dispatches (dispatch_id, sender, recipient, channel, encoded_cipher, decrypted_message, priority, timestamp) VALUES
(1, 'Gideon Vale', 'Ezekiel Cross', 'PRIVATE_WIRE_4', 'CIPHER-77-MINE', 'Prepare North Ridge shaft. The second ledger was not found in Hale desk. Intercept freight car 402.', 'URGENT', '1891-10-14 21:10'),
(2, 'Clara Higgins', 'Denver Dispatch', 'COMMERCIAL', 'PLAIN', 'Express train 12 delayed at Redrock canyon junction due to switch failure.', 'ROUTINE', '1891-10-14 22:00'),
(3, 'Ezekiel Cross', 'Gideon Vale', 'PRIVATE_WIRE_4', 'CIPHER-88-BLAST', 'Car 402 secured at siding. Dynamite crates offloaded to mine bunker. Vance prepared the counterfeit certificate.', 'CRITICAL', '1891-10-15 01:45'),
(4, 'Dr. Alistair Vance', 'Gideon Vale', 'PRIVATE_WIRE_4', 'CIPHER-12-MED', 'Burial completed in Whispering Pines plot 47 under darkness. Epitaph inscribed as ordered. Let no one dig.', 'CONFIDENTIAL', '1891-10-12 03:30'),
(5, 'Mara Voss', 'Rowan Hale', 'PONY_RELAY', 'PLAIN', 'Rowan - I hid the bank manifests in the church belltower. Do not trust Vale or his deputies.', 'PERSONAL', '1891-09-30 18:20');

INSERT OR IGNORE INTO medical_examinations (report_id, deceased_name, examiner, cause_of_death, toxicology_notes, date_recorded, is_tampered) VALUES
(1, 'John Doe #4 (Rowan Hale)', 'Dr. Alistair Vance', 'Apparent fall from North Ridge Canyon', 'Traces of heavy chloral hydrate sedative detected in blood. Blunt trauma post-mortem.', '1891-10-12', 1),
(2, 'Thomas Higgins', 'Dr. Alistair Vance', 'Pneumonia', 'None detected.', '1891-07-14', 0),
(3, 'Caleb Stone', 'Dr. Alistair Vance', 'Mine rockslide asphyxiation', 'Carbon monoxide saturation.', '1891-08-22', 0);

INSERT OR IGNORE INTO train_cargo_manifests (manifest_id, train_number, origin, destination, cargo_type, declared_weight_lbs, actual_weight_lbs, contraband_flags, shipment_date) VALUES
(1, 'TRAIN-EXPRESS-12', 'Omaha Foundry', 'Redrock Depot', 'Agricultural Hardware', 12000, 18500, 'UNREGISTERED_DYNAMITE_WEAPONS', '1891-10-14'),
(2, 'TRAIN-FREIGHT-402', 'Denver Central', 'North Ridge Siding', 'Timber & Rails', 25000, 34200, 'CONCEALED_GOLD_BULLION_SAFES', '1891-10-15'),
(3, 'TRAIN-LOCAL-08', 'Query Creek', 'Silver City', 'Cattle & Grain', 15000, 15100, 'NONE', '1891-10-13');

INSERT OR IGNORE INTO cemetery_plots (plot_id, deceased_name, burial_date, grave_status, inscribed_epitaph, depth_feet) VALUES
(45, 'Eleanor Thorne', '1884-05-10', 'OCCUPIED', 'Resting peacefully in frontier soil.', 6.0),
(46, 'Silas Thorne Sr.', '1889-11-20', 'OCCUPIED', 'A pioneer of Query Creek.', 6.0),
(47, 'Rowan Hale', '1891-10-12', 'EMPTY_TOMB', 'A Faithful Lawman Who Departed in Silence.', 2.1),
(48, 'Unknown Miner', '1890-03-15', 'OCCUPIED', 'Known only to God.', 6.0);

INSERT OR IGNORE INTO syndicate_ledger (ledger_entry_id, alias, real_name, syndicate_role, cut_percentage, payout_total_gold, tier_level) VALUES
(1, 'The Architect', 'Gideon Vale', 'Syndicate Mastermind', 45.0, 125000.0, 1),
(2, 'The Enforcer', 'Ezekiel Cross', 'Mine Security & Explosives', 20.0, 42000.0, 2),
(3, 'The Apothecary', 'Dr. Alistair Vance', 'Poisoner & Medical Forger', 15.0, 28000.0, 2),
(4, 'The Ear', 'Silas Thorne', 'Saloon Surveillance', 10.0, 18500.0, 3),
(5, 'The Wire', 'Clara Higgins', 'Telegraph Interceptor', 10.0, 14000.0, 3);

INSERT OR IGNORE INTO boss_shields (shield_layer, layer_name, frequency_hz, energy_hp, vulnerability_element, cipher_key_json, rotation_sequence) VALUES
(1, 'Aegis of the Ironvault', 440, 200, 'Shock', '{"cipher": "SIGMA_SHOCK", "overload_element": "Shock", "harmonic_code": 440, "bypass_token": "AEGIS_BREAK_1"}', 1),
(2, 'Infernal Powder Barrier', 587, 250, 'Fire', '{"cipher": "PYRO_FLAME", "overload_element": "Fire", "harmonic_code": 587, "bypass_token": "AEGIS_BREAK_2"}', 2),
(3, 'Syndicate Arcane Core', 880, 350, 'Arcane', '{"cipher": "ARCANE_PRIME", "overload_element": "Arcane", "harmonic_code": 880, "bypass_token": "AEGIS_BREAK_3"}', 3);
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

  if (!trimmed) {
    throw new Error('Empty query provided');
  }

  // 1. Strip comments (/* ... */ and -- ...) for security parsing
  const cleanSql = trimmed.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();
  if (!cleanSql) {
    throw new Error('Query contains only comments without executable statements');
  }

  // 2. Query-only enforcement: Query must start with read-only operations
  const firstWord = cleanSql.split(/\s+/)[0]?.toUpperCase();
  const allowedFirstWords = ['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA'];
  if (!allowedFirstWords.includes(firstWord)) {
    throw new Error(
      `Access Denied: The frontier noir archives are read-only. Statements must begin with SELECT, WITH, or EXPLAIN (received: '${firstWord || 'EMPTY'}').`
    );
  }

  // 3. Prohibit data-altering and schema-destructive keywords anywhere in the statement
  const prohibitedMutations = [
    'DROP',
    'DELETE',
    'INSERT',
    'UPDATE',
    'ALTER',
    'CREATE',
    'REPLACE',
    'ATTACH',
    'DETACH',
    'VACUUM',
    'WRITABLE_SCHEMA',
  ];

  for (const kw of prohibitedMutations) {
    const wordBoundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
    if (wordBoundaryRegex.test(cleanSql)) {
      throw new Error(
        `Security Restriction: Mutation command '${kw}' is prohibited. Story and investigation records cannot be modified.`
      );
    }
  }

  // 4. Enforce strict maximum result limits (capped at 500 rows ceiling)
  const safeMaxRows = Math.max(1, Math.min(maxRows, 500));

  const columnNames: string[] = [];
  const rows: (string | number | boolean | null)[][] = [];

  let rowCount = 0;

  try {
    db.exec({
      sql: trimmed,
      rowMode: 'array',
      columnNames: columnNames,
      callback: (row: any[]) => {
        if (rowCount < safeMaxRows) {
          rows.push(row);
        }
        rowCount++;

        // Excessive cross-join / Cartesian product runaway protection (halt after 5000 rows)
        if (rowCount >= 5000) {
          return false;
        }
      },
    });
  } catch (err: any) {
    // Pedagogical error enrichment
    const msg = err?.message || String(err);
    if (msg.includes('no such table')) {
      throw new Error(
        `${msg}. Hint: Check the Frontier Schema tab in the Grimoire to inspect available ledger tables.`
      );
    } else if (msg.includes('no such column')) {
      throw new Error(`${msg}. Hint: Check table column spellings in the schema viewer.`);
    } else if (msg.includes('syntax error')) {
      throw new Error(
        `${msg}. Hint: Check SQL keywords, comma placements, and quotation pairings.`
      );
    }
    throw err;
  }

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
