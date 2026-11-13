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
    category: 'Filtering with WHERE',
    objective: 'Filter sheriff_records to find confidential cases investigated by Rowan Hale.',
    description: `Rowan Hale kept both public notices and confidential cases in sheriff_records. 

Use WHERE confidential = 1 to expose Hale's private investigation logs.`,
    targetTable: 'sheriff_records',
    hints: [
      'Hint 1: Append WHERE confidential = 1 to the end of your query.',
      'Hint 2: Try: SELECT case_number, title, summary FROM sheriff_records WHERE confidential = 1;'
    ],
    canonicalQuery: 'SELECT * FROM sheriff_records WHERE confidential = 1;',
    completionStoryMessage: `CONFIDENTIAL ARCHIVE ACCESSED!
Rowan Hale documented dual accounting ledgers in the Ironvault Bank basement and tampered shipping manifests on the Redrock railway line.`,
    nextChapterObjective: 'Confront Mayor Gideon Vale with the discrepancies found in the confidential ledgers.'
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
