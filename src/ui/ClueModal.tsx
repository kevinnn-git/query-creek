import React from 'react';
import { FileText, X, BookOpen, Calendar, User } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const ClueModal: React.FC = () => {
  const { activeModal, activeClue, setActiveClue, setActiveModal, setObjective } = useGameStore();

  if (activeModal !== 'clue' || !activeClue) return null;

  const handleOpenGrimoire = () => {
    setActiveClue(null);
    setActiveModal('terminal');
    setObjective(
      'Chapter 1: The Disappearance of Rowan Hale',
      'Use the SQL Grimoire to query the "citizens" table: SELECT * FROM citizens;'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-[#fdf6e2] text-amber-950 border-4 border-[#4a2e18] rounded shadow-2xl p-8 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#4a2e18]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#704214]" />
            <div>
              <h2 className="text-xl font-serif font-black tracking-wide text-[#4a2e18] uppercase">
                {activeClue.title}
              </h2>
              <div className="flex items-center gap-4 text-xs font-serif text-[#704214]/80 mt-0.5">
                {activeClue.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeClue.date}
                  </span>
                )}
                {activeClue.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {activeClue.author}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveClue(null)}
            className="p-1 rounded hover:bg-[#4a2e18]/10 text-amber-950"
            title="Close Clue (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Body (Western handwritten parchment style) */}
        <div className="font-serif text-sm leading-relaxed whitespace-pre-line bg-[#fbf0d0]/60 p-5 rounded border border-[#4a2e18]/20 shadow-inner max-h-[50vh] overflow-y-auto">
          {activeClue.content}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-2">
          <button
            onClick={() => setActiveClue(null)}
            className="px-4 py-2 rounded font-serif font-semibold text-xs border border-[#4a2e18]/60 hover:bg-[#4a2e18]/10 text-[#4a2e18]"
          >
            Close Document
          </button>
          <button
            onClick={handleOpenGrimoire}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-serif font-bold text-sm bg-gradient-to-r from-[#704214] to-[#4a2e18] hover:brightness-110 text-[#fdf6e2] shadow-lg"
          >
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <span>Open SQL Grimoire to Query</span>
          </button>
        </div>
      </div>
    </div>
  );
};

