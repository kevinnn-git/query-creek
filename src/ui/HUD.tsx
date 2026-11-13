import React from 'react';
import { BookOpen, Compass, Shield, Terminal, Activity, Cpu, Pin, Heart, Sparkles, Crosshair, Map } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { DeadEyeCombatBar } from './DeadEyeCombatBar';

export const HUD: React.FC = () => {
  const {
    currentChapter,
    currentObjective,
    activeModal,
    setActiveModal,
    setInvestigationTab,
    fps,
    drawCalls,
    activeMeshes,
    engineType,
    gpuRenderer,
    dbReady,
    dbStorage,
    playerHealth,
    playerMaxHealth,
    playerMana,
    playerMaxMana,
    isDeadEyeActive,
  } = useGameStore();

  if (activeModal === 'menu') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-5 text-amber-100 select-none">
      {/* Cinematic Sepia Vignette during Dead-Eye */}
      {isDeadEyeActive && (
        <div
          className="fixed inset-0 pointer-events-none z-10 animate-in fade-in duration-300"
          style={{
            background: `radial-gradient(ellipse at center, rgba(160, 100, 30, 0.15) 0%, rgba(30, 15, 5, 0.75) 85%, rgba(10, 5, 0, 0.95) 100%)`,
            boxShadow: 'inset 0 0 100px rgba(180, 110, 40, 0.5)',
          }}
        />
      )}

      {/* Crosshair at Screen Center */}
      {activeModal === 'none' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className={`transition-all duration-200 ${
              isDeadEyeActive
                ? 'w-10 h-10 border-2 border-amber-400 rounded-full animate-ping opacity-75'
                : 'w-4 h-4'
            }`}
          >
            <Crosshair
              className={`w-full h-full ${
                isDeadEyeActive ? 'text-amber-400 scale-125' : 'text-amber-200/50'
              }`}
            />
          </div>
        </div>
      )}

      {/* Top Banner: Current Mystery Objective */}
      <div className="flex justify-between items-start z-30">
        <div className="pointer-events-auto max-w-xl bg-gradient-to-r from-black/85 to-[#1a1410]/80 border-l-4 border-[#c5a059] p-3.5 rounded-r shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-[#c5a059]">
            <Compass className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>{currentChapter}</span>
          </div>
          <p className="mt-1 text-sm text-amber-100 font-serif leading-snug">
            {currentObjective}
          </p>
        </div>

        {/* Action Buttons: Open SQL Grimoire / Corkboard / World Map */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setActiveModal(activeModal === 'map' ? 'none' : 'map')}
            className="flex items-center gap-2 px-3 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#160f0a] border border-[#c5a059]/80 text-[#c5a059] hover:text-amber-200 hover:border-[#c5a059] shadow-xl transition-all"
            title="Open Frontier World Map (M)"
          >
            <Map className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider">Map</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#120f0d] text-[10px] font-mono border border-[#4a2e18]">M</kbd>
          </button>

          <button
            onClick={() => {
              setInvestigationTab('corkboard');
              setActiveModal(activeModal === 'corkboard' ? 'none' : 'corkboard');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#160f0a] border border-[#c5a059]/80 text-[#c5a059] hover:text-amber-200 hover:border-[#c5a059] shadow-xl transition-all"
            title="Open Detective Corkboard"
          >
            <Pin className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider">Corkboard</span>
          </button>

          <button
            onClick={() => {
              setInvestigationTab('grimoire');
              setActiveModal(activeModal === 'terminal' ? 'none' : 'terminal');
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#160f0a] border border-[#c5a059]/80 text-[#c5a059] hover:text-amber-200 hover:border-[#c5a059] shadow-xl transition-all"
            title="Open Arcane SQL Grimoire (Tab)"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider">Grimoire</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#120f0d] text-[10px] font-mono border border-[#4a2e18]">TAB</kbd>
          </button>
        </div>
      </div>

      {/* Dead-Eye SQL Combat Bar */}
      <DeadEyeCombatBar />

      {/* Bottom Bar: Health / Mana + Controls Legend + Diagnostics */}
      <div className="flex justify-between items-end z-30">
        {/* Player Health & Mana Bars */}
        <div className="pointer-events-auto bg-black/80 border border-[#4a2e18]/80 p-3 rounded-lg backdrop-blur-sm shadow-xl space-y-2 w-64">
          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>HEALTH</span>
              </span>
              <span className="text-rose-200 font-bold">
                {playerHealth} / {playerMaxHealth}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/70 rounded-full border border-rose-900/60 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-700 to-red-500 rounded-full transition-all duration-200"
                style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>ARCANE MANA</span>
              </span>
              <span className="text-cyan-200 font-bold">
                {playerMana} / {playerMaxMana}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/70 rounded-full border border-cyan-900/60 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-700 to-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${(playerMana / playerMaxMana) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="pointer-events-auto bg-black/75 border border-[#4a2e18]/80 px-3.5 py-2.5 rounded backdrop-blur-sm shadow-lg text-xs space-y-1">
          <div className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wider mb-1">
            Sheriff Combat & Exploration Controls
          </div>
          <div className="flex items-center gap-3 text-amber-200/80 font-mono text-[11px]">
            <span><strong className="text-amber-300">WASD</strong> Move</span>
            <span><strong className="text-amber-300">Shift</strong> Sprint</span>
            <span><strong className="text-amber-300">Space</strong> Jump</span>
            <span><strong className="text-amber-300">C</strong> Dodge Roll</span>
            <span><strong className="text-amber-300">L-Click</strong> Shoot</span>
            <span><strong className="text-amber-300">R-Click / F</strong> Dead-Eye</span>
            <span><strong className="text-amber-300">M</strong> Map</span>
            <span><strong className="text-amber-300">Tab</strong> Grimoire</span>
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
            <span className="truncate max-w-[150px]">{gpuRenderer || 'Hardware Accelerated'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
