# QUERY CREEK: FRONTIER NOIR — THE LAST LEDGER
### A Cinematic Third-Person Open-World SQL Learning RPG

> *"The truth was recorded in the ledgers. You just need to know how to query them."*

---

## 🤠 1. Executive Overview

**Query Creek: Frontier Noir — The Last Ledger** is a cinematic, browser-playable 3D educational adventure RPG that teaches industry-standard SQL through a deeply interconnected western crime conspiracy. 

You arrive in the isolated canyon frontier of Query Creek as the newly appointed **Arcane Sheriff**, investigating the mysterious disappearance of former sheriff **Rowan Hale**, an audacious vault robbery at the **Ironvault Bank**, manipulated freight manifests at the train depot, and a syndicate led by **Mayor Gideon Vale**.

The central educational philosophy of the game is:
**The player learns SQL because solving the mystery requires SQL.**

The entire experience runs 100% client-side inside the browser using WebGL2/WebGPU, Web Workers, and WebAssembly — requiring zero server backends, desktop game installations, or paid subscriptions.

---

## 🏛️ 2. Core Gameplay Pillars

1. **Third-Person Open-World Exploration:** Seamlessly traverse an expansive 180x180m connected frontier with 8 distinct districts, wooden boardwalk sidewalks, warm golden-hour lighting, and dynamic canyon dust particles.
2. **True Forensic Crime Investigation:** Inspect 3D physical clues, interrogate suspects, unmask alibi contradictions, and link physical pins on a vintage detective corkboard with dynamic red yarn threads.
3. **Genuine SQL Execution:** Write real SQL queries inside an integrated CodeMirror 6 terminal against an in-browser SQLite 3.54 WASM database with OPFS and in-memory persistence.
4. **Gradually Increasing SQL Curriculum:** Progress from basic `SELECT` and `WHERE` filtering to relational `JOIN`s, `GROUP BY/HAVING` aggregations, correlated subqueries, Common Table Expressions (`WITH`), Window Functions (`ROW_NUMBER() OVER`), and JSON parsing (`json_extract`).
5. **Real-Time Combat & Dead-Eye Arcane Spells:** Engage in tactical firearms combat with camera-relative movement and dodge rolls. Activate Dead-Eye slow-motion time dilation to execute tactical SQL queries that cast elemental incantations (Shock, Fire, Arcane) exploiting enemy weaknesses.
6. **Multi-Layer Boss Encounter:** Shatter Mayor Gideon Vale’s 3-layer rotating Arcane Aegis shield cipher using decrypted elemental spells to recover Rowan Hale's Master Ledger.
7. **Procedural Web Audio Engine:** Experience zero-latency sound effects synthesized at runtime using the native Web Audio API ($0 budget compliant) — from gunpowder cracks and surface-aware footsteps to canyon wind drones and procedural saloon honky-tonk piano.
8. **Persistent Progress:** Save and load game states across manual slots and automatic chapter checkpoints with browser `localStorage`.

---

## 🗺️ 3. Connected World Districts

The frontier world is divided into 8 geographically continuous districts unlocked progressively across the campaign:

| District | Name | Significance & Key Clues |
|:---:|---|---|
| **1** | **Sheriff's Office & Jail** | Town center headquarters; contains Rowan Hale's discarded master ledger and cell records. |
| **2** | **The Gilded Spur Saloon** | Social hub run by Silas Thorne; contains customer bar tabs, timestamps, and patron rosters. |
| **3** | **Ironvault Bank** | Subterranean financial fortress; holds gold reserve vault records and suspicious withdrawal receipts. |
| **4** | **Telegraph Office** | Western Union dispatch hub (`poi_wire_terminal`); contains encrypted syndication wire traffic. |
| **5** | **Dr. Vance's Apothecary** | Medical dispensary (`poi_autopsy_log`); contains poison ledgers and suspicious death certificates. |
| **6** | **Redrock Train Depot** | Railroad cargo junction (`poi_cargo_manifest`); contains freight waybills and smuggled gold crates. |
| **7** | **Whispering Pines Cemetery** | Pioneer church graveyard (`poi_plot_47`); contains Plot 47's empty grave with Rowan Hale's badge. |
| **8** | **North Ridge Abandoned Mine** | High-altitude canyon fortress; syndicate hideout and location of the final Mayor Gideon Vale boss confrontation. |

---

## 🎓 4. Educational SQL Curriculum Syllabus

The game features 10 progressive curriculum levels validated by a semantic AST validator that rewards logical correctness rather than rigid string matching:

| Level | Title | SQL Core Concepts Learned | Narrative Mystery Connection |
|:---:|---|---|---|
| **0** | The First Ledger | `SELECT`, `FROM`, `LIMIT` | Discover citizens registered in the Query Creek census. |
| **1** | The Confidential Files | `WHERE`, boolean filters | Query confidential sheriff files marked by Rowan Hale. |
| **2** | The Alibi Audit | `WHERE`, string matching, `AND` | Prove Mayor Gideon Vale was present during the bank vault breach. |
| **2B** | The Midnight Tab | `IS NULL`, `LIKE` wildcards | Find unclosed bar tabs belonging to outlaw Mara Voss. |
| **3** | The Outlaw Arsenal | Relational targeting, `WHERE` | Pinpoint Silas Thorne's smuggled dynamite caches. |
| **4** | Relational Auditing | `INNER JOIN`, `ON` equality | Reconcile bank account numbers with registered citizen identities. |
| **5** | Forensic Aggregation | `COUNT`, `SUM`, `GROUP BY`, `HAVING` | Uncover suspicious gold transactions exceeding 2,000 gold. |
| **6** | The Shell Company Veil | Subqueries (`NOT IN`), `CASE WHEN` | Detect unlisted shell corporations and classify laundering severity. |
| **7** | Depot Manifest Discrepancies | Correlated subqueries, `EXISTS` | Expose weight fraud between declared and actual freight weights. |
| **8** | Sequential Audit Reconstruction | CTEs (`WITH`), Window Functions (`ROW_NUMBER()`) | Reconstruct the timeline of deleted telegraph dispatches. |
| **9** | The Arcane Vault Cipher | `json_extract()` on JSON payloads | Decrypt Mayor Gideon Vale's rotating Arcane Aegis shield frequencies. |

---

## 🛡️ 5. Database Security & Sandboxing Architecture

To protect game integrity while allowing arbitrary player query input, the SQLite Web Worker enforces robust security guardrails:
- **Query-Only Access:** All statements must begin with `SELECT`, `WITH`, `EXPLAIN`, or `PRAGMA`.
- **Mutation Rejection:** Data-altering commands (`DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, `ATTACH`, `DETACH`, `VACUUM`) are strictly rejected.
- **Row Clamping:** Result sets are capped at 500 rows to prevent browser memory exhaustion.
- **Runaway Iteration Protection:** Aborts stream iteration after 5,000 rows to halt malicious Cartesian product cross-joins.
- **Automatic Worker Recovery:** If the SQLite worker encounters a fatal error, `DbClient` automatically terminates, recovers, and reinitializes the worker without stalling the render loop.
- **Safe Rendering:** Result data is rendered as text nodes in React 19, eliminating XSS vulnerabilities.

---

## 🎧 6. Procedural Web Audio Engine ($0 Asset Budget)

The game includes a runtime synthesizer using the browser's native **Web Audio API**:
- **Firearms & Combat:** Gunpowder noise burst with lowpass sweep and low-frequency punch.
- **Locomotion SFX:** Real-time footstep synthesis distinguishing wooden boardwalks from dirt roads.
- **Dead-Eye Feedback:** Lowpass saw filter sweeps simulating adrenaline rush time slowdown.
- **Elemental Spells:** Distinct audio profiles for Shock (FM buzz), Fire (combustive roar), and Arcane (chime harmonics).
- **Stingers:** Dissonant chord stingers for broken alibis and major arpeggios for discovered clues.
- **Frontier Ambience:** Dual-oscillator low canyon wind drone paired with gentle procedural saloon piano.

---

## 🖥️ 7. Hardware Optimization & Diagnostics

Tuned specifically for discrete and mobile GPUs (such as the developer's **NVIDIA GeForce GTX 1650 Max-Q** via D3D12/WebGPU/WebGL2):
- **High Quality:** 2048x2048 Poisson-sampled shadows, 800 dust particles, full bloom and tone mapping.
- **Medium Quality (Default):** 1024x1024 shadows, 350 particles, sepia vignette.
- **Low Quality:** 512x512 shadows, 0 particles, basic post-processing.
- **Diagnostics HUD:** Displays real-time FPS, draw call counts, active mesh counts, and GPU renderer.

---

## 🎮 8. Controls Reference

| Control | Action | Subsystem |
|---|---|---|
| **WASD** | Movement (Camera-Relative) | Locomotion |
| **Shift** | Sprint | Locomotion |
| **Space** | Jump | Locomotion |
| **C** | Dodge Roll | Combat |
| **L-Click** | Fire Revolver | Firearms Combat |
| **R-Click / F** | Toggle Dead-Eye Time Dilation | Arcane Combat |
| **1 - 4** | Quick-Cast Elemental Spells (Dead-Eye) | Arcane Combat |
| **E** | Interact (Inspect Clue, Talk to NPC) | Investigation |
| **Q** | Sheriff's Sense (Highlight POIs) | Investigation |
| **M** | Open Frontier World Map | Navigation |
| **Tab** | Open Arcane SQL Grimoire / Corkboard | Investigation |
| **O** | Open Settings & Archive Dashboard | Configuration |
| **Esc** | Close Active Modal / Open Main Menu | System |

---

## 🛠️ 9. Technology Stack

- **Framework & UI:** React 19, Tailwind CSS, Lucide React, Zustand
- **Graphics Engine:** Babylon.js 8+ with WebGPU and WebGL2 fallback
- **Physics Engine:** Babylon.js Havok Physics V2 (WASM)
- **Database:** SQLite 3.54 WASM in a dedicated Web Worker with OPFS & in-memory fallback
- **SQL Editor:** CodeMirror 6 with dark frontier styling and schema-aware autocomplete
- **Build Tool:** Vite 6 with TypeScript in strict mode
- **Testing:** Node.js native test runner (`node --test`)

---

## 🚀 10. Local Development & Testing

### Installation
```bash
git clone https://github.com/your-username/query-creek.git
cd query-creek
npm install
```

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in Google Chrome or Brave.

### Run Automated Unit Tests
```bash
npm test
```
Executes 54 automated unit tests across 8 test suites:
- `tests/audio/audio.test.js`
- `tests/save/save.test.js`
- `tests/combat/combat.test.js`
- `tests/investigation/investigation.test.js`
- `tests/sql/advanced_curriculum.test.js`
- `tests/sql/curriculum.test.js`
- `tests/sql/security.test.js`
- `tests/sql/sqlite.test.js`
- `tests/world/districts.test.js`

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🌐 11. Vercel Internet Deployment Guide

Query Creek is pre-configured for one-click deployment on **Vercel** via [`vercel.json`](vercel.json).

### Crucial Headers Configured in `vercel.json`
To allow SQLite WASM and Havok Physics to utilize high-performance multithreading and the Origin Private File System (`OPFS`), modern browsers require **Cross-Origin Isolation**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    },
    {
      "source": "/assets/(.*).wasm",
      "headers": { "key": "Content-Type", "value": "application/wasm" }
    },
    {
      "source": "/assets/(.*).glb",
      "headers": { "key": "Content-Type", "value": "model/gltf-binary" }
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Deploying via Vercel CLI
```bash
npm i -g vercel
vercel deploy --prod
```

---

## 📜 12. Asset Licensing ($0 Budget Verification)

In strict adherence to the **$0 budget constraint**, all 40 3D models and textures are verified **CC0 1.0 Universal (Public Domain)**:
- **Humanoid Characters, Weapons & Buildings:** [Quaternius](https://quaternius.com) (CC0)
- **Town & Interior Saloon Props:** [Kenney](https://kenney.nl) (CC0)
- **PBR Environment Textures:** [Poly Haven](https://polyhaven.com) (CC0)

See [`ASSET_CREDITS.md`](ASSET_CREDITS.md) for individual file manifests and hashes.
