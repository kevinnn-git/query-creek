import type { QueryResult } from '../db/types';
import type { SqlChallenge } from './CurriculumManager';

export interface ValidationResult {
  passed: boolean;
  message: string;
  feedback?: string;
}

export class ChallengeValidator {
  public static validate(query: string, result: QueryResult, challenge: SqlChallenge): ValidationResult {
    if (!result || !result.rows || result.rowCount === 0) {
      return {
        passed: false,
        message: 'No records were returned by your query.',
        feedback: `Ensure you are querying the "${challenge.targetTable}" table and that your filters do not exclude all rows.`
      };
    }

    const cleanQuery = query.toLowerCase();

    // Check target table referenced
    if (!cleanQuery.includes(challenge.targetTable.toLowerCase())) {
      return {
        passed: false,
        message: `Query does not target the ${challenge.targetTable} table.`,
        feedback: `Make sure your query specifies FROM ${challenge.targetTable}.`
      };
    }

    // Specific challenge validations
    if (challenge.id === 'level_0_citizens') {
      // Must contain at least name or status, or select *
      const cols = result.columns.map(c => c.toLowerCase());
      const hasName = cols.includes('name');
      const hasStatus = cols.includes('status');

      if (!hasName && !hasStatus && !cleanQuery.includes('*')) {
        return {
          passed: false,
          message: 'The query output does not include citizen names or status.',
          feedback: 'Try requesting all columns with SELECT * FROM citizens; or include the name and status columns.'
        };
      }

      // Check that Rowan Hale exists in the returned records
      const containsRowan = result.rows.some(row => 
        row.some(val => typeof val === 'string' && val.includes('Rowan Hale'))
      );

      if (!containsRowan) {
        return {
          passed: false,
          message: 'The records do not include Sheriff Rowan Hale.',
          feedback: 'Ensure your query does not filter out Rowan Hale.'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_1_sheriff_records') {
      if (!cleanQuery.includes('where') || !cleanQuery.includes('confidential')) {
        return {
          passed: false,
          message: 'Query does not filter for confidential records.',
          feedback: 'Use WHERE confidential = 1 to reveal only the confidential investigation records.'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_2_bank_alibi') {
      const hasVale = cleanQuery.includes('vale');
      const hasWhere = cleanQuery.includes('where');
      const containsValeRow = result.rows.some(row =>
        row.some(val => typeof val === 'string' && val.toLowerCase().includes('vale'))
      );

      if (!hasWhere || (!hasVale && !containsValeRow)) {
        return {
          passed: false,
          message: 'Query does not isolate transactions authorized by Gideon Vale.',
          feedback: "Use WHERE authorized_by = 'Gideon Vale' AND amount_gold >= 1000 to find Vale's late withdrawals."
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_2_syndicate_null') {
      const hasNullCheck = cleanQuery.includes('null');
      const hasLike = cleanQuery.includes('like') || cleanQuery.includes('syndicate');

      if (!hasNullCheck && !hasLike) {
        return {
          passed: false,
          message: 'Query does not search for NULL notes or Syndicate accounts.',
          feedback: "Try: WHERE notes IS NULL OR account_name LIKE '%Syndicate%'"
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_4_relational_accounts') {
      const hasJoin = cleanQuery.includes('join');
      const hasCitizens = cleanQuery.includes('citizens');

      if (!hasJoin || !hasCitizens) {
        return {
          passed: false,
          message: 'Query does not join bank_accounts with citizens table.',
          feedback: 'Use JOIN citizens c ON bank_accounts.citizen_id = c.citizen_id to link accounts to citizen identities.'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_5_forensic_aggregation') {
      const hasGroup = cleanQuery.includes('group by');
      const hasSum = cleanQuery.includes('sum(') || cleanQuery.includes('sum (');

      if (!hasGroup || !hasSum) {
        return {
          passed: false,
          message: 'Query does not aggregate by authorized authority.',
          feedback: 'Use SUM(amount_gold) and GROUP BY authorized_by with HAVING SUM(amount_gold) > 2000.'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_6_subquery_veil') {
      const hasCase = cleanQuery.includes('case');
      const hasSubquery = cleanQuery.includes('select') && (cleanQuery.includes('not in') || cleanQuery.includes('in ('));

      if (!hasCase && !hasSubquery) {
        return {
          passed: false,
          message: 'Query does not utilize subqueries or CASE WHEN classification.',
          feedback: 'Use a subquery with NOT IN (SELECT account_name FROM bank_accounts WHERE citizen_id IS NOT NULL) and CASE WHEN.'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_7_manifest_reconciliation') {
      const hasDiscrepancy = cleanQuery.includes('>') || cleanQuery.includes('actual_weight_lbs');
      const hasExists = cleanQuery.includes('exists');

      if (!hasDiscrepancy || !hasExists) {
        return {
          passed: false,
          message: 'Query does not check weight discrepancy with correlated EXISTS subquery.',
          feedback: 'Filter where actual_weight_lbs > declared_weight_lbs and use EXISTS (SELECT 1 FROM telegraph_dispatches ...).'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_8_cte_window_audit') {
      const hasWith = cleanQuery.includes('with ');
      const hasOver = cleanQuery.includes('over ') || cleanQuery.includes('over(');

      if (!hasWith || !hasOver) {
        return {
          passed: false,
          message: 'Query does not use Common Table Expressions (WITH) or Window Functions (OVER).',
          feedback: 'Construct a CTE using WITH timeline AS (...) and ROW_NUMBER() OVER (ORDER BY timestamp ASC).'
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    if (challenge.id === 'level_9_json_boss_cipher') {
      const hasJsonExtract = cleanQuery.includes('json_extract') || cleanQuery.includes('json');

      if (!hasJsonExtract) {
        return {
          passed: false,
          message: 'Query does not utilize json_extract() to parse boss shield data.',
          feedback: "Use json_extract(cipher_key_json, '$.overload_element') to retrieve Mayor Vale's shield weakness."
        };
      }

      return {
        passed: true,
        message: challenge.completionStoryMessage
      };
    }

    // Generic fallback validation
    return {
      passed: true,
      message: 'Investigation query verified successfully.'
    };
  }
}
