import React, { useState } from 'react';
import { Compass, MapPin, Lock, Unlock, ShieldAlert, Crosshair, X, Eye, Navigation } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { QUERY_CREEK_DISTRICTS, DistrictDefinition } from '../world/Districts';
import { DistrictManager } from '../world/DistrictManager';

export const WorldMapModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    chapterNumber,
    currentChapter,
    currentObjective,
    unlockedDistricts,
    showQuestNotification,
  } = useGameStore();

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictDefinition>(QUERY_CREEK_DISTRICTS[0]);

  if (activeModal !== 'map') return null;

  const districtManager = DistrictManager.getInstance();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-6xl h-[88vh] bg-[#1a120c] border-4 border-[#8c6738] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-amber-100 ring-2 ring-[#c5a059]/40">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-[#2c1d12] via-[#3a2718] to-[#2c1d12] border-b-2 border-[#8c6738]">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-[#f6d078] animate-spin-slow" />
            <div>
              <h2 className="font-serif font-black text-lg text-[#f6d078] tracking-widest uppercase">
                MAP OF QUERY CREEK & FRONTIER TERRITORIES — 1891
              </h2>
              <p className="text-xs font-mono text-amber-200/70">
                Current Campaign: {currentChapter} • Press [M] or [ESC] to Return to Game
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono bg-black/40 px-3 py-1.5 rounded border border-[#5a381e]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Unlock className="w-3.5 h-3.5" /> Unlocked ({unlockedDistricts.length}/8)
              </span>
              <span className="text-amber-200/40">|</span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Lock className="w-3.5 h-3.5" /> Locked ({8 - unlockedDistricts.length})
              </span>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="p-1.5 rounded hover:bg-[#4a2e18] text-amber-200 transition-colors"
              title="Close Map (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Map Visualizer (Left) + District Intel Dossier (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Map Cartography Canvas Simulation */}
          <div className="relative flex-1 bg-[#140e09] p-6 flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r-2 border-[#5a381e]">
            
            {/* Vintage Grid & Compass Watermark */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute top-6 right-6 opacity-20 pointer-events-none">
              <Compass className="w-48 h-48 text-[#c5a059]" />
            </div>

            {/* Simulated Geographic Regions */}
            <div className="relative w-[560px] h-[480px] border-2 border-dashed border-[#5a381e]/80 rounded-2xl p-4 bg-[#1e150d]/70 backdrop-blur-sm shadow-inner">
              
              {/* Region Label Watermarks */}
              <div className="absolute top-4 left-6 text-[10px] font-mono tracking-widest text-amber-500/40 uppercase">
                ▲ Whispering Pines Ridge
              </div>
              <div className="absolute bottom-4 right-6 text-[10px] font-mono tracking-widest text-amber-500/40 uppercase">
                ▼ North Ridge Canyon & Mines
              </div>
              <div className="absolute top-1/2 left-3 text-[10px] font-mono tracking-widest text-amber-500/40 uppercase rotate-90">
                ◀ Iron Railway Spur
              </div>

              {/* District Node Pins */}
              {QUERY_CREEK_DISTRICTS.map((district) => {
                const isUnlocked = unlockedDistricts.includes(district.id) || chapterNumber >= district.unlockedAtChapter;
                const isSelected = selectedDistrict.id === district.id;

                // Normalized screen coordinates (world bounds: x in [-40, 50], z in [-45, 40])
                const leftPct = ((district.center.x + 45) / 95) * 100;
                const topPct = ((-district.center.z + 45) / 90) * 100;

                return (
                  <button
                    key={district.id}
                    onClick={() => setSelectedDistrict(district)}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center transition-all duration-200 z-20 ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                    }`}
                  >
                    {/* Pulsing Pin Ring */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                        isUnlocked
                          ? isSelected
                            ? 'bg-amber-400 text-black border-amber-200 ring-4 ring-amber-500/50'
                            : 'bg-[#2a1c12] text-amber-300 border-[#c5a059] hover:bg-[#3d291a]'
                          : 'bg-[#180a0a] text-rose-500 border-rose-800/80'
                      }`}
                    >
                      {isUnlocked ? (
                        <MapPin className="w-5 h-5 fill-current" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    {/* Label Badge */}
                    <div
                      className={`mt-1.5 px-2 py-0.5 rounded text-[11px] font-serif font-bold whitespace-nowrap shadow-md border ${
                        isSelected
                          ? 'bg-amber-300 text-black border-amber-400'
                          : isUnlocked
                          ? 'bg-[#18110b]/90 text-amber-200 border-[#6a4628]'
                          : 'bg-black/90 text-rose-400/80 border-rose-950'
                      }`}
                    >
                      {district.shortName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* District Dossier & Points of Interest Panel (Right) */}
          <div className="w-full lg:w-96 bg-[#1a130c] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Selected District Header */}
              <div className="border-b border-[#5a381e] pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      unlockedDistricts.includes(selectedDistrict.id) || chapterNumber >= selectedDistrict.unlockedAtChapter
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}
                  >
                    {unlockedDistricts.includes(selectedDistrict.id) || chapterNumber >= selectedDistrict.unlockedAtChapter
                      ? 'TERRITORY UNLOCKED'
                      : `SEALED • UNLOCKS CH. ${selectedDistrict.unlockedAtChapter}`}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400/60">
                    Pos: ({selectedDistrict.center.x}, {selectedDistrict.center.z})
                  </span>
                </div>
                <h3 className="font-serif font-black text-xl text-[#f6d078] leading-tight">
                  {selectedDistrict.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs font-serif text-amber-200/90 leading-relaxed bg-black/30 p-3 rounded border border-[#4a2e18]">
                {selectedDistrict.description}
              </p>

              {/* Points of Interest */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-[#c5a059] tracking-wider mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Key Points of Interest</span>
                </h4>
                <div className="space-y-2">
                  {selectedDistrict.pointsOfInterest.map((poi) => (
                    <div
                      key={poi.id}
                      className="p-2.5 rounded bg-[#24170e]/80 border border-[#4a2e18] flex items-start gap-2.5"
                    >
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-serif font-bold text-amber-100">
                          {poi.name}
                        </div>
                        <div className="text-[10px] font-mono text-amber-300/60">
                          Coordinates: ({poi.coordinates.x}, {poi.coordinates.z}) • Type: {poi.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#5a381e] space-y-2">
              <button
                onClick={() => {
                  showQuestNotification(
                    `District Selected: ${selectedDistrict.name}`,
                    `Objective updated towards ${selectedDistrict.name}.`
                  );
                  setActiveModal('none');
                }}
                className="w-full py-2.5 rounded bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Set Objective Waypoint
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-2.5 bg-[#140e09] border-t border-[#5a381e] flex flex-wrap items-center justify-between text-[11px] font-mono text-amber-300/70">
          <div className="flex items-center gap-4">
            <span><strong className="text-amber-200">Current Objective:</strong> {currentObjective}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Click any territory pin to inspect</span>
            <span>•</span>
            <span>Press <strong className="text-amber-300">[M]</strong> or <strong className="text-amber-300">[ESC]</strong> to resume play</span>
          </div>
        </div>

      </div>
    </div>
  );
};

