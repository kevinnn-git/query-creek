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

    // Generic fallback validation
    return {
      passed: true,
      message: 'Investigation query verified successfully.'
    };
  }
}
