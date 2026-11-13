import React, { useState } from 'react';
import { MessageSquare, User, ArrowRight, X, Sparkles, FileText, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { InterrogationManager } from '../investigation/InterrogationManager';
import { EvidenceItem } from '../investigation/types';

export const DialoguePanel: React.FC = () => {
  const {
    activeModal,
    activeDialogue,
    setActiveDialogue,
    setObjective,
    evidenceList,
    recordContradiction,
    showQuestNotification,
    curriculumLevel,
    setCurriculumLevel,
  } = useGameStore();

  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [showEvidenceSelector, setShowEvidenceSelector] = useState<boolean>(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [contradictionResult, setContradictionResult] = useState<{
    success: boolean;
    title?: string;
    message: string;
  } | null>(null);

  if (activeModal !== 'dialogue' || !activeDialogue) return null;

  // Resolve current dialogue step
  const dialogueList = activeDialogue.dialogue || [];
  const currentStep = currentStepId
    ? dialogueList.find((s: any) => s.id === currentStepId)
    : dialogueList[0];

  const npcId = activeDialogue.npcId || 'mayor_gideon_vale';

  const handleSelectResponse = (resp: any) => {
    setContradictionResult(null);
    if (resp.nextId === 'close') {
      setActiveDialogue(null);
      setCurrentStepId(null);
      setObjective(
        'Chapter 1: The Disappearance of Rowan Hale',
        "Inspect Rowan Hale's desk in the Sheriff's Office or open the SQL Grimoire to verify Mayor Vale's claims."
      );
    } else {
      setCurrentStepId(resp.nextId);
    }
  };

  const handlePresentEvidence = () => {
    if (!selectedEvidenceId) return;
    const evidence = evidenceList.find((e) => e.id === selectedEvidenceId);
    if (!evidence) return;

    const evalResult = InterrogationManager.evaluateContradiction(
      npcId,
      currentStep?.id || 'start',
      evidence
    );

    if (evalResult.isContradiction && evalResult.rule) {
      setContradictionResult({
        success: true,
        title: evalResult.rule.contradictionTitle,
        message: evalResult.rule.storyProgressObjective,
      });

      // Advance story & curriculum
      recordContradiction(evalResult.rule.contradictionTitle);
      showQuestNotification(
        `CONTRADICTION SHATTERED: ${evalResult.rule.contradictionTitle}`,
        evalResult.rule.storyProgressObjective
      );

      if (evalResult.rule.advancesChapter) {
        setObjective(evalResult.rule.advancesChapter, evalResult.rule.storyProgressObjective);
      }

      if (curriculumLevel < 2) {
        setCurriculumLevel(2);
      }

      // Switch to cornered response
      if (evalResult.nextStepId) {
        setCurrentStepId(evalResult.nextStepId);
      }
    } else {
      setContradictionResult({
        success: false,
        message: evalResult.feedbackMessage,
      });
    }

    setShowEvidenceSelector(false);
  };

  const handleClose = () => {
    setActiveDialogue(null);
    setCurrentStepId(null);
    setShowEvidenceSelector(false);
    setContradictionResult(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="max-w-3xl w-full bg-[#16110e]/95 border-2 border-[#5c3a21] rounded-lg shadow-2xl p-6 text-amber-100 backdrop-blur-md flex flex-col space-y-4">
        {/* Header / Speaker Info */}
        <div className="flex items-center justify-between border-b border-[#4a2e18]/60 pb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c5a059] to-[#4a2e18] flex items-center justify-center text-black font-bold border border-[#c5a059]">
              <User className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#c5a059]">
                {currentStep ? currentStep.speaker : activeDialogue.npcName}
              </h3>
              <p className="text-xs font-mono text-amber-200/60">{activeDialogue.role}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-[#2b1f17] text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contradiction Result Alert */}
        {contradictionResult && (
          <div
            className={`p-3 rounded border text-xs font-serif ${
              contradictionResult.success
                ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-amber-950/60 border-amber-600/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {contradictionResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300 uppercase tracking-wide">
                    {contradictionResult.title || 'Contradiction Shattered!'}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">Witness Rebuttal:</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">{contradictionResult.message}</p>
          </div>
        )}

        {/* Spoken Text */}
        <div className="font-serif text-sm leading-relaxed text-amber-100/90 min-h-[50px] bg-[#1a1411] p-4 rounded border border-[#4a2e18]/40 shadow-inner">
          "{currentStep?.text}"
        </div>

        {/* Responses & Contradiction Action */}
        <div className="space-y-2 pt-1">
          {currentStep?.responses?.map((resp: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelectResponse(resp)}
              className="w-full text-left px-4 py-2.5 rounded bg-[#221812] hover:bg-[#2d2018] border border-[#4a2e18] hover:border-[#c5a059]/60 text-xs font-serif text-amber-200 hover:text-amber-100 flex items-center justify-between group transition-all"
            >
              <span>{resp.text}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c5a059] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {/* Present Evidence Button */}
          <button
            onClick={() => setShowEvidenceSelector(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-gradient-to-r from-[#4a2e18] via-[#633e20] to-[#4a2e18] hover:from-[#5e3b1f] hover:to-[#5e3b1f] border border-[#c5a059]/60 text-amber-200 hover:text-amber-100 text-xs font-serif font-bold transition-all shadow-md group mt-1"
          >
            <Sparkles className="w-4 h-4 text-[#c5a059] group-hover:rotate-12 transition-transform" />
            <span>PRESS WITH FORENSIC EVIDENCE ({evidenceList.length} Clues Collected)</span>
          </button>
        </div>

        {/* Evidence Selection Modal */}
        {showEvidenceSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-xl w-full bg-[#1c140f] border-2 border-[#5c3a21] rounded-lg p-5 shadow-2xl flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-[#4a2e18] pb-2">
                <h4 className="font-serif font-bold text-sm text-[#c5a059] flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Select Evidence to Present</span>
                </h4>
                <button
                  onClick={() => setShowEvidenceSelector(false)}
                  className="text-amber-300/60 hover:text-amber-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs font-serif text-amber-200/70">
                Choose a collected document, witness statement, or SQL record to challenge the speaker's claims:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvidenceId(ev.id)}
                    className={`p-2.5 rounded border cursor-pointer transition-all ${
                      selectedEvidenceId === ev.id
                        ? 'bg-[#3b2416] border-[#c5a059] text-amber-100 ring-2 ring-[#c5a059]/50'
                        : 'bg-[#241912] border-[#4a2e18] text-amber-200/80 hover:bg-[#2e2017]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#c5a059] font-bold">
                      <span>{ev.type}</span>
                      <span>{ev.dateDiscovered}</span>
                    </div>
                    <p className="font-serif font-bold text-xs mt-0.5">{ev.title}</p>
                    <p className="text-[11px] font-serif italic text-amber-200/60 line-clamp-2 mt-0.5">
                      "{ev.snippet}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#4a2e18]">
                <button
                  onClick={() => setShowEvidenceSelector(false)}
                  className="px-3 py-1.5 rounded bg-[#2b1f17] hover:bg-[#3d2c20] text-amber-200 text-xs font-serif"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePresentEvidence}
                  disabled={!selectedEvidenceId}
                  className="px-4 py-1.5 rounded bg-[#c5a059] hover:bg-amber-400 text-black font-serif font-bold text-xs shadow disabled:opacity-40"
                >
                  Present Evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
