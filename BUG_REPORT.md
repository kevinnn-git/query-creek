# QUERY CREEK: FRONTIER NOIR — BUG REPORT
**Version:** 0.1.0  
**Branch:** `qa/master-audit-protocol`  
**Date:** November 14, 2026  

---

### Bug Classification Matrix

| Bug ID | Severity | Category | Title | Status |
| :--- | :---: | :--- | :--- | :---: |
| **QC-BUG-W01** | **High** | Graphics / WebGPU | Vertex Uniform Buffer Overflow (13 > 12) during scene load | **FIXED & VERIFIED** |
| **QC-BUG-D01** | **Medium** | Engine / Telemetry | Cumulative Lifetime Draw Calls Reported on HUD (107k+ calls) | **FIXED & VERIFIED** |
| **QC-BUG-C01** | **Medium** | Camera / Player | Third-Person Camera Occlusion of Center Aiming Reticle | **FIXED & VERIFIED** |
| **QC-BUG-L01** | **Medium** | React / Lifecycle | Window Resize Event Listener Memory Leak in App.tsx | **FIXED & VERIFIED** |
| **QC-BUG-I01** | **Medium** | Input / Canvas | Incomplete Event Listener Unbinding in PlayerInput.dispose() | **FIXED & VERIFIED** |
| **QC-BUG-B01** | **Medium** | Build / Vercel | Monolithic 7.2 MB Bundle without Vendor Code-Splitting | **FIXED & VERIFIED** |
| **QC-BUG-T01** | **Low** | Terrain / Materials| Ground Dirt Texture Stretched and Blurry (Missing UV Tiling) | **FIXED & VERIFIED** |

---

### Detailed Defect Reports

#### QC-BUG-W01: Vertex Uniform Buffer Overflow on WebGPU
- **Severity:** High
- **Description:** On WebGPU, shader compilation failed with `[object GPUValidationError] - The number of uniform buffers (13) in the Vertex stage exceeds the maximum per-stage limit (12)`.
- **Steps to Reproduce:**
  1. Launch Query Creek with WebGPU enabled.
  2. Load all 8 districts with 9 active lights (sun, sky ambient, 7 lantern point lights).
  3. Babylon's `@babylonjs/loaders` `glTFLoader.js` sets `mat.maxSimultaneousLights = Math.max(mat.maxSimultaneousLights, scene.lights.length)`.
  4. Vertex shader layout creates 13 uniform buffers, exceeding WebGPU limit of 12.
- **Expected Behaviour:** Zero GPU validation errors; shader pipeline layouts remain strictly $\le 12$ uniform buffers.
- **Actual Behaviour:** Chromium D3D12 backend logged 20 uncaptured GPU errors per second, producing invalid render pipelines.
- **Root Cause:** Babylon's glTFLoader overrides `maxSimultaneousLights` to match total lights in the scene.
- **Resolution:** In `SceneManager.ts`, enforced `mat.maxSimultaneousLights = 2` across all scene materials after district population, and disabled invalid WebGPU FXAA post-process passes.
- **Verification:** Chrome CDP console logs confirm 0 warnings, 0 exceptions, and 0 WebGPU validation errors.

#### QC-BUG-D01: Cumulative Lifetime Draw Calls Reported
- **Severity:** Medium
- **Description:** Main gameplay HUD showed 107,227 draw calls, misleading users into believing the rendering pipeline was unoptimized.
- **Steps to Reproduce:** Play game for 30 seconds with diagnostics visible.
- **Expected Behaviour:** Real-time per-frame draw call rate displayed (e.g., 40–70 calls/frame).
- **Actual Behaviour:** Counter continuously ticked upwards indefinitely, reaching hundreds of thousands.
- **Root Cause:** `SceneManager.ts` read `engine._drawCalls.current` (cumulative counter since session start) instead of `(engine as any)._drawCalls.lastSecAverage`.
- **Resolution:** Switched telemetry reporting to `_drawCalls.lastSecAverage`.
- **Verification:** HUD and F3 diagnostics report accurate 48 draw calls/frame.

#### QC-BUG-C01: Third-Person Camera Occlusion
- **Severity:** Medium
- **Description:** Character's head was clipped off at the top bezel, and the torso blocked the center aiming reticle.
- **Steps to Reproduce:** Start exploration in normal mode. Look down frontier avenue.
- **Expected Behaviour:** Full character visible from boots to hat on the left third of the screen; crosshair completely clear.
- **Actual Behaviour:** Character occupied >65% of screen height, centered directly over reticle.
- **Root Cause:** Camera `distance` (5.2m), `heightOffset` (1.6m), and `shoulderOffset` (0.45m) were miscalibrated for the 1.85m human model.
- **Resolution:** Re-engineered `CameraController.ts` (`distance = 6.4m`, `shoulderOffset = +0.85m`, `heightOffset = 1.35m`, `pitch = 0.16 rad`) with forward sightline tracking.
- **Verification:** Sheriff occupies ~32% of screen height with a 100% unobstructed view down Main Street.

#### QC-BUG-L01: Window Resize Listener Memory Leak
- **Severity:** Medium
- **Description:** In `App.tsx`, `window.addEventListener('resize', handleResize)` was registered during engine initialization but omitted from the `useEffect` cleanup return.
- **Steps to Reproduce:** Mount and unmount or hot-reload `App.tsx`.
- **Expected Behaviour:** All window listeners removed on component cleanup.
- **Actual Behaviour:** Dangling resize listener retained reference to disposed engine instance.
- **Root Cause:** Scoped `const handleResize` declared inside async `initGame()` without cleanup hook exposure.
- **Resolution:** Hoisted `handleResize` reference and invoked `window.removeEventListener('resize', handleResize)` during cleanup.
- **Verification:** Verified zero dangling listeners on component unmount.

#### QC-BUG-I01: Incomplete Event Listener Removal in PlayerInput
- **Severity:** Medium
- **Description:** `PlayerInput.dispose()` attempted to remove an unattached `'click'` listener while omitting `mousedown`, `mouseup`, and `contextmenu`.
- **Steps to Reproduce:** Dispose scene via `sceneManager.dispose()`.
- **Expected Behaviour:** All bound DOM listeners cleanly removed from canvas.
- **Actual Behaviour:** Canvas retained mouse event handlers.
- **Resolution:** Added dedicated `handleContextMenu` handler and explicitly removed `mousedown`, `mouseup`, and `contextmenu` in `dispose()`.
- **Verification:** Clean unbinding confirmed during scene reloads.

#### QC-BUG-B01: Monolithic 7.2 MB Bundle
- **Severity:** Medium
- **Description:** Production build emitted a single 7.2 MB `index.js` chunk containing React, Babylon.js, and CodeMirror.
- **Steps to Reproduce:** Run `npm run build`.
- **Expected Behaviour:** Code-split vendor chunks for optimal browser caching.
- **Actual Behaviour:** Vite warned of chunk size exceeding 500 kB.
- **Resolution:** Configured Rollup `manualChunks` in `vite.config.ts`, splitting into `babylonjs-vendor` (6.4 MB), `codemirror-vendor` (439 kB), `react-vendor` (243 kB), and application `index.js` (186 kB).
- **Verification:** `npm run build` succeeds cleanly with zero bundle warnings.

#### QC-BUG-T01: Blurry Ground Dirt Texture
- **Severity:** Low
- **Description:** 180×180m ground plane looked blurry and stretched.
- **Steps to Reproduce:** Look at dirt road in normal gameplay.
- **Expected Behaviour:** Sharp dry soil, pebbles, and cracked ground normal maps.
- **Actual Behaviour:** 1K texture was stretched across entire 180m terrain.
- **Root Cause:** `HybridAssetRegistry.createPbrMaterial` lacked `uScale` and `vScale` properties.
- **Resolution:** Implemented `uScale: 36, vScale: 36` on ground dirt and `3 x 24` on boardwalk planks.
- **Verification:** Verified sharp 36x pebble detail in 1080p and 768p screenshots.
