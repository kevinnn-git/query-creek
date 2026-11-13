import { create } from 'zustand';
import { QueryResult, TableSchema } from '../db/types';

export interface GameStore {
  // Engine
  engineType: 'WebGPU' | 'WebGL2' | 'WebGL1' | 'Unknown';
  engineReady: boolean;
  engineError: string | null;
  fps: number;
  drawCalls: number;
  activeMeshes: number;
  gpuRenderer: string;
  setEngineInfo: (info: { engineType: any; gpuRenderer?: string; engineReady: boolean; engineError?: string | null }) => void;
  updateDiagnostics: (fps: number, drawCalls: number, activeMeshes: number) => void;

  // Database
  dbReady: boolean;
  dbStorage: string;
  dbError: string | null;
  schema: TableSchema[];
  lastResult: QueryResult | null;
  queryHistory: string[];
  setDbReady: (ready: boolean, storage: string) => void;
  setDbError: (error: string | null) => void;
  setSchema: (schema: TableSchema[]) => void;
  setLastResult: (result: QueryResult | null) => void;
  addQueryHistory: (query: string) => void;

  // UI State
  activeModal: 'none' | 'terminal' | 'menu' | 'corkboard' | 'grimoire' | 'dialogue' | 'clue';
  setActiveModal: (modal: 'none' | 'terminal' | 'menu' | 'corkboard' | 'grimoire' | 'dialogue' | 'clue') => void;

  // Interaction State
  activePrompt: string | null;
  activeClue: any | null;
  activeDialogue: any | null;
  activeQuestNotification: { title: string; message: string } | null;
  setActivePrompt: (prompt: string | null) => void;
  setActiveClue: (clue: any | null) => void;
  setActiveDialogue: (dialogue: any | null) => void;
  showQuestNotification: (title: string, message: string) => void;
  clearQuestNotification: () => void;

  // Story & Curriculum
  currentChapter: string;
  currentObjective: string;
  curriculumLevel: number;
  setObjective: (chapter: string, objective: string) => void;
  setCurriculumLevel: (level: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Engine defaults
  engineType: 'Unknown',
  engineReady: false,
  engineError: null,
  fps: 0,
  drawCalls: 0,
  activeMeshes: 0,
  gpuRenderer: '',
  setEngineInfo: (info) =>
    set((state) => ({
      ...state,
      engineType: info.engineType,
      gpuRenderer: info.gpuRenderer || state.gpuRenderer,
      engineReady: info.engineReady,
      engineError: info.engineError ?? null,
    })),
  updateDiagnostics: (fps, drawCalls, activeMeshes) =>
    set({ fps, drawCalls, activeMeshes }),

  // DB defaults
  dbReady: false,
  dbStorage: 'unknown',
  dbError: null,
  schema: [],
  lastResult: null,
  queryHistory: [],
  setDbReady: (ready, storage) => set({ dbReady: ready, dbStorage: storage, dbError: null }),
  setDbError: (error) => set({ dbError: error }),
  setSchema: (schema) => set({ schema }),
  setLastResult: (lastResult) => set({ lastResult }),
  addQueryHistory: (query) =>
    set((state) => ({
      queryHistory: [query, ...state.queryHistory.filter((q) => q !== query)].slice(0, 30),
    })),

  // UI
  activeModal: 'none',
  setActiveModal: (activeModal) => set({ activeModal }),

  // Interaction
  activePrompt: null,
  activeClue: null,
  activeDialogue: null,
  activeQuestNotification: null,
  setActivePrompt: (activePrompt) => set({ activePrompt }),
  setActiveClue: (activeClue) => set({ activeClue, activeModal: activeClue ? 'clue' : 'none' }),
  setActiveDialogue: (activeDialogue) => set({ activeDialogue, activeModal: activeDialogue ? 'dialogue' : 'none' }),
  showQuestNotification: (title, message) => set({ activeQuestNotification: { title, message } }),
  clearQuestNotification: () => set({ activeQuestNotification: null }),

  // Story
  currentChapter: 'Chapter 1: The Disappearance of Rowan Hale',
  currentObjective: "Find Sheriff Rowan Hale's discarded master ledger inside the Sheriff's Office (Press [E] to inspect).",
  curriculumLevel: 0,
  setObjective: (currentChapter, currentObjective) => set({ currentChapter, currentObjective }),
  setCurriculumLevel: (curriculumLevel) => set({ curriculumLevel }),
}));

