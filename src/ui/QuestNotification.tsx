import React, { useEffect } from 'react';
import { Award, CheckCircle, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const QuestNotification: React.FC = () => {
  const { activeQuestNotification, clearQuestNotification } = useGameStore();

  useEffect(() => {
    if (activeQuestNotification) {
      const timer = setTimeout(() => {
        clearQuestNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeQuestNotification, clearQuestNotification]);

  if (!activeQuestNotification) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="flex items-center gap-3.5 px-6 py-4 rounded-lg bg-gradient-to-r from-[#24170f] via-[#1a110a] to-[#24170f] border-2 border-[#c5a059] shadow-2xl backdrop-blur-md max-w-lg text-amber-100">
        <div className="w-10 h-10 rounded-full bg-[#c5a059] flex items-center justify-center shrink-0 shadow-lg">
          <Award className="w-6 h-6 text-black" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-serif font-black uppercase tracking-widest text-[#c5a059]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeQuestNotification.title}</span>
          </div>
          <p className="mt-0.5 text-xs font-serif leading-snug text-amber-100/90">
            {activeQuestNotification.message}
          </p>
        </div>
      </div>
    </div>
  );
};
