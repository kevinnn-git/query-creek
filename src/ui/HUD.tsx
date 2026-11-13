import React, { useState, useEffect } from 'react';
import { BookOpen, Compass, Shield, Terminal, Activity, Cpu, Pin, Heart, Sparkles, Crosshair, Map, Settings, HelpCircle } from 'lucide-react';
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

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check if URL has ?debug=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      setShowDebug(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (activeModal === 'menu') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 md:p-6 text-amber-100 select-none">
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

      {/* Crosshair at Screen Center - Unobstructed Aiming */}
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
                isDeadEyeActive ? 'text-amber-400 scale-125' : 'text-amber-100/60 drop-shadow'
              }`}
            />
          </div>
        </div>
      )}

      {/* Top Banner: Current Mystery Objective & Quick Navigation */}
      <div className="flex justify-between items-start gap-4 z-30">
        <div className="pointer-events-auto max-w-lg lg:max-w-xl bg-gradient-to-r from-black/90 via-[#18110b]/90 to-[#120c08]/80 border-l-4 border-[#c5a059] p-3.5 rounded-r shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-[#c5a059]">
            <Compass className="w-4 h-4 text-[#c5a059]" />
            <span className="drop-shadow">{currentChapter}</span>
          </div>
          <p className="mt-1 text-sm text-amber-50 font-serif leading-snug drop-shadow-sm font-medium">
            {currentObjective}
          </p>
        </div>

        {/* Action Navigation: Settings, Map, Corkboard, Grimoire */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setActiveModal(activeModal === 'settings' ? 'none' : 'settings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#140d08] border border-[#c5a059]/70 text-[#c5a059] hover:text-amber-100 hover:border-[#c5a059] hover:bg-[#382618] shadow-lg transition-all"
            title="Open Settings & Archive (O)"
          >
            <Settings className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider hidden sm:inline">Settings</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono border border-[#4a2e18]">O</kbd>
          </button>

          <button
            onClick={() => setActiveModal(activeModal === 'map' ? 'none' : 'map')}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#140d08] border border-[#c5a059]/70 text-[#c5a059] hover:text-amber-100 hover:border-[#c5a059] hover:bg-[#382618] shadow-lg transition-all"
            title="Open Frontier World Map (M)"
          >
            <Map className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider hidden sm:inline">Map</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono border border-[#4a2e18]">M</kbd>
          </button>

          <button
            onClick={() => {
              setInvestigationTab('corkboard');
              setActiveModal(activeModal === 'corkboard' ? 'none' : 'corkboard');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-gradient-to-br from-[#2a1c12] to-[#140d08] border border-[#c5a059]/70 text-[#c5a059] hover:text-amber-100 hover:border-[#c5a059] hover:bg-[#382618] shadow-lg transition-all"
            title="Open Detective Corkboard"
          >
            <Pin className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider hidden sm:inline">Corkboard</span>
          </button>

          <button
            onClick={() => {
              setInvestigationTab('grimoire');
              setActiveModal(activeModal === 'terminal' ? 'none' : 'terminal');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded bg-gradient-to-br from-[#3d2919] to-[#1a110a] border border-[#c5a059] text-amber-200 hover:text-white hover:border-amber-300 shadow-xl transition-all"
            title="Open Arcane SQL Grimoire (Tab)"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider">Grimoire</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono border border-[#c5a059]/50 text-amber-300">TAB</kbd>
          </button>
        </div>
      </div>

      {/* Dead-Eye SQL Combat Bar */}
      <DeadEyeCombatBar />

      {/* Bottom Bar: Health / Mana + Controls Legend + (Clean Gameplay View) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 z-30">
        {/* Sheriff Health & Arcane Mana Bars */}
        <div className="pointer-events-auto bg-black/85 border border-[#4a2e18] p-3 rounded-lg backdrop-blur-md shadow-2xl space-y-2 w-64">
          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold tracking-wider">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>HEALTH</span>
              </span>
              <span className="text-rose-200 font-bold">
                {playerHealth} / {playerMaxHealth}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/80 rounded-full border border-rose-950 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-700 via-rose-500 to-red-400 rounded-full transition-all duration-200 shadow-sm"
                style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>ARCANE MANA</span>
              </span>
              <span className="text-cyan-200 font-bold">
                {playerMana} / {playerMaxMana}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/80 rounded-full border border-cyan-950 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-700 via-cyan-500 to-sky-400 rounded-full transition-all duration-200 shadow-sm"
                style={{ width: `${(playerMana / playerMaxMana) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Exploration & Combat Controls Bar */}
        <div className="pointer-events-auto bg-black/80 border border-[#4a2e18] px-3.5 py-2 rounded-lg backdrop-blur-md shadow-xl text-xs space-y-1">
          <div className="text-[10px] font-bold text-[#c5a059] uppercase tracking-wider">
            Frontier Controls
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-amber-100/90 font-mono text-[11px]">
            <span><strong className="text-amber-300">WASD</strong> Move</span>
            <span><strong className="text-amber-300">Shift</strong> Sprint</span>
            <span><strong className="text-amber-300">Space</strong> Jump</span>
            <span><strong className="text-amber-300">C</strong> Roll</span>
            <span><strong className="text-amber-300">L-Click</strong> Shoot</span>
            <span><strong className="text-amber-300">R-Click / F</strong> Dead-Eye</span>
            <span><strong className="text-amber-300">E</strong> Interrogate</span>
          </div>
        </div>

        {/* Subtle Toggle for Developer Diagnostics */}
        <div className="pointer-events-auto flex items-center">
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="text-[10px] font-mono text-amber-200/50 hover:text-amber-200 px-2 py-1 rounded bg-black/60 border border-[#4a2e18]/60 transition-all"
            title="Toggle Performance Diagnostics (F3)"
          >
            F3 Diagnostics
          </button>
        </div>
      </div>

      {/* Developer Diagnostics Overlay (Toggled via F3 or ?debug=1) */}
      {showDebug && (
        <div className="pointer-events-auto fixed bottom-20 right-6 z-50 bg-black/90 border border-[#c5a059]/80 p-3.5 rounded-lg shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 w-72">
          <div className="flex items-center justify-between border-b border-[#4a2e18] pb-1">
            <span className="font-bold text-[#c5a059] text-[11px] uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#c5a059]" />
              ENGINE DIAGNOSTICS
            </span>
            <span className="text-[10px] text-amber-200/50">[F3 Close]</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-200/70">Framerate:</span>
            <span className={`font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-300' : 'text-rose-400'}`}>
              {fps} FPS
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-200/70">Renderer:</span>
            <span className="text-amber-300 font-bold">{engineType}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-200/70">Draw Calls / Frame:</span>
            <span className="text-amber-100 font-bold">{drawCalls}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-200/70">Active Meshes:</span>
            <span className="text-amber-100">{activeMeshes}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-200/70">SQLite Storage:</span>
            <span className="text-emerald-400 font-bold">{dbReady ? (dbStorage || 'Ready') : 'Connecting...'}</span>
          </div>

          <div className="pt-1 border-t border-[#4a2e18] text-[10px] text-amber-200/60 truncate flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#c5a059] flex-shrink-0" />
            <span className="truncate" title={gpuRenderer}>{gpuRenderer || 'Hardware Accelerated'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
