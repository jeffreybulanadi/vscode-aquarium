# Changelog

All notable changes to VSCode Aquarium are documented in this file.

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


