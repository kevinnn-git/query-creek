import React, { useState } from 'react';
import { MessageSquare, User, ArrowRight, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const DialoguePanel: React.FC = () => {
  const { activeModal, activeDialogue, setActiveDialogue, setObjective } = useGameStore();
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);

  if (activeModal !== 'dialogue' || !activeDialogue) return null;

  // Resolve current dialogue step
  const dialogueList = activeDialogue.dialogue || [];
  const currentStep = currentStepId
    ? dialogueList.find((s: any) => s.id === currentStepId)
    : dialogueList[0];

  const handleSelectResponse = (resp: any) => {
    if (resp.nextId === 'close') {
      setActiveDialogue(null);
      setCurrentStepId(null);
      // Advance objective if spoke with mayor
      setObjective(
        'Chapter 1: The Disappearance of Rowan Hale',
        "Inspect Rowan Hale's desk in the Sheriff's Office or open the SQL Grimoire to verify Mayor Vale's claims."
      );
    } else {
      setCurrentStepId(resp.nextId);
    }
  };

  const handleClose = () => {
    setActiveDialogue(null);
    setCurrentStepId(null);
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

        {/* Spoken Text */}
        <div className="font-serif text-sm leading-relaxed text-amber-100/90 min-h-[50px] bg-[#1a1411] p-4 rounded border border-[#4a2e18]/40">
          "{currentStep?.text}"
        </div>

        {/* Responses */}
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
        </div>
      </div>
    </div>
  );
};
