import type { EvidenceItem, ContradictionRule } from './types';

export class InterrogationManager {
  private static rules: ContradictionRule[] = [
    {
      npcId: 'mayor_gideon_vale',
      dialogueStepId: 'vale_alibi',
      requiredEvidenceIds: [
        'evidence_bank_withdrawal_vale',
        'sql_record_bank_transactions_1',
        'sql_record_bank_transactions_7',
        'incident_notice',
      ],
      contradictionTitle: "Mayor Vale's Alibi Shattered",
      successDialogueStepId: 'vale_cornered',
      failureDialogue: "Mayor Vale chuckles coldly: 'A nice piece of paper, Sheriff. But hardly evidence of any wrongdoing on my part. I suggest you focus your star on Mara Voss.'",
      storyProgressObjective: "Gideon Vale's alibi is broken! Search The Gilded Spur Saloon to discover where the $2,500 gold was delivered.",
      advancesChapter: "Chapter 2: The Syndicated Ledger",
    },
    {
      npcId: 'silas_thorne',
      dialogueStepId: 'silas_denial',
      requiredEvidenceIds: [
        'evidence_case_dynamite',
        'sql_record_sheriff_records_2',
        'saloon_tab_ezekiel',
      ],
      contradictionTitle: "Silas Thorne's Ledger Slip",
      successDialogueStepId: 'silas_confession',
      failureDialogue: "Silas wipes the bar counter with an oily rag: 'Look Sheriff, people come and go all day. I don't remember every drink poured.'",
      storyProgressObjective: "Silas confessed that Ezekiel Cross is laundering mine crates. Inspect the North Ridge rail logs.",
      advancesChapter: "Chapter 2: The Syndicated Ledger",
    },
  ];

  /**
   * Evaluate whether presenting a chosen piece of evidence contradicts the NPC's active dialogue
   */
  public static evaluateContradiction(
    npcId: string,
    stepId: string,
    evidence: EvidenceItem
  ): {
    isContradiction: boolean;
    rule?: ContradictionRule;
    feedbackMessage: string;
    nextStepId?: string;
  } {
    const matchingRule = this.rules.find(
      (r) =>
        r.npcId === npcId &&
        (r.dialogueStepId === stepId || stepId.includes('alibi') || stepId.includes('inquiry'))
    );

    if (!matchingRule) {
      return {
        isContradiction: false,
        feedbackMessage: "The witness observes the paper impassively: 'I don't see what this has to do with our conversation, Sheriff.'",
      };
    }

    // Check if evidence ID matches or if metadata indicates a match
    const matches =
      matchingRule.requiredEvidenceIds.includes(evidence.id) ||
      (evidence.metadata?.authorizedBy === 'Gideon Vale' && evidence.metadata?.amount >= 1000) ||
      (evidence.source?.includes('bank_transactions') && evidence.snippet?.includes('Gideon Vale'));

    if (matches) {
      return {
        isContradiction: true,
        rule: matchingRule,
        feedbackMessage: `CONTRADICTION PROVEN: ${matchingRule.contradictionTitle}`,
        nextStepId: matchingRule.successDialogueStepId,
      };
    }

    return {
      isContradiction: false,
      feedbackMessage: matchingRule.failureDialogue,
    };
  }
}
