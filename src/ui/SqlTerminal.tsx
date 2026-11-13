import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Play, Database, Table, HelpCircle, X, History, Sparkles, AlertCircle, CheckCircle, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { dbClient } from '../db/DbClient';
import { QueryResult } from '../db/types';
import { SQL_CURRICULUM, CurriculumManager } from '../sql/CurriculumManager';
import { ChallengeValidator } from '../sql/ChallengeValidator';

export const SqlTerminal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    schema,
    setSchema,
    lastResult,
    setLastResult,
    queryHistory,
    addQueryHistory,
    dbStorage,
    curriculumLevel,
    setCurriculumLevel,
    setObjective,
    showQuestNotification,
  } = useGameStore();

  const [queryText, setQueryText] = useState<string>('SELECT * FROM citizens LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [showCurriculumGuide, setShowCurriculumGuide] = useState<boolean>(true);

  const activeChallenge = SQL_CURRICULUM[curriculumLevel] || SQL_CURRICULUM[0];

  // Load schema on mount/open
  useEffect(() => {
    if (activeModal === 'terminal' && schema.length === 0) {
      dbClient.getSchema().then(setSchema).catch(console.error);
    }
  }, [activeModal, schema.length, setSchema]);

  if (activeModal !== 'terminal') return null;

  const handleExecute = async () => {
    if (!queryText.trim()) return;
    setIsExecuting(true);
    setErrorMessage(null);
    setValidationSuccess(null);

    try {
      const res: QueryResult = await dbClient.query(queryText);
      setLastResult(res);
      addQueryHistory(queryText);

      // Validate against current SQL challenge
      const validation = ChallengeValidator.validate(queryText, res, activeChallenge);
      if (validation.passed) {
        setValidationSuccess(validation.message);
        showQuestNotification(
          `Curriculum Mastered: ${activeChallenge.title}`,
          activeChallenge.completionStoryMessage
        );
        // Advance story objective
        setObjective(
          'Chapter 1: The Disappearance of Rowan Hale',
          activeChallenge.nextChapterObjective
        );
        if (curriculumLevel < SQL_CURRICULUM.length - 1) {
          setCurriculumLevel(curriculumLevel + 1);
        }
      } else if (validation.feedback) {
        setErrorMessage(validation.message + ' ' + validation.feedback);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'SQL execution error');
      setLastResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-[#120f0d] border-2 border-[#4a2e18] rounded-lg shadow-2xl overflow-hidden text-amber-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a1614] border-b border-[#4a2e18]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5a059] to-[#704214] flex items-center justify-center text-black font-bold shadow-md">
              <Sparkles className="w-4 h-4 text-amber-950" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#c5a059] tracking-wide flex items-center gap-2">
                <span>ARCANE SHERIFF'S SQL GRIMOIRE</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2b1f17] text-amber-300 border border-[#c5a059]/40 font-mono">
                  Level {activeChallenge.level}
                </span>
              </h2>
              <p className="text-xs text-amber-200/60">
                Frontier SQLite WASM • Storage: <span className="text-[#c5a059] font-mono uppercase">{dbStorage}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded hover:bg-[#2b1f17] text-amber-300 transition-colors"
            title="Close Grimoire (Esc or Tab)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Banner */}
        <div className="bg-[#1e1713] border-b border-[#4a2e18] px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-[#c5a059] shrink-0" />
            <div>
              <span className="font-bold text-[#c5a059] uppercase">{activeChallenge.title}:</span>{' '}
              <span className="text-amber-100">{activeChallenge.objective}</span>
            </div>
          </div>
          <button
            onClick={() => setHintIndex((prev) => (prev + 1) % activeChallenge.hints.length)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b1f17] hover:bg-[#3d2c20] text-amber-300 border border-[#c5a059]/40 text-xs shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Hint ({hintIndex + 1}/{activeChallenge.hints.length})</span>
          </button>
        </div>

        {/* Hint Callout */}
        <div className="bg-[#17120f] border-b border-[#4a2e18]/60 px-5 py-1.5 text-xs font-mono text-[#c5a059] italic flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{activeChallenge.hints[hintIndex]}</span>
        </div>

        {/* Main Content: Sidebar + Editor/Results */}
        <div className="flex flex-1 overflow-hidden">
          {/* Schema Sidebar */}
          <div className="w-64 bg-[#161210] border-r border-[#4a2e18] flex flex-col p-3 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#c5a059] uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Town Ledger Tables</span>
            </div>

            <div className="space-y-3">
              {schema.map((table) => (
                <div key={table.tableName} className="rounded bg-[#1f1915] p-2 border border-[#4a2e18]/60">
                  <div
                    onClick={() => setQueryText(`SELECT * FROM ${table.tableName} LIMIT 10;`)}
                    className="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#c5a059] hover:text-amber-200 cursor-pointer"
                    title="Click to query table"
                  >
                    <Table className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>{table.tableName}</span>
                  </div>
                  <div className="mt-1.5 pl-3 border-l border-[#4a2e18]/40 space-y-0.5">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        onClick={() => setQueryText((prev) => `${prev.trim()} ${col.name}`)}
                        className="text-xs font-mono text-amber-200/70 hover:text-amber-100 hover:underline cursor-pointer flex justify-between"
                        title="Click to insert column name"
                      >
                        <span>{col.name}</span>
                        <span className="text-[10px] text-amber-400/40 uppercase">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Templates */}
            <div className="mt-6 pt-3 border-t border-[#4a2e18]/60">
              <div className="text-xs font-bold text-[#c5a059] uppercase mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Canonical Queries</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setQueryText('SELECT * FROM citizens;')}
                  className="w-full text-left text-xs text-amber-200/80 hover:text-[#c5a059] py-1 px-1.5 rounded hover:bg-[#2b1f17] font-mono truncate"
                >
                  SELECT * FROM citizens;
                </button>
                <button
                  onClick={() => setQueryText('SELECT case_number, title, investigator, summary FROM sheriff_records;')}
                  className="w-full text-left text-xs text-amber-200/80 hover:text-[#c5a059] py-1 px-1.5 rounded hover:bg-[#2b1f17] font-mono truncate"
                >
                  Sheriff Records
                </button>
                <button
                  onClick={() => setQueryText('SELECT incident_type, location, timestamp, suspect_description FROM incident_records;')}
                  className="w-full text-left text-xs text-amber-200/80 hover:text-[#c5a059] py-1 px-1.5 rounded hover:bg-[#2b1f17] font-mono truncate"
                >
                  Incident Blotter
                </button>
              </div>
            </div>
          </div>

          {/* Right Editor & Results Pane */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#120f0d]">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col border-b border-[#4a2e18]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#181412] text-xs text-amber-200/70 border-b border-[#4a2e18]/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#c5a059]">SQL Prompt</span>
                  <span>(Press <kbd className="px-1.5 py-0.5 rounded bg-[#2b1f17] text-amber-200 font-mono text-[11px]">Ctrl+Enter</kbd> to run)</span>
                </div>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-4 py-1.5 rounded font-serif font-bold text-sm bg-gradient-to-r from-[#c5a059] to-[#8b4513] hover:from-[#d4af37] hover:to-[#a0522d] text-black shadow-md transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{isExecuting ? 'Casting Spell...' : 'Cast Arcane Query'}</span>
                </button>
              </div>

              {/* CodeMirror 6 Editor */}
              <div className="flex-1 overflow-auto">
                <CodeMirror
                  value={queryText}
                  height="100%"
                  extensions={[sql()]}
                  onChange={(val) => setQueryText(val)}
                  theme="dark"
                  className="h-full"
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="h-64 flex flex-col bg-[#14100e]">
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1614] border-b border-[#4a2e18]/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#c5a059]">Ledger Inspection Output</span>
                  {lastResult && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{lastResult.rowCount} rows ({lastResult.executionTimeMs}ms)</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-amber-200/50">SQLite 3.54 WASM</span>
              </div>

              <div className="flex-1 overflow-auto p-2">
                {/* Validation Success Notification */}
                {validationSuccess && (
                  <div className="mb-2 p-3 rounded bg-emerald-950/50 border border-emerald-600 text-emerald-200 text-xs font-serif whitespace-pre-line shadow">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>CURRICULUM OBJECTIVE COMPLETE:</span>
                    </div>
                    {validationSuccess}
                  </div>
                )}

                {/* Error Callout */}
                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 rounded bg-red-950/40 border border-red-800 text-red-200 text-xs font-mono">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-300">Arcane Disruption (Feedback):</p>
                      <p className="mt-1">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {!errorMessage && !lastResult && !validationSuccess && (
                  <div className="h-full flex items-center justify-center text-amber-200/40 text-xs font-serif italic">
                    Execute a query above to reveal concealed frontier records...
                  </div>
                )}

                {lastResult && (
                  <table className="w-full border-collapse text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-[#1f1915] border-b border-[#4a2e18] text-[#c5a059]">
                        {lastResult.columns.map((col, idx) => (
                          <th key={idx} className="p-2 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#4a2e18]/30">
                      {lastResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#251e18] transition-colors">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="p-2 whitespace-nowrap text-amber-100/90">
                              {val === null ? <span className="text-amber-500/50 italic">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
