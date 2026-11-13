# Query Creek: Frontier Noir — The Last Ledger
### A Cinematic Third-Person Open-World SQL Learning RPG

> *"The truth was recorded in the ledgers. You just need to know how to query them."*

---

## 🤠 About the Project
**Query Creek: Frontier Noir** is a cinematic, browser-playable 3D action-adventure RPG designed to teach real-world SQL through a dark western crime investigation. The player steps into the dusty boots of the newly appointed **Arcane Sheriff**, investigating the mysterious disappearance of the former sheriff **Rowan Hale**, an audacious bank robbery at the **Ironvault Bank**, and a criminal conspiracy orchestrated by **Mayor Gideon Vale**.

The game runs entirely client-side inside the browser using WebGL2/WebGPU and Web Workers, requiring no desktop installations, backend servers, or paid subscriptions.

---

## 🛠️ Technology Stack
- **Framework & UI:** React 19, Tailwind CSS, Lucide React, Zustand
- **Graphics Engine:** Babylon.js 8+ with WebGPU and WebGL2 fallback
- **Physics Engine:** Babylon.js Havok Physics V2 (WASM)
- **Database:** SQLite 3.54 WASM in a dedicated Web Worker with OPFS & in-memory fallback
- **SQL Editor:** CodeMirror 6 with SQL language support and schema-aware autocomplete
- **Tooling:** Vite 6, TypeScript (Strict Mode)
- **Target Hardware:** Desktop with discrete GPU (tuned for NVIDIA GeForce GTX 1650 Max-Q)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended, tested on v24)
- Modern web browser (Google Chrome, Brave, Edge) with hardware acceleration enabled

### Development Mode
```bash
npm install
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🎮 Controls
| Key | Action |
|---|---|
| **WASD** | Movement |
| **Shift** | Sprint |
| **Space** | Jump |
| **Tab** | Arcane SQL Grimoire / Investigation Terminal |
| **Q** | Sheriff's Sense (Highlight clues) |
| **F** | Dead-Eye Time Dilation & Combat Spellcasting |
| **Esc** | Pause / Main Menu |

---

## 📜 Asset Credits & Licensing
All 3D models and textures are verified **CC0 1.0 Universal (Public Domain)** with a strict **$0 budget**:
- **Characters, Weapons & Buildings:** [Quaternius](https://quaternius.com) (CC0)
- **Interior & Town Props:** [Kenney](https://kenney.nl) (CC0)
- **PBR Textures:** [Poly Haven](https://polyhaven.com) (CC0)

See [ASSET_CREDITS.md](ASSET_CREDITS.md) and [ASSET_ACQUISITION_REPORT.md](ASSET_ACQUISITION_REPORT.md) for full attribution.

