# VSCode Aquarium 🐠

**A living, breathing aquarium in your VS Code editor.** Watch carefully rendered fish swim, eat, grow, and thrive while you code. Real-time game mechanics: hunger, feeding, waste management, day/night cycles, and more.

Inspired by [vscode-pets](https://marketplace.visualstudio.com/items?itemName=tonybaloney.vscode-pets) — but with **full ecological simulation** and **beautiful sprite-based fish**.

---

## ✨ Features

### 🐟 Fish Species
**Freshwater** (default):
- **Arowana** — top swimmer, loves crickets & shrimp
- **Oscar Cichlid** — mid-tank, preferred food: pellets
- **Snakehead** — aggressive, opportunistic feeder
- **Peacock Bass** — vibrant, mid-range swimmer
- **Alligator Gar** — predatory, bottom explorer
- **Red-Tailed Catfish** — bottom dweller, roams for food when hungry
- **Pleco** — algae eater, stays on gravel
- **Flowerhorn** — colorful cichlid, mid-tank

**Saltwater** (toggle via command):
- Clownfish, Tang, Lionfish, Marine Angel, Pufferfish (coming soon)

### 🎮 Game Mechanics
- **Hunger System** — fish slowly starve (~2–3 hours); feed them to keep them alive
- **Food Preferences** — each species prefers certain foods (cricket, shrimp, superworm, pellet)
- **Feeding Behavior** — hungry fish chase food; preferred food restores more hunger & earns more coins
- **Growth** — fish grow larger (~50% max) as they eat, visible size increase
- **Death & Respawn** — starving fish die (belly-up float to surface); respawn via **Add Fish** command
- **Waste Management** — uneaten food leaves debris on gravel; use **Clean Tank** button (5-min cooldown)
- **Coins** — earned by feeding fish; persistent across sessions
- **Day/Night Cycle** — real wall-clock based; aquarium darkens 20:00–07:00 with moon shimmer
- **Hunger Indicators** — blinking `!` above hungry fish (orange >45%, red >75%)

### 🎨 User Interface
- **Font Awesome 7 Icons** — crisp, professional UI controls
- **Live Clock** — HH:MM display synced to system time
- **Tooltip System** — click any fish to see: species, hunger%, size%, mood, preferred food (4-second popup)
- **Status Bar Integration** — VS Code status bar shows tank summary & coin count
- **Food Selector** — icon buttons for pellet, superworm, cricket, shrimp
- **Responsive Canvas** — aquarium scales beautifully to panel size

### 🌿 Environment
- **Dynamic Background** — gradient water with depth caustics, shifts for day/night
- **Gravel Floor** — shadows beneath swimming fish
- **Bubbles** — organic floating animation with sine-wave drift
- **Aquatic Plants** — gently waving vegetation with procedural wind effect

---

## 🚀 Installation

1. **VS Code Marketplace**: Search **"VSCode Aquarium"** and click **Install**
2. Or manually: Download `.vsix` and run `code --install-extension vscode-aquarium-*.vsix`

---

## 📖 Usage

### Open the Aquarium
- **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) → `Aquarium: Open Aquarium`
- Extension auto-opens on first activation
- Click the aquarium icon in the side panel to re-open

### Feed the Fish
- **Click anywhere** on the canvas to drop food
- Or use **Feed button** (`🥄`) in HUD
- Or run **Command Palette** → `Aquarium: Feed Fish`
- Hold `Ctrl/Cmd` and click to use a specific food type

### Manage Fish
- **Add Fish** → Command Palette → `Aquarium: Add Fish` → pick species
- **Remove All** → Command Palette → `Aquarium: Remove All Fish`
- Fish **auto-save** to VS Code settings

### Tank Maintenance
- **Clean Tank** (`🧹`) → Removes waste debris, 5-minute cooldown
- **Switch Type** → Command Palette → `Aquarium: Switch Aquarium Type (Fresh/Salt)`
- All settings persist across VS Code sessions

### View Fish Stats
- **Click any fish** → tooltip appears with:
  - Species name
  - Hunger level (0–100%)
  - Size scale (100–150%)
  - Mood (Happy/Content/Hungry/Starving)
  - Preferred foods

---

## ⌨️ Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `aquarium.open` | — | Open aquarium in active editor |
| `aquarium.addFish` | — | Add a new fish (choose species) |
| `aquarium.removeAllFish` | — | Remove all fish (empty tank) |
| `aquarium.feed` | — | Drop pellets at center |
| `aquarium.switchType` | — | Toggle freshwater ↔ saltwater |

---

## ⚙️ Settings

Customize behavior via **File → Preferences → Settings** (`Ctrl+,`) or edit `.vscode/settings.json`:

```json
{
  "aquarium.type": "freshwater",
  "aquarium.fish": [
    { "species": "arowana" },
    { "species": "oscar" },
    { "species": "pleco" }
  ]
}
```

### Configuration Reference
- **`aquarium.type`** (`string`, default: `"freshwater"`)
  - Options: `"freshwater"`, `"saltwater"`
  - Controls water appearance & available species

- **`aquarium.fish`** (array, default: `[ { "species": "arowana" }, { "species": "oscar" } ]`)
  - Add/remove entries to customize starting tank
  - Supported species: see **Fish Species** section above
  - Format: `{ "species": "name", "colorVariant": "optional-variant" }`

---

## 🎵 Performance

- **60 FPS target** — optimized canvas rendering
- **Sprite-based fish** — efficient PNG/JPG frame-based animation
- **Cached gradients** — background pre-baked off-screen
- **Lazy sprite loading** — fish sprites load on first use
- **~2–5 MB footprint** — minimal extension overhead

**Tested on**: VS Code 1.75+ (Windows, macOS, Linux)

---

## 🐛 Troubleshooting

### Fish not appearing?
- Check that `aquarium.fish` setting contains valid species names
- Run `Aquarium: Add Fish` to spawn a new fish
- Restart VS Code

### Aquarium panel is black?
- Ensure the canvas is in focus (click on it)
- Wait 2–3 seconds for sprites to load
- Check browser console (`View → Developer Tools`) for errors

### High CPU usage?
- Reduce number of fish (each costs ~1–2% CPU when active)
- Close other heavy extensions
- Ensure VS Code hardware acceleration is enabled (`"window.experimentalUseCustomTitleBar": true`)

### Fish sizes look wrong?
- Fish grow dynamically as they eat; click to see current size %
- Some species are inherently smaller (pleco, flowerhorn)
- Resize the editor panel; fish scale proportionally

---

## 🎨 Customization

### Add Custom Fish Species
1. Create a PNG/JPG sprite (transparent background, fish facing right)
2. Place in `media/` folder
3. Add entry to `SPRITE_SPECIES` in `media/aquarium.js`:
   ```js
   myfishspecies: {
     scale: 1.2,
     facesLeft: false,
     targetH: 96,
     vy: 0.3
   }
   ```
4. Add to `extension.ts` FRESHWATER_SPECIES array
5. Run `npm run compile`

---

## 📚 Development

### Prerequisites
- Node.js 16+
- TypeScript 5.3+
- VS Code 1.75+

### Build & Run
```bash
npm install
npm run compile          # Compile TypeScript → out/
npm run watch            # Watch mode
```

Press `F5` in VS Code to launch the **Extension Host** (isolated VS Code window with extension loaded).

### Project Structure
```
vscode-aquarium/
├── src/
│   └── extension.ts      # Extension host, webview creation
├── media/
│   ├── aquarium.js       # Canvas render loop, game logic
│   ├── aquarium.html     # Webview shell
│   ├── aquarium.css      # Styling
│   ├── *.jpg             # Fish sprites
│   └── webfonts/         # Font Awesome icons
├── out/                  # Compiled JS (generated)
├── package.json          # Manifest
└── tsconfig.json         # TypeScript config
```

### Key Technical Details
- **Canvas-based** — all rendering via 2D context (60 FPS target)
- **Sprite system** — PNG/JPG sprites with white-background removal
- **Two-part tail** — body + tail clip regions with sine-wave animation
- **Webview IPC** — messages between extension host & webview for persistence
- **globalState** — coins & growth saved to VS Code globalState (cross-session)

---

## 🤝 Contributing

We'd love your help! Please:
1. **Report bugs** → GitHub Issues
2. **Suggest features** → Discussions
3. **Submit sprites** → Pull requests with new fish species
4. **Optimize code** → Performance improvements welcome

---

## 📄 License

MIT License — see LICENSE file

---

## 🎯 Roadmap

- [ ] Saltwater species full implementation
- [ ] Tank decorations (plants, rocks, castles)
- [ ] Achievements system
- [ ] Fish aggression & predation
- [ ] Temperature & pH system
- [ ] Breeding & genetic traits
- [ ] Leaderboard (cloud sync)

---

## 🙏 Credits

- Inspired by [vscode-pets](https://github.com/tonybaloney/vscode-pets)
- Icons via [Font Awesome 7](https://fontawesome.com)
- Built with TypeScript & VS Code Extension API

---

**Enjoy your aquarium! 🐠**
