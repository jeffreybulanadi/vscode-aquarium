# VSCode Aquarium 🐟

A relaxing animated aquarium that lives inside a VS Code editor tab. Inspired by [vscode-pets](https://marketplace.visualstudio.com/items?itemName=tonybaloney.vscode-pets) — but with fish.

## Features
- Freshwater aquarium with **Arowana** and **Oscar** (more species coming).
- Saltwater mode (toggle via command).
- Animated bubbles, swaying plants, gravel floor, light caustics.
- Feed the fish (click anywhere or run `Aquarium: Feed Fish`) — fish chase pellets.
- Add / remove fish via command palette.
- Persistent state (fish list saved in settings).

## Commands
| Command | Description |
| --- | --- |
| `Aquarium: Open Aquarium` | Opens the aquarium in an editor tab |
| `Aquarium: Add Fish` | Add a fish (pick species) |
| `Aquarium: Remove All Fish` | Empty the tank |
| `Aquarium: Feed Fish` | Drop pellets |
| `Aquarium: Switch Aquarium Type (Fresh/Salt)` | Toggle freshwater/saltwater |

## Build
```bash
npm install
npm run compile
```
Press `F5` in VS Code to launch the extension host.
