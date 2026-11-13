import test from 'node:test';
import assert from 'node:assert';
import { InterrogationManager } from '../../src/investigation/InterrogationManager.ts';
import { INITIAL_EVIDENCE_ITEMS, INITIAL_CORKBOARD_PINS, INITIAL_CORKBOARD_LINKS } from '../../src/investigation/evidenceData.ts';

test('Investigation & Evidence Contradiction Subsystem', async (t) => {
  await t.test('evaluates Mayor Gideon Vale contradiction when presenting bank withdrawal evidence', () => {
    const contradictingEvidence = {
      id: 'evidence_bank_withdrawal_vale',
      title: 'Ledger Record: bank_transactions #1',
      type: 'sql_record',
      dateDiscovered: '1891-10-15',
      source: 'SQL Query: bank_transactions',
      snippet: 'Gideon Vale | 23:15 | 2500.0 gold | Emergency withdrawal',
      metadata: {
        authorizedBy: 'Gideon Vale',
        amount: 2500.0,
      },
    };

    const result = InterrogationManager.evaluateContradiction(
      'mayor_gideon_vale',
      'vale_alibi',
      contradictingEvidence
    );

    assert.strictEqual(result.isContradiction, true, 'Should prove contradiction against Vale');
    assert.strictEqual(result.nextStepId, 'vale_cornered', 'Should transition to cornered dialogue step');
    assert.match(result.feedbackMessage, /Mayor Vale's Alibi Shattered/, 'Feedback should announce broken alibi');
  });

  await t.test('handles non-contradicting evidence presentation with realistic dialogue rebuttal', () => {
    const irrelevantEvidence = {
      id: 'evidence_cider_tab',
      title: 'Saloon Tab #3',
      type: 'document',
      dateDiscovered: '1891-10-15',
      source: 'Gilded Spur Saloon',
      snippet: 'Mara Voss: Ordered 1 cider, 25 cents.',
    };

    const result = InterrogationManager.evaluateContradiction(
      'mayor_gideon_vale',
      'vale_alibi',
      irrelevantEvidence
    );

    assert.strictEqual(result.isContradiction, false, 'Should not trigger contradiction for irrelevant clue');
    assert.match(result.feedbackMessage, /hardly evidence of any wrongdoing/i);
  });

  await t.test('evaluates Silas Thorne contradiction when presented with dynamite case file', () => {
    const dynamiteEvidence = {
      id: 'evidence_case_dynamite',
      title: 'Rowan Hale Case #2: Manifest Tampering',
      type: 'document',
      dateDiscovered: '1891-10-15',
      source: 'Sheriff Records',
      snippet: 'Unregistered dynamite and mining equipment crates shipped under false labels.',
    };

    const result = InterrogationManager.evaluateContradiction(
      'silas_thorne',
      'silas_denial',
      dynamiteEvidence
    );

    assert.strictEqual(result.isContradiction, true, 'Should prove contradiction against Silas');
    assert.strictEqual(result.nextStepId, 'silas_confession');
  });

  await t.test('verifies initial corkboard structure and pins', () => {
    assert.ok(INITIAL_EVIDENCE_ITEMS.length >= 4, 'Should have initial evidence items');
    assert.ok(INITIAL_CORKBOARD_PINS.length >= 4, 'Should have initial corkboard pins');
    assert.ok(INITIAL_CORKBOARD_LINKS.length >= 2, 'Should have initial corkboard links');

    const contradictionLink = INITIAL_CORKBOARD_LINKS.find((l) => l.isContradiction);
    assert.ok(contradictionLink, 'Should feature an initial contradiction hypothesis link');
  });
});
