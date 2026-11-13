import React from 'react';
import { BookOpen, Compass, Shield, Terminal, Activity, Cpu } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const HUD: React.FC = () => {
  const {
    currentChapter,
    currentObjective,
    activeModal,
    setActiveModal,
    fps,
    drawCalls,
    activeMeshes,
    engineType,
    gpuRenderer,
    dbReady,
    dbStorage,
  } = useGameStore();

  if (activeModal === 'menu') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-5 text-amber-100 select-none">
      {/* Top Banner: Current Mystery Objective */}
      <div className="flex justify-between items-start">
        <div className="pointer-events-auto max-w-xl bg-gradient-to-r from-black/85 to-[#1a1410]/80 border-l-4 border-[#c5a059] p-3.5 rounded-r shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-[#c5a059]">
            <Compass className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>{currentChapter}</span>
          </div>
          <p className="mt-1 text-sm text-amber-100 font-serif leading-snug">
            {currentObjective}
          </p>
        </div>

        {/* Action Button: Open SQL Grimoire */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setActiveModal(activeModal === 'terminal' ? 'none' : 'terminal')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded bg-gradient-to-br from-[#2a1c12] to-[#160f0a] border border-[#c5a059]/80 text-[#c5a059] hover:text-amber-200 hover:border-[#c5a059] shadow-xl transition-all"
            title="Open Arcane SQL Grimoire (Tab)"
          >
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider">SQL Grimoire</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#120f0d] text-[10px] font-mono border border-[#4a2e18]">TAB</kbd>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Controls Legend + Diagnostics */}
      <div className="flex justify-between items-end">
        {/* Controls Overlay */}
        <div className="pointer-events-auto bg-black/75 border border-[#4a2e18]/80 px-3.5 py-2.5 rounded backdrop-blur-sm shadow-lg text-xs space-y-1">
          <div className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wider mb-1">
            Sheriff Controls
          </div>
          <div className="flex items-center gap-4 text-amber-200/80 font-mono text-[11px]">
            <span><strong className="text-amber-300">WASD</strong> Move</span>
            <span><strong className="text-amber-300">Shift</strong> Sprint</span>
            <span><strong className="text-amber-300">Space</strong> Jump</span>
            <span><strong className="text-amber-300">Tab</strong> Grimoire</span>
            <span><strong className="text-amber-300">Q</strong> Sheriff Sense</span>
            <span><strong className="text-amber-300">F</strong> Dead-Eye</span>
          </div>
        </div>

        {/* Engine Diagnostics Panel */}
        <div className="pointer-events-auto bg-black/75 border border-[#4a2e18]/80 px-3.5 py-2.5 rounded backdrop-blur-sm shadow-lg text-right text-xs space-y-0.5">
          <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#c5a059] font-mono font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span>{fps} FPS</span>
            <span className="text-amber-200/40">|</span>
            <span className="text-amber-300">{engineType}</span>
          </div>
          <div className="text-[10px] text-amber-200/60 font-mono">
            Draw calls: {drawCalls} • Meshes: {activeMeshes}
          </div>
          <div className="text-[10px] text-amber-200/60 font-mono flex items-center justify-end gap-1">
            <Cpu className="w-3 h-3 text-[#c5a059]" />
            <span className="truncate max-w-[200px]" title={gpuRenderer || 'Hardware accelerated'}>
              {gpuRenderer ? gpuRenderer.replace(/ANGLE \(|Direct3D11|vs_.*$/gi, '').trim() : 'GTX 1650 Max-Q / Direct3D'}
            </span>
          </div>
          <div className="text-[10px] font-mono">
            SQLite WASM: <span className={dbReady ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
              {dbReady ? `Ready (${dbStorage})` : 'Initializing...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

