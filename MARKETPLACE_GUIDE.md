# VSCode Marketplace Publishing Checklist

This document outlines all requirements to publish VSCode Aquarium to the VS Code Marketplace.

---

## Pre-Publish Checklist

### Extension Manifest (package.json)
- [x] name, kebab-case, lowercase
- [x] displayName, proper casing
- [x] description, clear, under 200 chars
- [x] version, semantic versioning (0.1.0)
- [x] publisher, your marketplace publisher account
- [x] license, MIT (must match LICENSE file)
- [x] icon, 128x128 PNG in media folder (required)
- [x] repository, GitHub URL
- [x] bugs, issue tracker URL
- [x] homepage, repository README URL
- [x] keywords, 5-10 relevant terms (aquarium, fish, pets, relaxing, etc.)
- [x] categories, up to 5 categories (currently: Other, Visualization)
- [x] engines.vscode, minimum version (^1.75.0)
- [x] main, entry point (out/extension.js)

### Documentation Files
- [x] README.md, comprehensive guide with all features, usage, troubleshooting
- [x] CHANGELOG.md, version history and detailed changes
- [x] LICENSE, MIT license text

### Asset Files
- [ ] media/icon.png, MISSING, 128x128 minimum (get from Nano Banana logo)
- [x] media/*.jpg, fish sprites (all present)
- [x] media/aquarium.html, .js, .css, webview files
- [x] media/fontawesome.min.css + webfonts, FA icons
- [x] .vscodeignore, excludes unnecessary files from package

### Code Quality
- [x] TypeScript compilation: npm run compile succeeds
- [x] No console errors (check with npm run watch)
- [x] Extension activates on onStartupFinished
- [x] Commands registered correctly
- [x] Settings schema properly defined

### Security and CSP
- [x] Content Security Policy in place (no unsafe-inline script)
- [x] Nonce-based script injection
- [x] All external assets verified (Font Awesome bundled locally)

---

## Steps to Publish

### 1. Create Publisher Account
```bash
# Install vsce (VS Code Extension CLI)
npm install -g @vscode/vsce

# Create publisher (one-time)
vsce create-publisher <publisher-name>
# Or login if already registered
vsce login <publisher-name>
```

Note: Requires free GitHub or Microsoft account. Create at https://marketplace.visualstudio.com/vscode

### 2. Add Icon to Extension
Once Nano Banana delivers the logo:
```bash
# Place logo as media/icon.png (128x128 minimum, PNG)
cp path/to/logo.png media/icon.png
```

### 3. Build and Package
```bash
# Ensure clean build
npm run compile

# Package as .vsix file
vsce package
# Output: vscode-aquarium-0.1.0.vsix

# Or use --target to build for specific platform
vsce package --target win32-x64 linux-x64 darwin-x64 darwin-arm64
```

### 4. Pre-Publish Validation
```bash
# Validate manifest before publishing
vsce show <publisher>.<extension-name>
```

### 5. Publish to Marketplace
```bash
# Publish the .vsix
vsce publish

# Or publish with specific version
vsce publish 0.1.0

# Or publish a file directly
vsce publish --packagePath vscode-aquarium-0.1.0.vsix
```

### 6. Publish to Open VSX (Optional, for non-VS Code editors)
```bash
# Get token from https://open-vsx.org
npm install -g ovsx

ovsx publish vscode-aquarium-0.1.0.vsix -p <your-token>
```

---

## Marketplace Description (for VS Marketplace web UI)

**Short Description** (displayed in search):
A living, breathing aquarium with game mechanics inside your VS Code editor. Feed, grow, and manage your fish.

**Long Description** (from README, auto-populated):
- Full feature list with screenshots
- Installation and usage guide
- Development info

**Keywords**: aquarium, fish, pets, ambient, relaxing, animation, game, productivity

**Icon**: 128 by 128 PNG (transparent background)

**Repository**: https://github.com/learnbeyondbc/vscode-aquarium

---

## Screenshots for Marketplace

Recommended screenshots to display on marketplace listing:

1. **Main aquarium view** (1024 by 768 or 1280 by 720)
   - Freshwater tank with multiple fish
   - HUD visible with icons and clock
   - Shows fish animations in progress

2. **Feeding interaction** (same size)
   - Fish chasing food
   - Coins display visible
   - Shows gameplay engagement

3. **Tooltip or hover state** (same size)
   - Click tooltip showing fish stats
   - Demonstrates game mechanics

4. **Day/night cycle** (same size, optional)
   - Aquarium with night overlay
   - Moon shimmer visible

Tools: Use Playwright script (npm run screenshot) or manual VS Code F5 launch, then screenshot tool

---

## Version Updates and Maintenance

### For Future Versions
1. Update version in package.json (e.g., 0.2.0)
2. Add entry to CHANGELOG.md
3. Run npm run compile
4. Publish: vsce publish

### Unpublish (if needed)
```bash
vsce unpublish <publisher>.<extension>
```

---

## Troubleshooting

### "Extension not found" during publish
- Ensure publisher name matches account
- Run vsce login to confirm credentials
- Check marketplace for duplication

### "Icon not found"
- Verify media/icon.png exists
- Ensure it is 128 by 128 minimum
- PNG format required

### Package size too large
- Check .vscodeignore, exclude node_modules/, src/, **/*.map, etc.
- Minimize dependencies
- Run npm ci --production before package

### CSP violations in marketplace
- Ensure all fonts and resources are bundled (no CDN URLs)
- Verify nonce injection in extension.ts
- Test in restricted CSP environment

---

## Final Checklist Before Go-Live

- [ ] Logo received and placed in media/icon.png
- [ ] README.md complete with all features and screenshots
- [ ] CHANGELOG.md up-to-date
- [ ] LICENSE file present (MIT)
- [ ] package.json metadata complete
- [ ] All dependencies in devDependencies (Font Awesome, Playwright)
- [ ] npm run compile succeeds with zero errors
- [ ] .vscodeignore excludes unnecessary files
- [ ] vsce package succeeds (generates .vsix)
- [ ] Marketplace screenshots captured (via Playwright or manual)
- [ ] Test extension in clean VS Code environment
- [ ] Publisher account created on marketplace.visualstudio.com
- [ ] vsce login successful
- [ ] Ready for vsce publish

---

## Support and Future

**Bug Reports and Feature Requests**:
- GitHub Issues: https://github.com/learnbeyondbc/vscode-aquarium/issues

**Community Contributions**:
- Pull requests welcome
- Fish sprite submissions encouraged

**Roadmap**:
- Saltwater species full implementation
- Tank decorations
- Achievements system
- Cross-device cloud sync

---

Published: [Date]
Publisher: learnbeyondbc
License: MIT
Latest Version: 0.1.0


