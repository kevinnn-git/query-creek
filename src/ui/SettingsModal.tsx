import React, { useState } from 'react';
import { Volume2, VolumeX, Monitor, Save, Download, RotateCcw, X, Sliders, CheckCircle, Shield } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { AudioManager } from '../audio/AudioManager';
import { AtmosphereManager, GraphicsQuality } from '../engine/AtmosphereManager';
import { SaveManager } from '../save/SaveManager';

export const SettingsModal: React.FC = () => {
  const { activeModal, setActiveModal, showQuestNotification } = useGameStore();

  const initialTab =
    (typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('settings_tab') as any)) ||
    'audio';
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'save'>(initialTab);
  const [masterVol, setMasterVol] = useState<number>(0.8);
  const [sfxVol, setSfxVol] = useState<number>(0.8);
  const [ambienceVol, setAmbienceVol] = useState<number>(0.4);
  const [musicVol, setMusicVol] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [qualityPreset, setQualityPreset] = useState<GraphicsQuality>('medium');

  if (activeModal !== 'settings') return null;

  const audio = AudioManager.getInstance();
  const atmosphere = AtmosphereManager.getInstance();
  const saveManager = SaveManager.getInstance();
  const savedSlots = saveManager.getSavedSlots();

  const handleMasterVolChange = (val: number) => {
    setMasterVol(val);
    audio.setMasterVolume(val);
  };

  const handleSfxVolChange = (val: number) => {
    setSfxVol(val);
    audio.setSfxVolume(val);
  };

  const handleAmbienceVolChange = (val: number) => {
    setAmbienceVol(val);
    audio.setAmbienceVolume(val);
  };

  const handleMusicVolChange = (val: number) => {
    setMusicVol(val);
    audio.setMusicVolume(val);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const handleQualityChange = (preset: GraphicsQuality) => {
    setQualityPreset(preset);
    atmosphere.applyQualityPreset(preset);
    showQuestNotification(
      'GRAPHICS QUALITY UPDATED',
      `Performance preset set to: ${preset.toUpperCase()}`
    );
  };

  const handleManualSave = () => {
    saveManager.saveGame('slot_manual', 'Sheriff Ledger Save');
  };

  const handleLoadSlot = (slotId: string) => {
    const ok = saveManager.loadGame(slotId);
    if (ok) {
      setActiveModal('none');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-[#1a120c] border-4 border-[#8c6738] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-amber-100 ring-2 ring-[#c5a059]/40">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2c1d12] via-[#3a2718] to-[#2c1d12] border-b-2 border-[#8c6738]">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#f6d078]" />
            <h2 className="font-serif font-black text-lg text-[#f6d078] tracking-widest uppercase">
              SHERIFF’S SETTINGS & ARCHIVE
            </h2>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded hover:bg-[#4a2e18] text-amber-200 transition-colors"
            title="Close Settings (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#5a381e] bg-[#140e09] px-6 pt-2">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2.5 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'audio'
                ? 'border-[#c5a059] text-[#f6d078] bg-[#22160d]'
                : 'border-transparent text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio & Sound</span>
          </button>

          <button
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-2 px-4 py-2.5 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'graphics'
                ? 'border-[#c5a059] text-[#f6d078] bg-[#22160d]'
                : 'border-transparent text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Graphics Quality</span>
          </button>

          <button
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-2 px-4 py-2.5 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'save'
                ? 'border-[#c5a059] text-[#f6d078] bg-[#22160d]'
                : 'border-transparent text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save & Load Game</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a2e18]">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#f6d078]">Mute Audio</h4>
                  <p className="text-xs text-amber-200/60">Silence all sound effects and procedural music</p>
                </div>
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded border flex items-center gap-2 font-mono text-xs ${
                    isMuted
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-[#2a1c12] text-amber-300 border-[#c5a059]'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isMuted ? 'UNMUTE' : 'MUTE ALL'}</span>
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span>Master Volume</span>
                  <span className="text-amber-300">{Math.round(masterVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVol}
                  onChange={(e) => handleMasterVolChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* SFX Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span>Combat & Footsteps SFX</span>
                  <span className="text-amber-300">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={(e) => handleSfxVolChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Ambience Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span>Frontier Canyon Wind Ambience</span>
                  <span className="text-amber-300">{Math.round(ambienceVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambienceVol}
                  onChange={(e) => handleAmbienceVolChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Music Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span>Saloon Honky-Tonk Piano</span>
                  <span className="text-amber-300">{Math.round(musicVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  onChange={(e) => handleMusicVolChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Graphics Quality Tab */}
          {activeTab === 'graphics' && (
            <div className="space-y-5">
              <div className="text-xs text-amber-200/80 leading-relaxed bg-black/30 p-3.5 rounded border border-[#4a2e18]">
                Adjust rendering fidelity for your NVIDIA GeForce GTX 1650 Max-Q or integrated GPU. Higher settings increase shadow map resolution, post-processing bloom, and atmospheric dust particle counts.
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as GraphicsQuality[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleQualityChange(preset)}
                    className={`p-4 rounded-lg border text-center transition-all flex flex-col items-center gap-2 ${
                      qualityPreset === preset
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-500/40'
                        : 'bg-[#22160d] border-[#4a2e18] text-amber-200/60 hover:text-amber-100 hover:border-[#6a4628]'
                    }`}
                  >
                    <span className="font-serif font-bold text-sm uppercase tracking-wider">
                      {preset} Quality
                    </span>
                    <span className="text-[10px] font-mono text-amber-300/70">
                      {preset === 'high'
                        ? '2048 Shadow • 800 Particles • Full Bloom'
                        : preset === 'medium'
                        ? '1024 Shadow • 350 Particles • Vignette'
                        : '512 Shadow • 0 Particles • Minimal Post'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save & Load Game Tab */}
          {activeTab === 'save' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a2e18]">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#f6d078]">Manual Ledger Save</h4>
                  <p className="text-xs text-amber-200/60">Record your current chapter, evidence, and SQL progress</p>
                </div>
                <button
                  onClick={handleManualSave}
                  className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Progress</span>
                </button>
              </div>

              <div className="space-y-3">
                <h5 className="font-mono text-xs font-bold text-[#c5a059] uppercase tracking-wider">
                  Available Saved Checkpoints ({savedSlots.length})
                </h5>

                {savedSlots.length === 0 ? (
                  <div className="text-xs font-mono text-amber-200/50 p-4 rounded bg-black/30 border border-[#4a2e18] text-center">
                    No saved checkpoints recorded yet. Click "Save Progress" above.
                  </div>
                ) : (
                  savedSlots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="p-3 rounded bg-[#24170e] border border-[#4a2e18] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-serif font-bold text-xs text-amber-100 flex items-center gap-2">
                          <span>{slot.name}</span>
                          <span className="text-[10px] font-mono text-amber-400/60">
                            {new Date(slot.savedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-amber-300/70">
                          {slot.chapter}
                        </div>
                      </div>

                      <button
                        onClick={() => handleLoadSlot(slot.slotId)}
                        className="px-3 py-1.5 rounded bg-[#3d291a] hover:bg-[#5a381e] border border-[#c5a059] text-amber-200 text-xs font-mono font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>LOAD</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#140e09] border-t border-[#5a381e] flex justify-between items-center text-xs font-mono text-amber-200/60">
          <span>Settings persist automatically in local browser storage</span>
          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 rounded bg-[#2a1c12] hover:bg-[#4a2e18] text-amber-200 font-serif font-bold border border-[#5a381e]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
