# Changelog

All notable changes to VSCode Aquarium are documented in this file.

## [1.5.2] - 2026-04-28

### Fixed
- Black screen and missing fish on fresh install: `window.FISH_ASSETS` in `aquarium.html` was out of sync with `extension.ts`
  - Removed 6 stale goldfish species entries (Giant Gourami, Black Moor, Lionhead, Shubunkin, Calico Oranda, Red Cap Oranda) that had unreplaced `{{...}}` URI placeholders
  - Added 6 missing species that were in `extension.ts` but absent from `FISH_ASSETS`: Tilapia, Indonesian Tiger, Electric Blue Ram, Diamond Stingray, Cherry Barb, Angelfish
- Spawn panel now shows the correct 16 current species; removed the 6 stale goldfish rows that pointed to non-existent species
- `loadSprites()` now filters out any unreplaced template placeholders (`{{...}}`) as a defensive guard, preventing this class of bug from recurring if `aquarium.html` and `extension.ts` drift out of sync again

## [1.5.0] - 2026-04-28

### Added
- **Fish Behaviors**
  - Schooling: Cherry Barb and Silver Dollar swim in coordinated Boids formations (separation, alignment, cohesion)
  - Territorial patrol: Oscar, Flowerhorn, Peacock Bass, and Electric Blue Ram each guard a home zone
  - Arowana surface breach: rare upward lunge toward the water surface, mimicking real hunting behavior
  - Arowana speed burst: spontaneous horizontal dash every 25-45s, independent of the breach
  - Pleco substrate parking: pleco periodically rests motionless on the tank floor
- **Predator-Prey Chase System** (purely cosmetic - no fish are harmed)
  - Predators (Arowana, Alligator Gar, Snakehead, Indonesian Tiger) detect and charge at small fish within 280px
  - Both predator and prey alternate between cruise and sprint phases during a chase
  - Predator bursts to 2.8× speed every 2-3.5s; prey counter-bursts to 3.2-4.6× speed every 0.8-1.6s
  - Cherry Barb and Electric Blue Ram flee predators and scatter naturally (each fish reacts independently)
  - Chase ends after 3.5-5.5s or if prey escapes; both decelerate organically via velocity smoothing

### Changed
- Tank starts empty by default - no pre-spawned fish on first launch
- Reset button clears all fish rather than restoring a default set
- Retroactive migration: existing sessions with old default fish are cleared on upgrade
- Fish sprite images moved to `media/fish/` subfolder; web assets remain in `media/`

### Performance
- 30 FPS cap (previously targeting 60 FPS) - halves CPU draw calls with no visible loss of animation quality
- Pre-baked color variants: color filters applied once at startup, eliminating per-frame `ctx.filter` overhead (largest GPU win)
- 512px sprite height cap on load - reduces VRAM usage and speeds up white-background removal ~9× for oversized source images
- 10-fish hard limit with on-screen indicator - prevents unbounded per-frame draw calls
- Rendering pauses automatically when the aquarium panel is hidden (zero CPU when not visible)
- Full-resolution sprites preserved for draw-time GPU scaling - sharp at any VS Code zoom level

### Fixed
- Angelfish black color variant now renders with a correct dark silhouette filter instead of appearing as a plain shadow
- Fish sprites stay sharp when VS Code UI is zoomed in (removed pre-scaling to a fixed pixel size)

---

## [0.1.0] - 2026-04-24

### Added
- Game Mechanics
  - Hunger system: fish slowly starve (2-3 hours), must feed to keep alive
  - Food preferences: each species prefers certain foods (cricket, shrimp, superworm, pellet)
  - Feeding behavior: hungry fish chase food, preferred food yields more satiety and coins
  - Growth system: fish grow up to 50 percent larger as they eat (visible size scaling)
  - Death and respawn: starving fish float belly-up to surface, fade, then disappear
  - Waste management: uneaten food spawns debris on gravel, clean button clears it (5-min cooldown)
  - Coins: earned by feeding, persistent across sessions via globalState
  - Day/Night cycle: real wall-clock based, aquarium darkens 20:00-07:00 with moon shimmer
  - Hunger indicators: blinking exclamation mark above hungry fish (orange at 45%+, red at 75%+)

- Fish Species (Freshwater)
  - Arowana (top swimmer, loves cricket and shrimp)
  - Oscar Cichlid (mid-tank, prefers pellets)
  - Snakehead (aggressive, opportunistic)
  - Peacock Bass (vibrant mid-range)
  - Alligator Gar (predatory bottom explorer)
  - Red-Tailed Catfish (bottom dweller, forages when hungry)
  - Pleco (algae eater, gravel-hugging)
  - Flowerhorn (colorful mid-tank cichlid)

- User Interface
  - Font Awesome 7 icon system (professional UI)
  - Live clock display (HH:MM, synced to system time)
  - Tooltip system: click fish to see species, hunger percent, size percent, mood, preferred food
  - Food selector: icon buttons for pellet, superworm, cricket, shrimp
  - Status bar integration: shows tank summary and coin count
  - Responsive canvas: scales to panel size

- Environment and Rendering
  - Dynamic water gradient with depth caustics
  - Gravel floor with fish shadows
  - Organic bubble animation with sine-wave drift
  - Procedurally generated swaying plants
  - Day/night overlay (20:00 dusk, 22:00-05:00 deep night with moon)

- Performance
  - Sprite-based fish rendering (60 FPS target)
  - Pre-baked background canvas (gradient and gravel)
  - Cached plant gradients
  - Efficient tail animation (two-part clip regions)
  - 2-5 MB extension footprint

- Developer Features
  - Modular architecture (extension.ts host, aquarium.js webview)
  - Sprite system with automatic white-background removal
  - Food preference and hunger decay maps per species
  - IPC messaging for state sync
  - globalState persistence for coins and growth

### Changed
- Complete HUD redesign: emoji replaced with Font Awesome icons
- Food dropdown replaced with icon button group
- Enhanced visual hierarchy with tabular-nums clock and backdrop blur
- Improved fish sprite quality and animation smoothness

### Fixed
- Operator precedence bug in hunger indicator blinking logic
- RTC catfish zone corrected (now proper bottom dweller at yMin 0.68)
- Font-relative path in Font Awesome CSS
- Coins persistence: now properly sent in pushState() to webview on reload

### Security
- CSP hardened: font-src added for woff2 loading
- No external CDN dependencies (Font Awesome bundled locally)
- Nonce-based script injection for webview security

---

## [0.0.1] - 2026-04-01 (Prototyping)

### Initial Implementation
- Basic canvas rendering with fish sprites
- Pellet and food mechanics
- Fish spawning and movement
- Water gradient background
- Bubbles and plant animations
- VS Code integration and status bar


