import React from 'react';
import { Play, Settings, BookOpen, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const MainMenu: React.FC = () => {
  const { activeModal, setActiveModal, engineReady, dbReady, engineType } = useGameStore();

  if (activeModal !== 'menu') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a170d]/60 via-black/90 to-black text-amber-100 p-6 select-none animate-in fade-in duration-300">
      <div className="max-w-xl w-full flex flex-col items-center text-center space-y-8 p-8 border-2 border-[#5c3a21] bg-[#140e0b]/90 rounded-lg shadow-2xl backdrop-blur-md">
        {/* Western Sheriff Star / Seal */}
        <div className="w-16 h-16 rounded-full border-2 border-[#c5a059] bg-gradient-to-br from-[#704214] to-[#2b170c] flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-[#c5a059]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <p className="text-xs font-serif font-bold uppercase tracking-[0.3em] text-[#c5a059]">
            A Cinematic Third-Person Open-World SQL RPG
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fdf6e2] via-[#e6ca85] to-[#c5a059] drop-shadow-md">
            QUERY CREEK
          </h1>
          <h2 className="text-lg md:text-xl font-serif italic text-amber-200/80 tracking-widest uppercase">
            FRONTIER NOIR • THE LAST LEDGER
          </h2>
        </div>

        {/* System Readiness Status */}
        <div className="w-full bg-[#1b1410] border border-[#4a2e18] p-3 rounded text-xs font-mono space-y-1">
          <div className="flex justify-between text-amber-200/70">
            <span>Graphics Engine:</span>
            <span className={engineReady ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {engineReady ? `${engineType} Active` : 'Booting...'}
            </span>
          </div>
          <div className="flex justify-between text-amber-200/70">
            <span>Investigation Database:</span>
            <span className={dbReady ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {dbReady ? 'SQLite WASM Ready' : 'Initializing...'}
            </span>
          </div>
          <div className="flex justify-between text-amber-200/70">
            <span>3D Asset Registry:</span>
            <span className="text-emerald-400 font-bold">40 Local Verified Assets (CC0)</span>
          </div>
        </div>

        {/* Menu Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => setActiveModal('none')}
            disabled={!engineReady}
            className="w-full py-3.5 px-6 rounded font-serif font-bold text-base bg-gradient-to-r from-[#c5a059] via-[#d4af37] to-[#8b4513] hover:brightness-110 text-black shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Enter Query Creek</span>
          </button>

          <button
            onClick={() => setActiveModal('terminal')}
            className="w-full py-2.5 px-6 rounded font-serif font-semibold text-sm bg-[#221812] hover:bg-[#2d2018] border border-[#4a2e18] text-amber-200 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <span>Open SQL Grimoire</span>
          </button>
        </div>

        <p className="text-[11px] text-amber-200/40 font-serif italic">
          "The truth was recorded in the ledgers. You just need to know how to query them."
        </p>
      </div>
    </div>
  );
};

