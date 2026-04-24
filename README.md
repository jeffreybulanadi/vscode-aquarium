# 🐟 VSCode Aquarium

> A living, breathing freshwater aquarium inside your VS Code editor — with real game mechanics, sprite-animated fish, and an ecological simulation that runs while you code.

![VSCode Aquarium Preview](screenshots/preview.png)

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://marketplace.visualstudio.com/items?itemName=jeffreybulanadi.vscodeaquarium)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.75+-blueviolet.svg)](https://code.visualstudio.com)

---

## What Is It?

VSCode Aquarium is not a screensaver — it's a fully interactive freshwater tank simulation that lives inside your editor panel. Your fish are alive. They get hungry. They hunt food, compete for pellets, grow larger with every meal, and **die** if you neglect them.

Think **Tamagotchi meets coding environment**, rendered in 60 FPS canvas with hand-crafted sprite fish.

---

## ✨ Features

### 🐠 Sprite-Animated Fish
- **7 freshwater species**, each with unique swim zones, speeds, and diet preferences
- **3-section body wave** animation — the whole spine undulates head-to-tail, not just the tail
- **Smooth direction turns** — fish squish-turn naturally instead of snapping to face the other way
- **Per-species body flexibility** — Arowana and Snakehead flex more; Pleco and Alligator Gar are stiff
- Multiple **color variants** per species (Silver / Red / Golden / Green Arowana, Tiger / Albino Oscar, etc.)

### 🎮 Game Mechanics
- **Hunger system** — fish slowly starve over 2–3 hours if unfed; feed them to keep them alive
- **Food preferences** — each species prefers specific food; correct matches earn more coins and restore more hunger
- **4 food types** — Pellet, Superworm, Cricket, Shrimp (each hand-animated)
- **Growth** — well-fed fish grow visibly up to **150%** of their base size
- **Death animation** — starved fish float belly-up to the surface and fade out
- **Coin economy** — earn coins by feeding the right food; balance persists across sessions

### 🌿 Living Environment
- **Swaying aquatic plants** — procedural blade-by-blade animation with per-blade phase offsets
- **Rising bubbles** — organic sine-wave drift
- **Light caustics shimmer** — animated water-surface light bands
- **Elliptical fish shadows** — depth cue on the gravel floor
- **Waste debris** — uneaten food leaves particles on the gravel; use the Clean Tank button
- **Day/Night cycle** — aquarium darkens automatically based on your real wall clock (dusk 20:00, night 22:00–05:00)

### 🖥️ UI & Controls
- **In-tank Spawn HUD** — click the ➕ button to instantly add fish with no Command Palette needed
- **Font Awesome icons** — crisp, professional control bar
- **Live clock** — HH:MM display synced to system time
- **Fish tooltips** — click any fish for species name, hunger %, size %, mood, and preferred food (4-second popup)
- **Hunger indicators** — blinking `!` above hungry fish (orange at 45%+, urgent red at 75%+)
- **Status bar** — shows live fish count and coin total at the bottom of VS Code
- **Responsive canvas** — aquarium scales to any panel size

---

## 🐠 Fish Roster

| Species | Variants | Swim Zone | Preferred Food | Character |
|---|---|---|---|---|
| **Arowana** | Silver · Golden · Red · Green | Top (surface) | Cricket, Shrimp | Fast apex predator, elegant glide |
| **Oscar Cichlid** | Tiger · Red · Albino | Mid-tank | Cricket, Superworm | Deep-bodied powerhouse, large eye |
| **Snakehead** | Olive · Giant · Rainbow | Upper-mid | Cricket, Shrimp | Aggressive ambush hunter |
| **Alligator Gar** | Olive · Spotted · Albino | Top-mid | Superworm, Shrimp | Ancient armored torpedo, stiff body |
| **Red-Tailed Catfish** | Natural · Albino | Bottom | Superworm, Pellet | Roams mid-tank when hungry |
| **Pleco** | Common · Royal · Gold Nugget | Gravel | Pellet | Stays on the bottom, barely moves |
| **Flowerhorn Cichlid** | Red Dragon · Golden · Kamfa · Blue | Mid-tank | Cricket, Superworm | Vivid colors, prominent hump |

> **Peacock Bass** is temporarily removed for a higher-quality sprite. Coming back soon.

---

## 🚀 Getting Started

### Install
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Search **"VSCode Aquarium"**
4. Click **Install**

The aquarium opens automatically when VS Code starts. A default tank with Arowana and Oscar is loaded.

### Feed Your Fish
| Action | How |
|---|---|
| Drop food at click position | Click anywhere on the canvas |
| Drop food at center | Click the 🍽️ Feed button in the HUD |
| Command Palette | `Aquarium: Feed Fish` |
| Choose food type | Click Pellet / Superworm / Cricket / Shrimp icons in HUD |

### Manage Your Tank
| Action | How |
|---|---|
| Spawn a fish | Click ➕ in the HUD → pick species & color variant |
| Add via palette | `Aquarium: Add Fish` |
| Remove all fish | `Aquarium: Remove All Fish` |
| Clean tank (waste) | Click the 🧹 Clean button (5-minute cooldown) |
| Switch fresh ↔ salt | `Aquarium: Switch Aquarium Type (Fresh/Salt)` |
| Toggle auto-open | `Aquarium: Toggle Auto-open on Startup` |

### Click Any Fish
A tooltip appears showing:
- Species name
- Hunger level (`0` = full → `100` = starving)
- Size scale (100%–150%)
- Current mood
- Preferred foods

---

## ⚙️ Configuration

Edit via **File → Preferences → Settings** or directly in `settings.json`:

```json
{
  "aquarium.type": "freshwater",
  "aquarium.autoOpen": true,
  "aquarium.fish": [
    { "species": "arowana",    "colorVariant": "silver" },
    { "species": "oscar",      "colorVariant": "tiger"  },
    { "species": "oscar",      "colorVariant": "albino" }
  ]
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `aquarium.type` | string | `"freshwater"` | `"freshwater"` or `"saltwater"` |
| `aquarium.autoOpen` | boolean | `true` | Open aquarium on every VS Code launch |
| `aquarium.fish` | array | _(3 defaults)_ | Fish in your tank; add/remove/customize |

---

## 🧰 Commands

| Command | Description |
|---|---|
| `Aquarium: Open Aquarium` | Open or re-focus the aquarium panel |
| `Aquarium: Add Fish` | Choose species & color variant to add |
| `Aquarium: Remove All Fish` | Empty the tank |
| `Aquarium: Feed Fish` | Drop pellets at center |
| `Aquarium: Switch Aquarium Type` | Toggle freshwater ↔ saltwater |
| `Aquarium: Toggle Auto-open on Startup` | Enable or disable auto-open |

---

## ⚡ Performance

- **60 FPS** target via `requestAnimationFrame`
- Background gradient baked to an offscreen canvas — only animated shimmer redraws each frame
- Gradients and color stops cached; no GC pressure per frame
- Sprite white-background removal runs once at load time, result cached
- Each fish costs ~1–2% CPU at 60 FPS; recommended max 8–10 fish

Tested on VS Code 1.75+ · Windows · macOS · Linux

---

## 🛠️ Development

### Prerequisites
- Node.js 16+
- TypeScript 5.3+
- VS Code 1.75+

### Build & Run
```bash
npm install
npm run compile   # Compile TypeScript → out/
npm run watch     # Watch mode for development
```

Press **F5** in VS Code to launch an Extension Host debug window.

### Project Structure
```
vscodeaquarium/
├── src/
│   └── extension.ts       # Extension host, webview creation, IPC
├── media/
│   ├── aquarium.js        # Canvas render loop, fish AI, game logic
│   ├── aquarium.html      # Webview shell + spawn HUD
│   ├── aquarium.css       # Styling
│   ├── *.jpg / *.png      # Fish sprites
│   └── fontawesome.*      # Icon fonts
├── out/                   # Compiled JS (git-ignored)
├── package.json           # Extension manifest
└── tsconfig.json
```

### Architecture Notes
- **Canvas 2D** rendering — no WebGL dependency
- **3-section sprite animation**: body clip → mid-posterior clip (rotated) → tail clip (nested in mid's frame), producing a seamless S-curve body wave
- **renderDir** float per fish: lerps from −1 to +1 at 10 units/s for smooth direction turns
- **Webview IPC** via `postMessage` for persistence (fish list, coins, tank type)
- Fish state stored in VS Code `settings.json`; coins in `globalState`

---

## 🗺️ Roadmap

- [ ] Peacock Bass — high-quality sprite coming back
- [ ] Saltwater species — Clownfish, Tang, Lionfish, Pufferfish, Marine Angel
- [ ] Tank decorations — rocks, driftwood, castles
- [ ] Fish aggression and territorial behavior
- [ ] Achievements system
- [ ] Breeding mechanics

---

## 🤝 Contributing

1. Fork and clone the repo
2. `npm install && npm run compile`
3. Press **F5** to test in Extension Host
4. Submit a pull request

Bug reports and feature requests → [GitHub Issues](https://github.com/jeffreybulanadi/vscode-aquarium/issues)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🙏 Credits

- Inspired by [vscode-pets](https://marketplace.visualstudio.com/items?itemName=tonybaloney.vscode-pets)
- Icons by [Font Awesome](https://fontawesome.com)
- Built with TypeScript and the VS Code Extension API

---

*Keep your fish fed. Keep your code flowing.* 🐟
