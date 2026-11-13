export interface GameSaveData {
  slotId: string;
  slotName: string;
  savedAt: string;
  playtimeMinutes: number;
  chapterNumber: number;
  currentChapter: string;
  currentObjective: string;
  curriculumLevel: number;
  unlockedDistricts: string[];
  playerHealth: number;
  playerMaxHealth: number;
  playerMana: number;
  playerMaxMana: number;
  evidenceList: any[];
  corkboardPins: any[];
  corkboardLinks: any[];
  solvedContradictions: string[];
  queryHistory: string[];
  graphicsQuality: 'low' | 'medium' | 'high';
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
}

export interface SaveStateProvider {
  getState: () => Partial<GameSaveData>;
  restoreState: (data: GameSaveData) => void;
  showNotification?: (title: string, message: string) => void;
}

export class SaveManager {
  private static instance: SaveManager | null = null;
  private readonly STORAGE_PREFIX = 'qc_save_';
  private provider: SaveStateProvider | null = null;

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public setStateProvider(provider: SaveStateProvider) {
    this.provider = provider;
  }

  public saveGame(slotId: string = 'slot_1', slotName: string = 'Manual Save'): GameSaveData | null {
    if (typeof window === 'undefined') return null;

    try {
      const state = this.provider ? this.provider.getState() : {};
      const saveData: GameSaveData = {
        slotId,
        slotName,
        savedAt: new Date().toISOString(),
        playtimeMinutes: Math.floor(performance.now() / 60000),
        chapterNumber: state.chapterNumber ?? 1,
        currentChapter: state.currentChapter ?? 'Chapter 1: The Vanished Ledger',
        currentObjective: state.currentObjective ?? 'Investigate the Sheriff’s Office.',
        curriculumLevel: state.curriculumLevel ?? 0,
        unlockedDistricts: state.unlockedDistricts ?? ['sheriff_office', 'saloon', 'bank'],
        playerHealth: state.playerHealth ?? 100,
        playerMaxHealth: state.playerMaxHealth ?? 100,
        playerMana: state.playerMana ?? 100,
        playerMaxMana: state.playerMaxMana ?? 100,
        evidenceList: state.evidenceList ?? [],
        corkboardPins: state.corkboardPins ?? [],
        corkboardLinks: state.corkboardLinks ?? [],
        solvedContradictions: state.solvedContradictions ?? [],
        queryHistory: state.queryHistory ?? [],
        graphicsQuality: state.graphicsQuality ?? 'medium',
        masterVolume: state.masterVolume ?? 0.8,
        sfxVolume: state.sfxVolume ?? 0.8,
        musicVolume: state.musicVolume ?? 0.5,
      };

      const key = `${this.STORAGE_PREFIX}${slotId}`;
      localStorage.setItem(key, JSON.stringify(saveData));

      if (this.provider?.showNotification) {
        this.provider.showNotification(
          'GAME SAVED',
          `Progress recorded in ${slotName} (${new Date().toLocaleTimeString()}).`
        );
      }

      console.log(`[SaveManager] Saved game to ${key}`);
      return saveData;
    } catch (err) {
      console.error('[SaveManager] Failed to save game:', err);
      return null;
    }
  }

  public autoSaveCheckpoint(checkpointTitle: string): GameSaveData | null {
    return this.saveGame('autosave', `Auto-Checkpoint: ${checkpointTitle}`);
  }

  public loadGame(slotId: string = 'slot_1'): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const key = `${this.STORAGE_PREFIX}${slotId}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        console.warn(`[SaveManager] Save slot ${slotId} not found.`);
        return false;
      }

      const data: GameSaveData = JSON.parse(raw);

      if (this.provider) {
        this.provider.restoreState(data);
        if (this.provider.showNotification) {
          this.provider.showNotification(
            'GAME LOADED',
            `Restored checkpoint: ${data.slotName} (${data.currentChapter}).`
          );
        }
      }

      console.log(`[SaveManager] Loaded game from ${key}`);
      return true;
    } catch (err) {
      console.error('[SaveManager] Failed to load game:', err);
      return false;
    }
  }

  public getSavedSlots(): { slotId: string; name: string; savedAt: string; chapter: string }[] {
    if (typeof window === 'undefined') return [];

    const slots: { slotId: string; name: string; savedAt: string; chapter: string }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data: GameSaveData = JSON.parse(raw);
            slots.push({
              slotId: data.slotId,
              name: data.slotName,
              savedAt: data.savedAt,
              chapter: data.currentChapter,
            });
          }
        }
      }
    } catch (e) {}

    return slots.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  public deleteSave(slotId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const key = `${this.STORAGE_PREFIX}${slotId}`;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }
}
