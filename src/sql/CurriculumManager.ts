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
    title: 'Level 2B — The Concealed Audit Trail',
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

