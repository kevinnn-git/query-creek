export type EvidenceType = 'document' | 'sql_record' | 'witness_statement' | 'suspect' | 'anomaly';

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  dateDiscovered: string;
  source: string; // e.g. "Sheriff's Desk", "SQL Query: bank_transactions", "Gideon Vale Interrogation"
  snippet: string;
  fullContent?: string;
  metadata?: Record<string, any>;
  queryOrigin?: string; // The SQL query that produced this row (if sql_record)
  isContradictionLead?: boolean;
}

export interface CorkboardPin {
  id: string;
  evidenceId: string;
  x: number; // percentage or px coordinates on board
  y: number;
  rotation: number; // slight rotation for vintage corkboard feel (-4 to +4 deg)
  pinColor: 'red' | 'gold' | 'silver' | 'black';
  customNote?: string;
}

export interface CorkboardLink {
  id: string;
  fromPinId: string;
  toPinId: string;
  label?: string;
  isContradiction?: boolean;
  discoveredAt?: string;
}

export interface ContradictionRule {
  npcId: string;
  dialogueStepId: string;
  requiredEvidenceIds: string[]; // At least one of these evidence IDs must be presented
  contradictionTitle: string;
  successDialogueStepId: string;
  failureDialogue: string;
  storyProgressObjective: string;
  advancesChapter?: string;
}
