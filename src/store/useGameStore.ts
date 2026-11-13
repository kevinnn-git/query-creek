import { create } from 'zustand';
import { QueryResult, TableSchema } from '../db/types';
import { EvidenceItem, CorkboardPin, CorkboardLink } from '../investigation/types';
import {
  INITIAL_EVIDENCE_ITEMS,
  INITIAL_CORKBOARD_PINS,
  INITIAL_CORKBOARD_LINKS,
} from '../investigation/evidenceData';

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
  investigationTab: 'grimoire' | 'corkboard' | 'dossier';
  setActiveModal: (modal: 'none' | 'terminal' | 'menu' | 'corkboard' | 'grimoire' | 'dialogue' | 'clue') => void;
  setInvestigationTab: (tab: 'grimoire' | 'corkboard' | 'dossier') => void;

  // Investigation & Corkboard Subsystem
  evidenceList: EvidenceItem[];
  corkboardPins: CorkboardPin[];
  corkboardLinks: CorkboardLink[];
  solvedContradictions: string[];
  addEvidence: (evidence: EvidenceItem) => void;
  pinEvidence: (evidenceId: string, customNote?: string, x?: number, y?: number) => void;
  unpinEvidence: (pinId: string) => void;
  connectPins: (fromPinId: string, toPinId: string, label?: string, isContradiction?: boolean) => void;
  removeLink: (linkId: string) => void;
  updatePinPosition: (pinId: string, x: number, y: number) => void;
  recordContradiction: (contradictionTitle: string) => void;

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

  // Combat & Dead-Eye State
  playerHealth: number;
  playerMaxHealth: number;
  playerMana: number;
  playerMaxMana: number;
  isDeadEyeActive: boolean;
  deadEyeFocus: number;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  consumePlayerMana: (amount: number) => void;
  restorePlayerMana: (amount: number) => void;
  setDeadEyeActive: (active: boolean) => void;
  setDeadEyeFocus: (focus: number) => void;

  // Story & Curriculum
  currentChapter: string;
  currentObjective: string;
  curriculumLevel: number;
  setObjective: (chapter: string, objective: string) => void;
  setCurriculumLevel: (level: number) => void;
}

const getSavedInvestigation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qc_investigation_state');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse saved investigation state:', e);
  }
  return null;
};

const savedState = getSavedInvestigation();

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
  investigationTab: 'grimoire',
  setActiveModal: (activeModal) => set({ activeModal }),
  setInvestigationTab: (investigationTab) => set({ investigationTab }),

  // Investigation & Corkboard defaults
  evidenceList: savedState?.evidenceList || INITIAL_EVIDENCE_ITEMS,
  corkboardPins: savedState?.corkboardPins || INITIAL_CORKBOARD_PINS,
  corkboardLinks: savedState?.corkboardLinks || INITIAL_CORKBOARD_LINKS,
  solvedContradictions: savedState?.solvedContradictions || ["Mayor Vale's Alibi Shattered"],

  addEvidence: (evidence) => {
    set((state) => {
      if (state.evidenceList.some((e) => e.id === evidence.id)) return state;
      const updated = [evidence, ...state.evidenceList];
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: updated,
            corkboardPins: state.corkboardPins,
            corkboardLinks: state.corkboardLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { evidenceList: updated };
    });
  },

  pinEvidence: (evidenceId, customNote, x, y) => {
    set((state) => {
      const existingPin = state.corkboardPins.find((p) => p.evidenceId === evidenceId);
      if (existingPin) return state; // Already pinned
      const newPin: CorkboardPin = {
        id: `pin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        evidenceId,
        x: x ?? 20 + Math.random() * 55,
        y: y ?? 20 + Math.random() * 55,
        rotation: (Math.random() - 0.5) * 6,
        pinColor: 'red',
        customNote,
      };
      const updatedPins = [...state.corkboardPins, newPin];
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: updatedPins,
            corkboardLinks: state.corkboardLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { corkboardPins: updatedPins };
    });
  },

  unpinEvidence: (pinId) => {
    set((state) => {
      const updatedPins = state.corkboardPins.filter((p) => p.id !== pinId);
      const updatedLinks = state.corkboardLinks.filter(
        (l) => l.fromPinId !== pinId && l.toPinId !== pinId
      );
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: updatedPins,
            corkboardLinks: updatedLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { corkboardPins: updatedPins, corkboardLinks: updatedLinks };
    });
  },

  connectPins: (fromPinId, toPinId, label, isContradiction = false) => {
    set((state) => {
      const exists = state.corkboardLinks.some(
        (l) =>
          (l.fromPinId === fromPinId && l.toPinId === toPinId) ||
          (l.fromPinId === toPinId && l.toPinId === fromPinId)
      );
      if (exists) return state;
      const newLink: CorkboardLink = {
        id: `link_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        fromPinId,
        toPinId,
        label: label || 'Forensic Link',
        isContradiction,
        discoveredAt: new Date().toISOString(),
      };
      const updatedLinks = [...state.corkboardLinks, newLink];
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: state.corkboardPins,
            corkboardLinks: updatedLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { corkboardLinks: updatedLinks };
    });
  },

  removeLink: (linkId) => {
    set((state) => {
      const updatedLinks = state.corkboardLinks.filter((l) => l.id !== linkId);
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: state.corkboardPins,
            corkboardLinks: updatedLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { corkboardLinks: updatedLinks };
    });
  },

  updatePinPosition: (pinId, x, y) => {
    set((state) => {
      const updatedPins = state.corkboardPins.map((p) =>
        p.id === pinId ? { ...p, x, y } : p
      );
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: updatedPins,
            corkboardLinks: state.corkboardLinks,
            solvedContradictions: state.solvedContradictions,
          })
        );
      } catch {}
      return { corkboardPins: updatedPins };
    });
  },

  recordContradiction: (contradictionTitle) => {
    set((state) => {
      if (state.solvedContradictions.includes(contradictionTitle)) return state;
      const updated = [...state.solvedContradictions, contradictionTitle];
      try {
        localStorage.setItem(
          'qc_investigation_state',
          JSON.stringify({
            evidenceList: state.evidenceList,
            corkboardPins: state.corkboardPins,
            corkboardLinks: state.corkboardLinks,
            solvedContradictions: updated,
          })
        );
      } catch {}
      return { solvedContradictions: updated };
    });
  },

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

  // Combat & Dead-Eye
  playerHealth: 100,
  playerMaxHealth: 100,
  playerMana: 100,
  playerMaxMana: 100,
  isDeadEyeActive: false,
  deadEyeFocus: 100,
  damagePlayer: (amount) =>
    set((state) => ({ playerHealth: Math.max(0, state.playerHealth - amount) })),
  healPlayer: (amount) =>
    set((state) => ({ playerHealth: Math.min(state.playerMaxHealth, state.playerHealth + amount) })),
  consumePlayerMana: (amount) =>
    set((state) => ({ playerMana: Math.max(0, state.playerMana - amount) })),
  restorePlayerMana: (amount) =>
    set((state) => ({ playerMana: Math.min(state.playerMaxMana, state.playerMana + amount) })),
  setDeadEyeActive: (isDeadEyeActive) => set({ isDeadEyeActive }),
  setDeadEyeFocus: (deadEyeFocus) => set({ deadEyeFocus }),

  // Story
  currentChapter: 'Chapter 1: The Disappearance of Rowan Hale',
  currentObjective: "Find Sheriff Rowan Hale's discarded master ledger inside the Sheriff's Office (Press [E] to inspect).",
  curriculumLevel: 0,
  setObjective: (currentChapter, currentObjective) => set({ currentChapter, currentObjective }),
  setCurriculumLevel: (curriculumLevel) => set({ curriculumLevel }),
}));
