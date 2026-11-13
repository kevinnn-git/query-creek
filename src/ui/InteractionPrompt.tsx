import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const InteractionPrompt: React.FC = () => {
  const { activePrompt, activeModal } = useGameStore();

  if (!activePrompt || activeModal !== 'none') return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
      <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/85 border border-[#c5a059] text-amber-100 shadow-2xl backdrop-blur-md">
        <kbd className="px-2 py-0.5 rounded bg-gradient-to-br from-[#c5a059] to-[#8b4513] text-black font-mono font-bold text-xs shadow">
          E
        </kbd>
        <span className="font-serif font-bold text-sm text-[#fdf6e2] tracking-wide">
          {activePrompt}
        </span>
      </div>
    </div>
  );
};

