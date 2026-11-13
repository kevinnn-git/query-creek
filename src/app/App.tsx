import React, { useEffect, useRef } from 'react';
import { EngineFactory } from '../engine/EngineFactory';
import { SceneManager } from '../engine/SceneManager';
import { dbClient } from '../db/DbClient';
import { useGameStore } from '../store/useGameStore';
import { HUD } from '../ui/HUD';
import { SqlTerminal } from '../ui/SqlTerminal';
import { MainMenu } from '../ui/MainMenu';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { ClueModal } from '../ui/ClueModal';
import { DialoguePanel } from '../ui/DialoguePanel';
import { QuestNotification } from '../ui/QuestNotification';
import { Corkboard } from '../investigation/Corkboard';
import { WorldMapModal } from '../ui/WorldMapModal';
import { SettingsModal } from '../ui/SettingsModal';
import { EpilogueModal } from '../ui/EpilogueModal';
import { SaveManager } from '../save/SaveManager';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const {
    activeModal,
    setActiveModal,
    setEngineInfo,
    updateDiagnostics,
    setDbReady,
    setDbError,
    setSchema,
    setActiveClue,
    setActiveDialogue,
  } = useGameStore();

  useEffect(() => {
    let isMounted = true;
    let diagInterval: any = null;

    // Initialize SaveManager State Provider
    SaveManager.getInstance().setStateProvider({
      getState: () => {
        const s = useGameStore.getState();
        return {
          chapterNumber: s.chapterNumber,
          currentChapter: s.currentChapter,
          currentObjective: s.currentObjective,
          curriculumLevel: s.curriculumLevel,
          unlockedDistricts: s.unlockedDistricts,
          playerHealth: s.playerHealth,
          playerMaxHealth: s.playerMaxHealth,
          playerMana: s.playerMana,
          playerMaxMana: s.playerMaxMana,
          evidenceList: s.evidenceList,
          corkboardPins: s.corkboardPins,
          corkboardLinks: s.corkboardLinks,
          solvedContradictions: s.solvedContradictions,
          queryHistory: s.queryHistory,
        };
      },
      restoreState: (data) => {
        const s = useGameStore.getState();
        s.setObjective(data.currentChapter, data.currentObjective, data.chapterNumber);
        s.setCurriculumLevel(data.curriculumLevel);
        useGameStore.setState({
          playerHealth: data.playerHealth,
          playerMaxHealth: data.playerMaxHealth,
          playerMana: data.playerMana,
          playerMaxMana: data.playerMaxMana,
          unlockedDistricts: data.unlockedDistricts || ['sheriff_office', 'saloon', 'bank'],
          evidenceList: data.evidenceList || [],
          corkboardPins: data.corkboardPins || [],
          corkboardLinks: data.corkboardLinks || [],
          solvedContradictions: data.solvedContradictions || [],
          queryHistory: data.queryHistory || [],
        });
      },
      showNotification: (title, desc) => {
        useGameStore.getState().showQuestNotification(title, desc);
      },
    });

    // Check URL parameters for testing & visual verification
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('deadeye') === '1') {
      useGameStore.getState().setDeadEyeActive(true);
    }
    if (searchParams.get('spellcast') === '1') {
      useGameStore.getState().setDeadEyeActive(true);
      useGameStore.getState().showQuestNotification(
        'CRITICAL ELEMENTAL WEAKNESS EXPLOITED!',
        'Tactical SQL JOIN executed: Shock Arc struck Syndicate Enforcer Vance for 60 damage (WEAKNESS DETECTED: 2x DAMAGE & STUNNED)!'
      );
    }
    if (searchParams.get('worldmap') === '1') {
      useGameStore.getState().setActiveModal('map');
    }
    if (searchParams.get('curriculum')) {
      const lvl = parseInt(searchParams.get('curriculum') || '0', 10);
      useGameStore.getState().setCurriculumLevel(lvl);
      useGameStore.getState().setActiveModal('terminal');
    }
    if (searchParams.get('boss') === '1') {
      useGameStore.getState().setObjective(
        'Chapter 5: The Final Audit at Sunken Mine',
        'Shatter Mayor Gideon Vale’s Arcane Aegis shield using decrypted elemental spells.',
        5
      );
    }
    if (searchParams.get('settings') === '1') {
      useGameStore.getState().setActiveModal('settings');
    }
    if (searchParams.get('epilogue') === '1') {
      useGameStore.getState().setActiveModal('epilogue');
    }

    async function initGame() {
      if (!canvasRef.current) return;

      // 1. Initialize SQLite WASM Worker in parallel
      dbClient
        .initialize()
        .then((res) => {
          if (!isMounted) return;
          console.log('[App] SQLite initialized:', res.storage);
          setDbReady(true, res.storage);
          return dbClient.getSchema();
        })
        .then((schema) => {
          if (schema && isMounted) setSchema(schema);
        })
        .catch((err) => {
          console.error('[App] SQLite initialization error:', err);
          if (isMounted) setDbError(err.message);
        });

      // 2. Initialize Babylon 3D Engine with WebGPU -> WebGL2 fallback
      try {
        const engineResult = await EngineFactory.createEngine(canvasRef.current, {
          preferWebGPU: true,
          antialias: true,
          powerPreference: 'high-performance',
        });

        if (!isMounted) {
          engineResult.engine.dispose();
          return;
        }

        setEngineInfo({
          engineType: engineResult.engineType,
          gpuRenderer: engineResult.glRenderer,
          engineReady: true,
        });

        // 3. Initialize Scene, Player & World
        const sceneManager = new SceneManager(engineResult.engine as any);
        sceneManagerRef.current = sceneManager;
        await sceneManager.initializeScene();

        // 4. Start Render Loop
        sceneManager.startRenderLoop();

        // 5. Diagnostics Polling (1 second interval)
        diagInterval = setInterval(() => {
          if (sceneManagerRef.current && isMounted) {
            const d = sceneManagerRef.current.getDiagnostics(engineResult.engineType);
            updateDiagnostics(d.fps, d.drawCalls, d.activeMeshes);
          }
        }, 1000);

        // 6. Handle Window Resize
        const handleResize = () => {
          engineResult.engine.resize();
        };
        window.addEventListener('resize', handleResize);
      } catch (err: any) {
        console.error('[App] Engine initialization error:', err);
        if (isMounted) {
          setEngineInfo({
            engineType: 'Unknown',
            engineReady: false,
            engineError: err.message,
          });
        }
      }
    }

    initGame();

    return () => {
      isMounted = false;
      if (diagInterval) clearInterval(diagInterval);
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, [setEngineInfo, updateDiagnostics, setDbReady, setDbError, setSchema]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab: Toggle SQL Grimoire / Corkboard
      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveModal(activeModal === 'terminal' || activeModal === 'corkboard' ? 'none' : 'terminal');
      }
      // M: Toggle Frontier World Map
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setActiveModal(activeModal === 'map' ? 'none' : 'map');
      }
      // O: Toggle Settings & Archive Dashboard
      else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setActiveModal(activeModal === 'settings' ? 'none' : 'settings');
      }
      // Esc: Close active modal (clue, dialogue, grimoire, corkboard, map, settings, epilogue) or open MainMenu
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (activeModal === 'clue') {
          setActiveClue(null);
        } else if (activeModal === 'dialogue') {
          setActiveDialogue(null);
        } else if (
          activeModal === 'terminal' ||
          activeModal === 'corkboard' ||
          activeModal === 'map' ||
          activeModal === 'settings' ||
          activeModal === 'epilogue'
        ) {
          setActiveModal('none');
        } else if (activeModal === 'none') {
          setActiveModal('menu');
        } else {
          setActiveModal('none');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal, setActiveClue, setActiveDialogue]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Babylon 3D Viewport Canvas */}
      <canvas
        ref={canvasRef}
        id="babylonCanvas"
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
      />

      {/* Frontier Noir UI Layers */}
      <HUD />
      <InteractionPrompt />
      <ClueModal />
      <DialoguePanel />
      <QuestNotification />
      <SqlTerminal />
      <Corkboard />
      <WorldMapModal />
      <SettingsModal />
      <EpilogueModal />
      <MainMenu />
    </div>
  );
};
