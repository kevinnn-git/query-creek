import React, { useState } from 'react';
import { Sparkles, Zap, Flame, Target, Play, ShieldAlert, Clock, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { SpellManager } from '../combat/SpellManager';
import { DeadEyeManager } from '../combat/DeadEyeManager';

export const DeadEyeCombatBar: React.FC = () => {
  const {
    isDeadEyeActive,
    deadEyeFocus,
    playerMana,
    consumePlayerMana,
    showQuestNotification,
  } = useGameStore();

  const [customQuery, setCustomQuery] = useState<string>(
    "SELECT p.spell_name, e.enemy_id, p.damage, p.element FROM powers p JOIN active_enemies e ON p.element = e.weakness WHERE e.hp > 0;"
  );
  const [castMessage, setCastMessage] = useState<string | null>(null);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [showCustomBar, setShowCustomBar] = useState<boolean>(true);

  if (!isDeadEyeActive) return null;

  const handleQuickCast = async (slot: number, manaCost: number) => {
    if (playerMana < manaCost) {
      setCastMessage('Insufficient Arcane Mana!');
      return;
    }

    setIsCasting(true);
    setCastMessage(null);
    consumePlayerMana(manaCost);

    const result = await SpellManager.getInstance().castQuickSlot(slot);
    setIsCasting(false);
    setCastMessage(result.message);

    if (result.success && result.targetsHit.length > 0) {
      const weaknessHit = result.targetsHit.some((t) => t.wasWeakness);
      showQuestNotification(
        weaknessHit ? 'CRITICAL ELEMENTAL WEAKNESS EXPLOITED!' : 'Arcane Spell Struck!',
        result.message
      );
    }
  };

  const handleCustomCast = async () => {
    if (!customQuery.trim()) return;
    if (playerMana < 20) {
      setCastMessage('Insufficient Arcane Mana for Custom Spell!');
      return;
    }

    setIsCasting(true);
    setCastMessage(null);
    consumePlayerMana(20);

    const result = await SpellManager.getInstance().executeSpellQuery(customQuery);
    setIsCasting(false);
    setCastMessage(result.message);

    if (result.success && result.targetsHit.length > 0) {
      showQuestNotification('Tactical SQL Spell Evaluated!', result.message);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex flex-col items-center justify-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-200 select-none">
      <div className="max-w-4xl w-full bg-[#18100b]/95 border-2 border-amber-500/80 rounded-xl shadow-2xl p-4 text-amber-100 backdrop-blur-md flex flex-col space-y-3 ring-4 ring-amber-600/30">
        {/* Header Bar: Focus & Slow-Motion Indicator */}
        <div className="flex items-center justify-between border-b border-[#5a381e]/60 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold animate-pulse shadow-md">
              <Clock className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm text-[#f6d078] tracking-widest uppercase flex items-center gap-2">
                <span>DEAD-EYE TIME DILATION (0.15x SLOW-MO)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono border border-amber-600">
                  SQL ARCANE QUICK-CAST
                </span>
              </h3>
              <p className="text-[11px] font-mono text-amber-200/70">
                Press [1-4] to Quick-Cast • Left-Click to shoot • [F] or Right-Click to Exit
              </p>
            </div>
          </div>

          {/* Focus Meter Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-400 font-bold">FOCUS</span>
            <div className="w-32 h-3.5 bg-black/60 rounded-full border border-amber-500/60 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, deadEyeFocus))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback / Result Banner */}
        {castMessage && (
          <div className="px-3 py-1.5 rounded bg-amber-950/70 border border-amber-500/60 text-xs font-serif text-amber-200 text-center animate-in fade-in duration-150">
            {castMessage}
          </div>
        )}

        {/* Quick-Cast Action Slots */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Slot 1: Arcane Volley */}
          <button
            onClick={() => handleQuickCast(1, 15)}
            disabled={isCasting}
            className="flex flex-col items-center p-2.5 rounded-lg bg-[#271911] hover:bg-[#382419] border border-amber-600/40 hover:border-amber-400 transition-all group shadow text-center"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-amber-400 border border-amber-700/50">
                [1]
              </span>
              <span className="text-[10px] font-mono text-amber-300/70">15 MP</span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-serif font-bold text-xs text-amber-100">Deadeye Volley</span>
            <span className="text-[10px] font-mono text-amber-300/50">Arcane • 45 DMG</span>
          </button>

          {/* Slot 2: Thunderstrike */}
          <button
            onClick={() => handleQuickCast(2, 25)}
            disabled={isCasting}
            className="flex flex-col items-center p-2.5 rounded-lg bg-[#271911] hover:bg-[#382419] border border-amber-600/40 hover:border-amber-400 transition-all group shadow text-center"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-cyan-400 border border-cyan-700/50">
                [2]
              </span>
              <span className="text-[10px] font-mono text-cyan-300/70">25 MP</span>
            </div>
            <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-serif font-bold text-xs text-cyan-100">Thunderstrike</span>
            <span className="text-[10px] font-mono text-cyan-300/50">Shock • Stun 2x</span>
          </button>

          {/* Slot 3: Powder Keg */}
          <button
            onClick={() => handleQuickCast(3, 35)}
            disabled={isCasting}
            className="flex flex-col items-center p-2.5 rounded-lg bg-[#271911] hover:bg-[#382419] border border-amber-600/40 hover:border-amber-400 transition-all group shadow text-center"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-rose-400 border border-rose-700/50">
                [3]
              </span>
              <span className="text-[10px] font-mono text-rose-300/70">35 MP</span>
            </div>
            <Flame className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-serif font-bold text-xs text-rose-100">Powder Keg</span>
            <span className="text-[10px] font-mono text-rose-300/50">Fire • 80 DMG</span>
          </button>

          {/* Slot 4: Tactical JOIN Overload */}
          <button
            onClick={() => handleQuickCast(4, 30)}
            disabled={isCasting}
            className="flex flex-col items-center p-2.5 rounded-lg bg-gradient-to-br from-[#382113] to-[#25150c] hover:from-[#492d1c] hover:to-[#331e13] border-2 border-amber-500 transition-all group shadow text-center ring-2 ring-amber-500/20"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500">
                [4]
              </span>
              <span className="text-[10px] font-mono text-amber-300">30 MP</span>
            </div>
            <Target className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-serif font-bold text-xs text-amber-200">Tactical JOIN</span>
            <span className="text-[10px] font-mono text-amber-400/80">Auto-Target Weakness</span>
          </button>
        </div>

        {/* Collapsible Custom SQL Combat Prompt */}
        {showCustomBar && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#4a2e18]/40">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase shrink-0">
              SQL Spell:
            </span>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomCast();
              }}
              className="flex-1 bg-black/70 border border-[#5c3a21] rounded px-2.5 py-1 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
              placeholder="SELECT ... FROM powers JOIN active_enemies ..."
            />
            <button
              onClick={handleCustomCast}
              disabled={isCasting}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-serif font-bold text-xs transition-colors shadow"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Cast</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
