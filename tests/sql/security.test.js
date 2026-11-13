import test from 'node:test';
import assert from 'node:assert/strict';

// Security Guard Validator replicating sqlite.worker.ts executeQuery logic
function validateQuerySecurity(sql, maxRows = 200) {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error('Empty query provided');
  }

  // 1. Strip comments (/* ... */ and -- ...)
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

  const safeMaxRows = Math.max(1, Math.min(maxRows, 500));
  return {
    isAuthorized: true,
    safeMaxRows,
    cleanSql,
  };
}

test('SQL Database Security & Query Guardrails', async (t) => {
  await t.test('permits legitimate read-only queries', () => {
    const q1 = 'SELECT name, occupation FROM citizens WHERE status = "active";';
    const res1 = validateQuerySecurity(q1);
    assert.equal(res1.isAuthorized, true);

    const q2 = 'WITH suspects AS (SELECT * FROM citizens) SELECT * FROM suspects;';
    const res2 = validateQuerySecurity(q2);
    assert.equal(res2.isAuthorized, true);

    const q3 = 'EXPLAIN QUERY PLAN SELECT * FROM bank_transactions;';
    const res3 = validateQuerySecurity(q3);
    assert.equal(res3.isAuthorized, true);
  });

  await t.test('rejects direct table drops and deletions', () => {
    assert.throws(
      () => validateQuerySecurity('DROP TABLE citizens;'),
      /Access Denied|Mutation command 'DROP' is prohibited/
    );

    assert.throws(
      () => validateQuerySecurity('DELETE FROM sheriff_records WHERE record_id = 1;'),
      /Access Denied|Mutation command 'DELETE' is prohibited/
    );
  });

  await t.test('rejects arbitrary table insertions and updates', () => {
    assert.throws(
      () => validateQuerySecurity('INSERT INTO citizens (name) VALUES ("Hacker");'),
      /Access Denied|Mutation command 'INSERT' is prohibited/
    );

    assert.throws(
      () => validateQuerySecurity('UPDATE citizens SET status = "cleared" WHERE name = "Mara Voss";'),
      /Access Denied|Mutation command 'UPDATE' is prohibited/
    );
  });

  await t.test('rejects semicolon-delimited multi-statement injection attempts', () => {
    const injection = 'SELECT * FROM citizens; DROP TABLE bank_accounts;';
    assert.throws(
      () => validateQuerySecurity(injection),
      /Mutation command 'DROP' is prohibited/
    );
  });

  await t.test('rejects database attachment and schema tampering directives', () => {
    assert.throws(
      () => validateQuerySecurity('ATTACH DATABASE "/tmp/evil.db" AS evil;'),
      /Access Denied|Mutation command 'ATTACH' is prohibited/
    );

    assert.throws(
      () => validateQuerySecurity('PRAGMA writable_schema = 1;'),
      /Mutation command 'WRITABLE_SCHEMA' is prohibited/
    );
  });

  await t.test('clamps requested row limits to strict 500 ceiling', () => {
    const res = validateQuerySecurity('SELECT * FROM train_cargo_manifests;', 50000);
    assert.equal(res.safeMaxRows, 500);

    const res2 = validateQuerySecurity('SELECT * FROM train_cargo_manifests;', 50);
    assert.equal(res2.safeMaxRows, 50);
  });
});
