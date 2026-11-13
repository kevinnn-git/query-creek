# QUERY CREEK: FRONTIER NOIR — QA STAGE 0 BASELINE AUDIT
**Date:** November 14, 2026  
**QA Stage:** STAGE 0 — Baseline Inspection & Technical Record  
**Git Branch:** `qa/master-audit-protocol` (derived from `master` @ `ff4f012`)  
**Graphics Hardware:** NVIDIA GeForce GTX 1650 Max-Q / Intel UHD 630  
**Browser Engine:** Google Chrome 131+ (WebGPU with D3D12 Backend)  
**Operating System:** Windows 11  

---

### 1. Executive Summary

In accordance with the **Master Quality Assurance, Debugging, Bug Fixing and Optimization Protocol**, a comprehensive, non-destructive Stage 0 baseline inspection was conducted on the Query Creek client. The baseline audit evaluates the live running game across both full HD (1920×1080) and standard laptop (1366×768) display resolutions using autonomous Chrome DevTools Protocol (CDP) interactions.

**Stage 0 Baseline Status:** The current implementation is in an exceptionally healthy, playable state. Production builds succeed, all 54 unit tests pass, 37 autonomous gameplay assertions pass across all 8 functional domains, and 0 console errors or WebGPU validation failures are present.

---

### 2. Dual-Resolution Performance & Telemetry Baseline

| Metric | 1080p Session (1920 × 1080) | 768p Session (1366 × 768) | Target Threshold | Assessment |
| :--- | :---: | :---: | :---: | :---: |
| **Engine Initialization Time** | 6,684 ms | 5,559 ms | < 10,000 ms | **OPTIMAL** |
| **Graphics API** | WebGPU (DirectX 12) | WebGPU (DirectX 12) | WebGPU with WebGL2 fallback | **OPTIMAL** |
| **Selected GPU Adapter** | `nvidia WebGPU` | `nvidia WebGPU` | Dedicated NVIDIA GTX 1650 Max-Q | **VERIFIED** |
| **Average Frame Rate** | **53 – 60 FPS** | **60 FPS** | $\ge$ 50 FPS | **OPTIMAL** |
| **Draw Calls Per Frame** | **48 calls/frame** | **48 calls/frame** | < 100 calls/frame | **SUPERIOR** |
| **Active Meshes Rendered** | 66 meshes | 67 meshes | Normal range (50–120) | **OPTIMAL** |
| **JS Heap Memory Usage** | **81.9 MB** | **89.5 MB** | < 150 MB | **STABLE** |
| **Failed Network Requests** | **0** | **0** | 0 | **CLEAN** |
| **Console Errors / Warnings** | **0** | **0** | 0 | **CLEAN** |

---

### 3. Automated Test Suite & Compilation Baseline

| Verification Domain | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict Compilation** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict mode active, zero type errors across all modules. |
| **Production Vite Build** | `npm run build` | **PASS (Exit 0)** | 3,897 modules transformed, fully optimized bundle built in 27.8s. |
| **Subsystem Unit Test Suite** | `npm test` | **PASS (54/54)** | 100% pass rate covering Audio, Combat, AI, Dead-Eye, Contradictions, Save/Load, SQL Curriculum (Lv 0–9), SQL Guardrails, SQLite WASM, and Districts. |
| **Autonomous Gameplay Suite** | `node scratch/qa-autonomous-tester.js` | **PASS (37/37)** | Full end-to-end player locomotion, combat, ledger inspection, dialogue, and SQLite execution verified in live Chrome. |

---

### 4. Detailed Subsystem Baseline Assessment

#### 4.1 3D Engine & Graphics Architecture (`src/engine/`)
- **Engine Singleton:** Initialized safely via `EngineFactory.ts` with singleton lifecycle, avoiding React 19 mount-duplication.
- **WebGPU UBO Limit Compliance:** Clamped `maxSimultaneousLights = 2` across all materials in `SceneManager.ts` and `HybridAssetRegistry.ts`. This strictly prevents exceeding WebGPU's hardware limit of 12 vertex uniform buffers per shader stage (resolving previous 13-UBO overflow crashes).
- **Cinematic Pipeline:** ACES tone mapping, exposure (`1.12`), contrast (`1.10`), and soft vignette (`1.15`) running smoothly without experimental bloom passes that trigger D3D12 render pass mismatches.
- **Lighting & Haze:** Directional golden-hour sunlight (intensity 3.0), ambient sky/sand fill (intensity 1.05), and golden distance fog (`fogDensity = 0.0022`) eliminate black shadow artifacts.

#### 4.2 Camera & Player Character (`src/player/`)
- **Third-Person Camera:** Configured in `CameraController.ts` (`distance = 6.4m`, `heightOffset = 1.35m`, `shoulderOffset = +0.85m`, `pitch = 0.16 rad`). The sheriff occupies ~32% of screen height, full head-to-boots body is visible, and center crosshair aiming is 100% unobstructed.
- **Rigged Character:** Loaded via `sheriff_animated.glb` (Quaternius adventurer mesh bound to 12 locomotion/combat animation tracks).
- **Procedural Western Hat:** PBR Cattleman cowboy hat with weathered leather finish mounted to `Head` bone, tracking all head motions and casting dynamic shadows.

#### 4.3 Environment, Terrain & Architecture (`src/engine/`, `public/assets/`)
- **Dual Boardwalks:** West Boardwalk ($x = -8.2\text{m}$) and East Boardwalk ($x = +8.2\text{m}$) frame Main Street, accompanied by boardwalk benches, barrel/crate stacks, and street lanterns.
- **PBR Dirt Terrain:** 180×180m ground plane configured with 36x UV coordinate tiling (`uScale: 36, vScale: 36`), providing crisp soil, pebbles, and normal map relief without texture stretching.

#### 4.4 Physics & Character Simulation (`src/physics/`)
- **Havok Physics V2:** Loaded from `public/wasm/HavokPhysics.wasm` (2.09 MB).
- **Kinematic Elevation Clamping:** Player controller clamps footstep elevation to $y = 0.35\text{m}$ when traversing either sidewalk, preventing clipping into boardwalk geometry.

#### 4.5 Investigation & SQLite WASM Subsystem (`src/db/`)
- **SQLite Worker:** Dedicated Web Worker running `@sqlite.org/sqlite-wasm` with in-memory persistence and OPFS async proxy capability.
- **Database Seeding:** 17 canonical frontier tables seeded (`citizens`, `sheriff_records`, `incident_records`, `bank_transactions`, `saloon_tabs`, etc.).
- **Security Guardrails:** Rejects direct drops, arbitrary insertions, and semicolon multi-statement injection attempts, clamping row limits to 500 rows.

#### 4.6 User Interface & Diagnostics (`src/ui/`)
- **HUD & Typography:** Scalable Western Noir parchment aesthetic readable at both 1920×1080 and 1366×768.
- **Modals:** World Map ([M]), Evidence Corkboard, Settings ([O]), and Pause Menu ([Esc]) toggle cleanly and release pointer-lock immediately.
- **Developer Diagnostics:** Isolated inside `F3` key toggle and `?debug=1` parameter, displaying real-time FPS, draw calls (48/frame), and active meshes (66).

#### 4.7 Audio Subsystem (`src/audio/`)
- **Web Audio API Engine:** 100% procedural sound effects and ambience synthesized at runtime ($0 budget compliant). Zero latency, zero external sound asset download failures.

---

### 5. Identified Areas for Targeted QA Refinement

While the baseline is clean and stable, the following minor optimizations have been identified for progressive refinement across subsequent QA stages:

1. **Vite Bundle Optimization (QA Stage 1):** Vite emits a minification warning that `dist/assets/index-*.js` is ~7.2 MB uncompressed (~1.67 MB gzip) due to embedding Babylon.js engine, Havok, and CodeMirror in a single main chunk. We can implement Rollup `manualChunks` to split vendor dependencies into granular chunks (`babylon-core`, `codemirror`, `react-vendor`).
2. **Terrain Edge Falloff (QA Stage 2):** Add subtle natural perimeter rock formations along the 180m frontier boundaries to prevent the player from walking off the terrain edge.
3. **Dialogue Audio Feedback (QA Stage 3):** Add procedural typewriter click audio feedback during NPC dialogue text progression.
4. **OPFS Storage Auto-Promotion (QA Stage 4):** Verify persistent storage persistence across browser session reboots where OPFS is granted.

---

### 6. QA Stage 0 Sign-Off & Next Steps

All baseline requirements established in Section 2 & Section 27 of the QA Protocol are fulfilled. The project is backed up on the dedicated branch `qa/master-audit-protocol`.

> [!IMPORTANT]
> **QA Stage 0 is COMPLETE.** In accordance with Section 27 of the Protocol, execution is paused awaiting developer approval before initiating **QA STAGE 1 — Critical Technical Fixes** (bundle chunk optimization and deep module audit).
