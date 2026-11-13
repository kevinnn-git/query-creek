import React from 'react';
import { Award, Shield, CheckCircle, BookOpen, Star, RefreshCw, X, Compass } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const EpilogueModal: React.FC = () => {
  const { activeModal, setActiveModal, currentChapter } = useGameStore();

  if (activeModal !== 'epilogue') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-lg animate-in fade-in duration-500 select-none">
      <div className="relative w-full max-w-4xl bg-[#18110b] border-4 border-[#c5a059] rounded-2xl shadow-[0_0_80px_rgba(218,165,32,0.4)] flex flex-col overflow-hidden text-amber-100 ring-4 ring-[#c5a059]/30">
        
        {/* Cinematic Golden Banner */}
        <div className="px-8 py-6 bg-gradient-to-r from-[#2c1d12] via-[#4a321e] to-[#2c1d12] border-b-2 border-[#c5a059] text-center relative">
          <div className="inline-flex p-3 rounded-full bg-amber-500/20 border-2 border-amber-400 mb-2">
            <Star className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#f6d078] tracking-widest uppercase">
            THE LAST LEDGER: JUSTICE RESTORED
          </h2>
          <p className="text-xs font-mono text-amber-200/80 uppercase tracking-widest mt-1">
            Query Creek Frontier Noir Campaign Concluded
          </p>
        </div>

        {/* Story Scroll Body */}
        <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6 text-center">
          <div className="max-w-2xl mx-auto space-y-4 font-serif text-sm sm:text-base text-amber-100/90 leading-relaxed italic bg-black/40 p-6 rounded-xl border border-[#5a381e]">
            <p>
              "The dust settles over the North Ridge Canyon as Mayor Gideon Vale's Arcane Aegis collapses into inert obsidian shards. From the depths of the underground shaft, the true Master Ledger is brought back into the sunlight."
            </p>
            <p>
              "In the belfry of the Old Pioneer Church, a silhouette steps forward—Rowan Hale, bruised but alive, tipping his brim toward you with a grim nod. The conspiracy that held Query Creek in shadows has been broken, not through hollow violence, but through the undeniable truth of relational law."
            </p>
            <p className="text-[#f6d078] font-bold not-italic">
              Every coin accounted for. Every false alibi shattered. Every manipulated manifest reconciled.
            </p>
          </div>

          {/* Achievement Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-lg bg-[#22160d] border border-[#c5a059]/60 flex items-start gap-3">
              <Shield className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-xs uppercase text-amber-200">Arcane Sheriff Star</h4>
                <p className="text-[11px] font-mono text-amber-300/70">Restored law across all 8 frontier districts</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#22160d] border border-[#c5a059]/60 flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-xs uppercase text-amber-200">Grand Magister of SQL</h4>
                <p className="text-[11px] font-mono text-amber-300/70">Mastered Levels 0-9 from SELECT to json_extract</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#22160d] border border-[#c5a059]/60 flex items-start gap-3">
              <Award className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-xs uppercase text-amber-200">The Master Ledger</h4>
                <p className="text-[11px] font-mono text-amber-300/70">Recovered 100% of Rowan Hale’s investigation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 bg-[#140e09] border-t border-[#5a381e] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono text-amber-200/60">
            Thank you for playing Query Creek: Frontier Noir — The Last Ledger.
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModal('map')}
              className="px-4 py-2 rounded bg-[#2e1d13] hover:bg-[#4a2e18] border border-[#c5a059] text-amber-200 text-xs font-serif font-bold tracking-wider flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>World Map</span>
            </button>

            <button
              onClick={() => setActiveModal('none')}
              className="px-5 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black text-xs font-serif font-black uppercase tracking-wider shadow-lg"
            >
              Resume Free Roam
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

