export interface SqlChallenge {
  id: string;
  level: number;
  title: string;
  category: string;
  objective: string;
  description: string;
  targetTable: string;
  hints: string[];
  canonicalQuery: string;
  completionStoryMessage: string;
  nextChapterObjective: string;
}

export const SQL_CURRICULUM: SqlChallenge[] = [
  {
    id: 'level_0_citizens',
    level: 0,
    title: 'Level 0 — The First Ledger',
    category: 'Basic Retrieval (SELECT, FROM)',
    objective: 'Query the town citizens registry to identify active and missing citizens.',
    description: `Every investigation in Query Creek begins with the ledgers. The citizens table contains official records of everyone registered in the district.

Write a query to retrieve records from the citizens table.`,
    targetTable: 'citizens',
    hints: [
      'Hint 1: Use the SELECT keyword to specify the columns, and FROM to specify the table.',
      'Hint 2: An asterisk (*) selects all columns in the table.',
      'Hint 3: You can also request specific columns, like: SELECT name, occupation, status FROM citizens;'
    ],
    canonicalQuery: 'SELECT * FROM citizens;',
    completionStoryMessage: `LEDGER DECRYPTED!
Rowan Hale is registered as Sheriff with status 'missing' since his disappearance 3 weeks ago.
Mayor Gideon Vale holds an influential reputation of 95 and controls key assets.
Mara Voss is registered with status 'wanted' for the bank robbery.`,
    nextChapterObjective: "Investigate Rowan Hale's case files in sheriff_records using SELECT to uncover what he discovered."
  },
  {
    id: 'level_1_sheriff_records',
    level: 1,
    title: 'Level 1 — The Confidential Files',
    category: 'Filtering with WHERE & ORDER BY',
    objective: 'Filter sheriff_records to find confidential cases investigated by Rowan Hale, ordered by date.',
    description: `Rowan Hale kept both public notices and confidential cases in sheriff_records. 

Use WHERE confidential = 1 to expose Hale's private investigation logs, and ORDER BY date_filed DESC to see the most recent discoveries.`,
    targetTable: 'sheriff_records',
    hints: [
      'Hint 1: Append WHERE confidential = 1 to the end of your query.',
      'Hint 2: Add ORDER BY date_filed DESC to sort chronologically from newest to oldest.',
      'Hint 3: Try: SELECT case_number, title, date_filed, summary FROM sheriff_records WHERE confidential = 1 ORDER BY date_filed DESC;'
    ],
    canonicalQuery: 'SELECT * FROM sheriff_records WHERE confidential = 1 ORDER BY date_filed DESC;',
    completionStoryMessage: `CONFIDENTIAL ARCHIVE ACCESSED!
Rowan Hale documented dual accounting ledgers in the Ironvault Bank basement and tampered shipping manifests on the Redrock railway line.`,
    nextChapterObjective: "Investigate bank_transactions to see if Mayor Gideon Vale made late withdrawals before the heist."
  },
  {
    id: 'level_2_bank_alibi',
    level: 2,
    title: 'Level 2 — The Broken Alibi',
    category: 'Comparison Operators & Range Filtering (WHERE, >=, AND)',
    objective: 'Query bank_transactions for withdrawals authorized by Gideon Vale exceeding 1000 gold on robbery night.',
    description: `Mayor Gideon Vale sworn under oath that he never visited the bank or touched funds after 9 PM on October 14.

Write a query filtering bank_transactions for authorized_by = 'Gideon Vale' with amount_gold >= 1000 to uncover late disbursements.`,
    targetTable: 'bank_transactions',
    hints: [
      "Hint 1: Filter with WHERE authorized_by = 'Gideon Vale' AND amount_gold >= 1000",
      "Hint 2: Use comparison operator >= to find amounts of 1000 gold or more.",
      "Hint 3: Try: SELECT transaction_id, account_name, amount_gold, timestamp FROM bank_transactions WHERE authorized_by = 'Gideon Vale' AND amount_gold >= 1000;"
    ],
    canonicalQuery: "SELECT * FROM bank_transactions WHERE authorized_by = 'Gideon Vale' AND amount_gold >= 1000 ORDER BY timestamp DESC;",
    completionStoryMessage: `CONTRADICTION DISCOVERED!
Gideon Vale authorized a $1,200 courier retainer at 22:45 and an emergency $2,500 withdrawal at 23:15—mere minutes before the vault breach. Pin this row to your Corkboard!`,
    nextChapterObjective: 'Pin the $2,500 withdrawal record to your Corkboard and confront Mayor Gideon Vale with the contradiction.'
  },
  {
    id: 'level_2_syndicate_null',
    level: 3,
    title: 'Level 3 — The Concealed Audit Trail',
    category: 'Pattern Matching & NULL Checking (LIKE, IS NULL, BETWEEN)',
    objective: 'Query bank_transactions for transfers with no explanation (notes IS NULL) or accounts matching LIKE "%Syndicate%".',
    description: `Syndicate bookkeepers often omitted mandatory ledger notes or used clandestine account labels.

Use WHERE notes IS NULL OR account_name LIKE '%Syndicate%' to pinpoint offshore transactions.`,
    targetTable: 'bank_transactions',
    hints: [
      "Hint 1: Use IS NULL to check for missing notes: WHERE notes IS NULL",
      "Hint 2: Use the LIKE operator with wildcards: account_name LIKE '%Syndicate%'",
      "Hint 3: Try: SELECT * FROM bank_transactions WHERE notes IS NULL OR account_name LIKE '%Syndicate%';"
    ],
    canonicalQuery: "SELECT * FROM bank_transactions WHERE notes IS NULL OR account_name LIKE '%Syndicate%';",
    completionStoryMessage: `CLANDESTINE TRANSFER EXPOSED!
Syndicate Reserve Account #9 transferred 15,000 gold at 23:30 with zero audit notes. Rowan Hale was right: the bank robbery was staged to cover this deficit.`,
    nextChapterObjective: 'Connect the Syndicate Reserve transfer to Rowan Hale on the Detective Corkboard.'
  },
  {
    id: 'level_4_relational_accounts',
    level: 4,
    title: 'Level 4 — Relational Auditing',
    category: 'Table Joins (INNER JOIN, LEFT JOIN)',
    objective: 'Join bank_accounts with citizens on citizen_id to map citizen names to their bank balances and account tiers.',
    description: `To unmask who owns which frontier account, we must join the bank_accounts table with the citizens registry.

Write a query joining bank_accounts a with citizens c ON a.citizen_id = c.citizen_id to expose Gideon Vale's private trusts.`,
    targetTable: 'bank_accounts',
    hints: [
      'Hint 1: Use JOIN citizens ON bank_accounts.citizen_id = citizens.citizen_id',
      'Hint 2: You can alias tables: FROM bank_accounts a JOIN citizens c ON a.citizen_id = c.citizen_id',
      'Hint 3: Try: SELECT c.name, a.account_number, a.balance_gold, a.tier FROM bank_accounts a JOIN citizens c ON a.citizen_id = c.citizen_id;'
    ],
    canonicalQuery: 'SELECT c.name, a.account_number, a.account_name, a.balance_gold, a.tier FROM bank_accounts a JOIN citizens c ON a.citizen_id = c.citizen_id ORDER BY a.balance_gold DESC;',
    completionStoryMessage: `ACCOUNTS UNMASKED!
Gideon Vale holds over 97,000 gold across his personal trust and Town Hall accounts, while framed rancher Mara Voss has had her account frozen!`,
    nextChapterObjective: 'Investigate transaction totals using GROUP BY and HAVING to expose money laundering volumes.'
  },
  {
    id: 'level_5_forensic_aggregation',
    level: 5,
    title: 'Level 5 — Forensic Aggregation',
    category: 'Group Summaries & Thresholds (GROUP BY, HAVING, SUM, COUNT)',
    objective: 'Aggregate bank_transactions by authorized_by to calculate total gold moved and count of transfers, filtering for authorities who moved over 2,000 gold.',
    description: `Syndicate bosses disperse funds across multiple transactions to avoid scrutiny. Forensic aggregation reveals the big picture.

Write a query grouping by authorized_by, calculating SUM(amount_gold) and COUNT(*), and filter using HAVING SUM(amount_gold) > 2000.`,
    targetTable: 'bank_transactions',
    hints: [
      'Hint 1: Use SELECT authorized_by, SUM(amount_gold) AS total_moved, COUNT(*) AS txn_count FROM bank_transactions',
      'Hint 2: Add GROUP BY authorized_by',
      'Hint 3: Add HAVING SUM(amount_gold) > 2000 to filter after aggregation.'
    ],
    canonicalQuery: 'SELECT authorized_by, SUM(amount_gold) as total_gold, COUNT(*) as txn_count FROM bank_transactions GROUP BY authorized_by HAVING SUM(amount_gold) > 2000 ORDER BY total_gold DESC;',
    completionStoryMessage: `LAUNDERING VOLUMES REVEALED!
Unknown syndicate handlers and Gideon Vale accounted for over 18,000 gold in emergency withdrawals on the night of the bank heist!`,
    nextChapterObjective: 'Inspect telegraph_dispatches and cargo manifests to trace the smuggled North Ridge shipments.'
  },
  {
    id: 'level_6_subquery_veil',
    level: 6,
    title: 'Level 6 — The Shell Corporation Veil',
    category: 'Subqueries & Conditional Logic (CASE WHEN, IN, Subqueries)',
    objective: 'Identify transactions whose account_name is NOT IN the recognized legitimate town accounts, classifying amounts with CASE WHEN.',
    description: `Corrupt entities route money through shell accounts that do not belong to registered citizens.

Write a query selecting from bank_transactions WHERE account_name NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL), and label amounts over 5000 as "CRITICAL_LAUNDERING" with CASE WHEN.`,
    targetTable: 'bank_transactions',
    hints: [
      'Hint 1: Use a subquery: WHERE account_name NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL)',
      'Hint 2: Use CASE WHEN amount_gold >= 5000 THEN "CRITICAL" ELSE "ROUTINE" END AS alert_level',
      'Hint 3: Try: SELECT transaction_id, account_name, amount_gold, CASE WHEN amount_gold >= 5000 THEN "CRITICAL_LAUNDERING" ELSE "ROUTINE" END AS severity FROM bank_transactions WHERE account_name NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL);'
    ],
    canonicalQuery: 'SELECT transaction_id, account_name, amount_gold, CASE WHEN amount_gold >= 5000 THEN "CRITICAL_LAUNDERING" ELSE "ROUTINE" END as classification FROM bank_transactions WHERE account_name NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL);',
    completionStoryMessage: `SHELL PIPELINE CONFIRMED!
Syndicate Reserve Account #9 is an unregistered ghost account, moving 15,000 gold directly to the North Ridge Outlaw Mine!`,
    nextChapterObjective: 'Correlate Redrock freight trains with telegraph dispatches using EXISTS and UNION.'
  },
  {
    id: 'level_7_manifest_reconciliation',
    level: 7,
    title: 'Level 7 — Depot Manifest Reconciliations',
    category: 'Correlated Subqueries & Set Operations (EXISTS, NOT EXISTS, UNION)',
    objective: 'Identify train_cargo_manifests where actual weight exceeds declared weight, matching dispatches via EXISTS.',
    description: `The Redrock Train Depot manifests contain falsified weights. Train 402 was weighed at 34,200 lbs despite declaring only 25,000 lbs of timber.

Write a query on train_cargo_manifests m WHERE actual_weight_lbs > declared_weight_lbs AND EXISTS (SELECT 1 FROM telegraph_dispatches t WHERE t.encoded_cipher LIKE '%MINE%' OR t.priority = 'CRITICAL').`,
    targetTable: 'train_cargo_manifests',
    hints: [
      'Hint 1: Filter where actual_weight_lbs > declared_weight_lbs',
      'Hint 2: Correlate with telegraph_dispatches using EXISTS: WHERE EXISTS (SELECT 1 FROM telegraph_dispatches WHERE priority = "CRITICAL")',
      'Hint 3: Try: SELECT manifest_id, train_number, cargo_type, (actual_weight_lbs - declared_weight_lbs) AS contraband_weight, contraband_flags FROM train_cargo_manifests WHERE actual_weight_lbs > declared_weight_lbs;'
    ],
    canonicalQuery: 'SELECT manifest_id, train_number, cargo_type, declared_weight_lbs, actual_weight_lbs, (actual_weight_lbs - declared_weight_lbs) as weight_discrepancy, contraband_flags FROM train_cargo_manifests WHERE actual_weight_lbs > declared_weight_lbs AND EXISTS (SELECT 1 FROM telegraph_dispatches WHERE priority = "CRITICAL");',
    completionStoryMessage: `CONTRABAND SHIPMENT UNCOVERED!
Freight Car 402 smuggled 9,200 lbs of concealed gold bullion and dynamite directly to the Abandoned Mine bunker!`,
    nextChapterObjective: 'Reconstruct sequential money transfers using CTEs and Window Functions.'
  },
  {
    id: 'level_8_cte_window_audit',
    level: 8,
    title: 'Level 8 — Sequential Audit Reconstruction',
    category: 'Common Table Expressions & Window Functions (WITH, ROW_NUMBER, LAG)',
    objective: 'Use a Common Table Expression (WITH) and ROW_NUMBER() OVER (ORDER BY timestamp ASC) to reconstruct the chronological sequence of robbery night transactions.',
    description: `To prove conspiracy in a court of law, we must demonstrate the deliberate, sequential orchestration of events leading up to the heist.

Write a query using a Common Table Expression (WITH robbery_night AS (...)) and the window function ROW_NUMBER() OVER (ORDER BY timestamp ASC) to order all transactions on 1891-10-14.`,
    targetTable: 'bank_transactions',
    hints: [
      'Hint 1: Start with WITH ordered_txns AS (SELECT transaction_id, account_name, amount_gold, timestamp, authorized_by FROM bank_transactions WHERE timestamp LIKE "1891-10-14%")',
      'Hint 2: Add window function: ROW_NUMBER() OVER (ORDER BY timestamp ASC) as sequence_num',
      'Hint 3: Try: WITH timeline AS (SELECT transaction_id, account_name, amount_gold, timestamp, authorized_by, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as step_num FROM bank_transactions WHERE timestamp LIKE "1891-10-14%") SELECT * FROM timeline;'
    ],
    canonicalQuery: 'WITH robbery_timeline AS (SELECT transaction_id, account_name, amount_gold, timestamp, authorized_by, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as sequence_step FROM bank_transactions WHERE timestamp LIKE "1891-10-14%") SELECT sequence_step, timestamp, account_name, amount_gold, authorized_by FROM robbery_timeline ORDER BY sequence_step ASC;',
    completionStoryMessage: `CONSPIRACY TIMELINE PROVED!
Step 1: Gilded Spur deposits ($145) at 18:30.
Step 2: Courier retainer ($1,200) dispatched by Vale at 22:45.
Step 3: Vale emergency cash withdrawal ($2,500) at 23:15.
Step 4: Syndicate Reserve ($15,000) drained at 23:30.
Step 5: Robbery reported at 23:45.
The sequence indisputably proves Mayor Gideon Vale staged the robbery!`,
    nextChapterObjective: 'Head to the Abandoned Mine to confront Mayor Gideon Vale and decode his boss shield cipher using JSON functions!'
  },
  {
    id: 'level_9_json_boss_cipher',
    level: 9,
    title: 'Level 9 — The Arcane Vault Cipher',
    category: 'JSON Extraction & Boss Shield Decryption (json_extract, JSON queries)',
    objective: 'Query boss_shields using json_extract(cipher_key_json, "$.overload_element") to extract the exact elemental vulnerabilities needed to shatter Mayor Gideon Vale’s Arcane Aegis shield.',
    description: `Mayor Gideon Vale has shielded himself inside the North Ridge Mine with a multi-layered Arcane Aegis. The frequencies and overload vulnerabilities are stored in encrypted JSON format in boss_shields.

Write a query using json_extract(cipher_key_json, '$.overload_element') and json_extract(cipher_key_json, '$.harmonic_code') to discover the elemental weakness sequence.`,
    targetTable: 'boss_shields',
    hints: [
      'Hint 1: Query the boss_shields table.',
      'Hint 2: Extract JSON properties: json_extract(cipher_key_json, "$.overload_element") AS weakness, json_extract(cipher_key_json, "$.harmonic_code") AS frequency',
      'Hint 3: Try: SELECT shield_layer, layer_name, json_extract(cipher_key_json, "$.overload_element") AS overload_element, json_extract(cipher_key_json, "$.harmonic_code") AS frequency FROM boss_shields ORDER BY rotation_sequence ASC;'
    ],
    canonicalQuery: 'SELECT shield_layer, layer_name, json_extract(cipher_key_json, "$.overload_element") as overload_element, json_extract(cipher_key_json, "$.harmonic_code") as frequency_code, json_extract(cipher_key_json, "$.bypass_token") as bypass_token FROM boss_shields ORDER BY rotation_sequence ASC;',
    completionStoryMessage: `ARCANE SHIELD CIPHER DECIPHERED!
Layer 1 (440 Hz): Overload with SHOCK (Frontier Thunderstrike)!
Layer 2 (587 Hz): Overload with FIRE (Hellfire Powder Keg)!
Layer 3 (880 Hz): Overload with ARCANE (Deadeye Volley)!
Mayor Gideon Vale's Arcane Aegis is ready to be shattered in the final confrontation!`,
    nextChapterObjective: 'Cast the corresponding elemental spells during combat at the Abandoned Mine to shatter Mayor Vale’s shield and bring justice to Query Creek!'
  }
];

export class CurriculumManager {
  private currentChallengeIndex: number = 0;

  public getCurrentChallenge(): SqlChallenge {
    return SQL_CURRICULUM[this.currentChallengeIndex] || SQL_CURRICULUM[0];
  }

  public advanceChallenge(): SqlChallenge | null {
    if (this.currentChallengeIndex < SQL_CURRICULUM.length - 1) {
      this.currentChallengeIndex++;
      return this.getCurrentChallenge();
    }
    return null;
  }

  public getChallenge(id: string): SqlChallenge | undefined {
    return SQL_CURRICULUM.find(c => c.id === id);
  }
}

