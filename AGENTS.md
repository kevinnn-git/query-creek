# AGENTS & SUBSYSTEM DIRECTORY
## QUERY CREEK: FRONTIER NOIR — THE LAST LEDGER

This document outlines the roles, system architecture, and responsibilities across the Query Creek game client.

---

### 1. 3D Engine & Graphics Architecture (`src/engine/`)
- **`EngineFactory.ts`**: Handles graphics device initialization. Probes WebGPU capability on supported hardware (such as the developer's NVIDIA GeForce GTX 1650 Max-Q via D3D12), gracefully disposing and falling back to WebGL2 if WebGPU fails.
- **`SceneManager.ts`**: Owns the active Babylon.js scene, camera controls, terrain generation, frontier district population, asset placement, and render loop diagnostics.
- **`HybridAssetRegistry.ts`**: Centralized asset manager. Loads GLB containers, caches materials and textures, instances models, and unifies Quaternius and Kenney meshes.
- **`Lighting.ts`**: Implements cinematic frontier lighting: warm golden-hour directional sun, sky/ground hemispheric fill, atmospheric dust fog, and warm saloon/jail lantern point lights with soft shadow mapping.
- **`RenderingPipeline.ts`**: Manages post-processing effects (vignette, bloom, tone mapping, contrast) tuned for 60 FPS performance.

---

### 2. Physics & Player Simulation (`src/physics/`)
- **`HavokSetup.ts`**: Loads and binds the Babylon Havok Physics V2 engine using self-hosted `public/wasm/HavokPhysics.wasm`.

---

### 3. Investigation & SQL Database Subsystem (`src/db/`)
- **`sqlite.worker.ts`**: Dedicated Web Worker running `@sqlite.org/sqlite-wasm`. Probes OPFS and in-memory persistence. Seeds starter town ledgers (`citizens`, `sheriff_records`, `incident_records`).
- **`DbClient.ts`**: Typed RPC bridge for sending queries and schema introspection requests from the main React/Babylon thread without stalling the render loop.
- **`types.ts`**: Query results, schema descriptors, and worker protocol interfaces.

---

### 4. User Interface & Grimoire (`src/ui/`)
- **`HUD.tsx`**: In-game frontier noir interface displaying current chapter objectives, sheriff controls, and real-time engine diagnostics.
- **`SqlTerminal.tsx`**: CodeMirror 6 SQL editor with dark frontier styling, interactive schema tree, quick query templates, result data table, and beginner-friendly syntax feedback.
- **`MainMenu.tsx`**: Title screen and readiness dashboard.

---

### 5. State Management (`src/store/`)
- **`useGameStore.ts`**: Global Zustand store tracking active UI modals, engine metrics, database connection status, and campaign objectives.

