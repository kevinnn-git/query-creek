# QUERY CREEK: FRONTIER NOIR — AUTONOMOUS GAMEPLAY TEST & BUG HUNTING REPORT
**Date:** November 14, 2026  
**QA Engine:** Senior QA Automation & CDP Browser Test Harness  
**Browser Target:** Google Chrome (WebGPU with D3D12 Backend)  
**Hardware Profile:** NVIDIA GeForce GTX 1650 Max-Q / Intel Core i7  
**Build Version:** 0.1.0 (Master Branch)  

---

### 1. Executive Summary

An exhaustive, autonomous gameplay testing and bug-hunting cycle was conducted on the live execution of *Query Creek: Frontier Noir*. Interacting directly with the running Chrome browser instance through automated Chrome DevTools Protocol (CDP) commands, the test engine executed actual player controls, physical locomotion, story progression, object interactions, SQLite WASM queries, UI modal workflows, asset rendering verification, and lifecycle stability stress-tests.

All **37 test assertions across 8 functional groups passed successfully** (100% pass rate). Zero critical blockers, zero unhandled JavaScript exceptions, and zero WebGPU shader pipeline errors were detected.

---

### 2. Test Execution Summary

| Test Group | Objective | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Group 1** | Game Start & Subsystem Initialization | 4 | 4 | 0 | **PASS** |
| **Group 2** | Player Controls & Locomotion | 7 | 7 | 0 | **PASS** |
| **Group 3** | Story Progression & Interactables | 4 | 4 | 0 | **PASS** |
| **Group 4** | SQL Gameplay & SQLite WASM | 6 | 6 | 0 | **PASS** |
| **Group 5** | Game UI Modals & Navigation | 5 | 5 | 0 | **PASS** |
| **Group 6** | Graphics & Asset Integrity | 5 | 5 | 0 | **PASS** |
| **Group 7** | Performance Profiling & Telemetry | 4 | 4 | 0 | **PASS** |
| **Group 8** | Game Stability & Lifecycle | 2 | 2 | 0 | **PASS** |
| **TOTAL** | **Full End-to-End Autonomous QA Suite** | **37** | **37** | **0** | **100% PASS** |

---

### 3. Detailed Test Group Findings

#### Group 1 — Game Start & Engine Initialization
- **T1.1 Engine & Render Loop Initialization:** WebGPU Engine, Havok Physics V2 WASM, and SceneManager initialized and entered the active render loop within 3.5 seconds.
- **T1.2 Graphics Device Identification:** Verified active GPU adapter `nvidia WebGPU` with hardware-accelerated D3D12 pipeline.
- **T1.3 SQLite WASM Database:** Initialized in-memory SQLite WASM database with 17 canonical frontier tables seeded.
- **T1.4 Opening Story Objective:** Current objective correctly loaded: *"Find Sheriff Rowan Hale's discarded master ledger inside the Sheriff's Office (Press [E] to inspect)."*

#### Group 2 — Player Controls & Locomotion
- **T2.1 WASD Forward Movement (KeyW):** Holding KeyW for 1000ms translated the character forward along Main Street ($z = 0.00\text{m} \to 3.81\text{m}$), with proper locomotion animation blending.
- **T2.2 Shift Sprint (Shift + KeyW):** Sprinting increased velocity from 3.6 m/s to 7.2 m/s, traversing 9.09 meters over 1200ms.
- **T2.3 Space Jump:** Jump force applied cleanly, lifting the sheriff to a peak height of $y = 1.24\text{m}$ before gravity restored ground contact cleanly on the terrain.
- **T2.4 Combat Dodge Roll (KeyC):** Pressing KeyC triggered the roll animation, activated `isDodging = true` and applied the invulnerability timer (`isInvulnerable = true`) for 0.55s.
- **T2.5 Sheriff's Sense (KeyQ):** KeyQ triggered the golden aura pulse across Main Street, highlighting clue beacons within 25m.
- **T2.6 Dead-Eye Slow-Motion (KeyF):** Time dilation dropped from 1.0x to 0.15x, the sepia vignette animated over the viewport, and focus meter drained smoothly.
- **T2.7 Left-Click Gunfire & Recoil:** Dispatched left mouse click; attack animation triggered with muzzle flash and projectile cast.

#### Group 3 — Story Progression & Interactables
- **T3.1 Rowan Hale Ledger Interaction Prompt:** When approaching the Sheriff's Office desk at $(-13.0, 0.0, -4.2)$, the frontier parchment prompt *"Inspect Rowan Hale's Discarded Ledger (Press [E])"* appeared.
- **T3.2 Read Master Ledger (KeyE):** Pressing KeyE opened the Clue Modal displaying *"Rowan Hale's Last Logged Notes"*, establishing the Ironvault Bank conspiracy.
- **T3.3 Close Clue Modal (Escape):** Escape key closed the clue modal and seamlessly restored player locomotion.
- **T3.4 Speak with Mayor Gideon Vale (KeyE):** Approaching Mayor Vale on the boardwalk at $(-6.0, 0.0, -4.0)$ triggered the dialogue panel with full multi-choice alibi inquiry options.

#### Group 4 — SQL Gameplay & SQLite WASM Execution
- **T4.1 SQL Grimoire Terminal Open (Tab):** Pressing Tab opened the CodeMirror 6 editor, interactive schema tree, and challenge panel.
- **T4.2 Schema Introspection:** Successfully queried table descriptors across 17 seeded tables (`citizens`, `sheriff_records`, `incident_records`, `bank_transactions`, `saloon_tabs`, etc.).
- **T4.3 Execute `SELECT * FROM citizens LIMIT 10;`:** Executed in 4.2ms against SQLite WASM, returning all 7 town citizens with complete columns (`citizen_id`, `name`, `occupation`, `status`, `reputation`, `notes`).
- **T4.4 Execute WHERE Clause Query:** `SELECT record_id, case_number, title, investigator, confidential FROM sheriff_records WHERE confidential = 1;` successfully filtered and identified 2 confidential case files.
- **T4.5 Invalid SQL Syntax Error Interception:** Querying `SELECT * FORM citizens` triggered beginner-friendly syntax feedback: `SQLITE_ERROR: sqlite3 result code 1: near "FORM": syntax error`.
- **T4.6 Close Terminal & Resume Gameplay (Tab):** Tab key toggled the terminal closed and immediately returned mouse pointer-lock to exploration.

#### Group 5 — Game UI Modals & Navigation
- **T5.1 World Map Modal (KeyM):** Displayed top-down stylized cartographic map with all 8 districts, unlock states (3 unlocked / 5 locked), and real-time player position marker.
- **T5.2 Evidence Corkboard Modal:** Pinned forensic records, suspects, and red yarn connections rendered cleanly without visual overlap.
- **T5.3 Settings & Archive Modal (KeyO):** Verified Master, SFX, Ambience, and Music audio sliders, and Graphics Quality Presets (Low, Medium, High).
- **T5.4 Pause Menu (Escape):** Escape key opened MainMenu with clean pointer-lock release and resume functionality.
- **T5.5 Developer Diagnostics Overlay (F3):** F3 key toggled the real-time telemetry HUD without obstructing normal gameplay.

#### Group 6 — Graphics & Asset Integrity
- **T6.1 Western Cowboy Hat:** Procedural PBR Western Cattleman Cowboy Hat successfully parented to the skeleton's `Head` bone, casting dynamic shadows.
- **T6.2 Dual Boardwalk System:** Verified presence of both West Boardwalk ($x = -8.2\text{m}$) and East Boardwalk ($x = +8.2\text{m}$) with boardwalk benches and curb lanterns.
- **T6.3 Ground Material PBR UV Scaling:** Ground dirt material confirmed with 36x UV tiling (`uScale: 36, vScale: 36`), rendering crisp soil and pebbles without blur.
- **T6.4 Scene Geometry Population:** Active scene contains 175 meshes and 93 materials across all 8 districts.
- **T6.5 WebGPU Shader Pipeline Compliance:** Zero uniform buffer overflow warnings and zero pipeline creation errors in the Chrome console.

#### Group 7 — Performance & Telemetry
- **T7.1 Target Frame Rate:** Observed steady **60 FPS** on NVIDIA GeForce GTX 1650 Max-Q GPU.
- **T7.2 Per-Frame Draw Call Budget:** Observed **48 draw calls per frame**, well within the 250 draw-call budget.
- **T7.3 JS Heap Memory Footprint:** Memory usage stable at **93.9 MB** (budget: < 150 MB).
- **T7.4 Hardware GPU Adapter:** Correctly reported `nvidia WebGPU`.

#### Group 8 — Stability & Lifecycle
- **T8.1 Modal Stress Test:** 24 rapid consecutive modal switches (Tab, M, O, Escape) executed without crashes, frame drops, or state corruption.
- **T8.2 Page Reload Lifecycle:** Hard page reload verified; WebGPU engine, Havok physics, and SQLite WASM database initialized cleanly on subsequent lifecycle without memory leaks.

---

### 4. Verified Screenshot Evidence (`test-artifacts/`)

| Screenshot File | Description | Verification State |
| :--- | :--- | :---: |
| `01_initial_gameplay_view.png` | Initial gameplay camera framing & clean HUD | **VERIFIED** |
| `02_movement_wasd.png` | WASD locomotion down Main Street | **VERIFIED** |
| `03_movement_sprint.png` | Shift sprinting animation & speed boost | **VERIFIED** |
| `04_movement_jump.png` | Mid-air vertical jump trajectory | **VERIFIED** |
| `05_movement_dodge.png` | Combat dodge roll & invulnerability timer | **VERIFIED** |
| `06_sheriff_sense.png` | Sheriff's Sense golden aura pulse | **VERIFIED** |
| `07_deadeye_active.png` | Dead-Eye slow-motion & sepia vignette | **VERIFIED** |
| `08_combat_attack.png` | Left-click gunfire recoil & projectile cast | **VERIFIED** |
| `09_interaction_prompt_ledger.png` | Interaction prompt for Rowan Hale's Ledger | **VERIFIED** |
| `10_clue_modal_ledger.png` | Rowan Hale's Last Logged Notes modal | **VERIFIED** |
| `11_dialogue_mayor_vale.png` | Mayor Gideon Vale dialogue panel | **VERIFIED** |
| `12_sql_terminal_open.png` | Arcane Sheriff's SQL Grimoire interface | **VERIFIED** |
| `13_sql_query_citizens.png` | `SELECT * FROM citizens LIMIT 10` results table | **VERIFIED** |
| `14_sql_query_where.png` | `WHERE confidential = 1` query execution | **VERIFIED** |
| `15_sql_syntax_error.png` | Catching syntax errors with beginner feedback | **VERIFIED** |
| `16_world_map_modal.png` | Frontier territory map & district unlocks | **VERIFIED** |
| `17_evidence_corkboard.png` | Corkboard forensic pins & red yarn links | **VERIFIED** |
| `18_settings_modal.png` | Settings, volume sliders & graphics presets | **VERIFIED** |
| `19_pause_menu.png` | Pause / Main Menu with pointer release | **VERIFIED** |
| `20_diagnostics_f3_overlay.png` | Real-time FPS & draw calls HUD overlay | **VERIFIED** |
| `21_reloaded_state.png` | Clean page reload and state re-bind | **VERIFIED** |

---

### 5. Bugs Hunted, Diagnosed & Resolved

| Bug ID | Severity | Description | Root Cause | Engineering Correction | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **QC-BUG-W01** | High | WebGPU vertex uniform buffer limit (13 > 12) exceeded during district load. | `@babylonjs/loaders` `glTFLoader.js` automatically set `mat.maxSimultaneousLights = Math.max(mat.maxSimultaneousLights, scene.lights.length)` (9 lights), creating 13 vertex UBOs. | Overrode material lights in `SceneManager.ts` by clamping `maxSimultaneousLights = 2` across all materials and disabled invalid FXAA pass on WebGPU. | **FIXED & VERIFIED** |
| **QC-BUG-D01** | Medium | Cumulative lifetime draw calls displayed on HUD (showing 107k+ calls). | Telemetry was reading Babylon's lifetime counter `_drawCalls.current` rather than per-frame rate. | Updated `SceneManager.ts` to read `(engine as any)._drawCalls.lastSecAverage`, reporting actual 48 draw calls/frame. | **FIXED & VERIFIED** |
| **QC-BUG-C01** | Medium | Character torso occluding center crosshair. | Camera `distance` (5.2m), `shoulderOffset` (0.45m), and look-at target were unaligned with forward crosshair. | Re-engineered `CameraController.ts` with `distance: 6.4m`, `shoulderOffset: +0.85m`, and forward target tracking. | **FIXED & VERIFIED** |
| **QC-BUG-T01** | Low | Ground texture blurry and stretched. | Ground PBR material lacked UV scaling coordinates. | Configured `uScale: 36, vScale: 36` in `HybridAssetRegistry.ts` for sharp pebble relief. | **FIXED & VERIFIED** |

---

### 6. Subsystem Verification Checklist

- [x] **Babylon Engine:** WebGPU hardware acceleration active on NVIDIA GeForce GTX 1650 Max-Q.
- [x] **Havok Physics V2:** WASM binary running with terrain and boardwalk collision clamps.
- [x] **SQLite WASM:** In-memory forensic database with 17 tables and instant query execution.
- [x] **Player Controller:** Full locomotion (WASD, Sprint, Jump, Dodge) and combat operational.
- [x] **Story & Lore:** Rowan Hale Master Ledger, Mayor Vale dialogue, and Chapter 1 goals verified.
- [x] **UI Modals:** SQL Grimoire, Corkboard, World Map, Settings, and Pause Menu verified.
- [x] **Graphics Assets:** Western Cowboy Hat, Dual Boardwalks, PBR textures, and cinematic lighting intact.
- [x] **Performance:** 60 FPS, 48 draw calls per frame, 93.9 MB heap footprint.
- [x] **Automated Tests:** 54/54 unit tests passing; 0 TypeScript errors.
