import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const FRESHWATER_SPECIES = ['arowana', 'oscar', 'snakehead', 'alligatorgar', 'rtcatfish', 'pleco', 'flowerhorn', 'peacockbass', 'knifefish', 'silverdollar'];
const SALTWATER_SPECIES = ['clownfish', 'tang', 'lionfish', 'angel-marine', 'pufferfish'];

const SPECIES_LABELS: Record<string, string> = {
  arowana: 'Arowana', oscar: 'Oscar Cichlid', snakehead: 'Snakehead',
  alligatorgar: 'Alligator Gar',
  rtcatfish: 'Red-Tailed Catfish', pleco: 'Pleco', flowerhorn: 'Flowerhorn Cichlid',
  peacockbass: 'Peacock Bass', knifefish: 'Knifefish', silverdollar: 'Silver Dollar',
  clownfish: 'Clownfish', tang: 'Tang', lionfish: 'Lionfish', 'angel-marine': 'Marine Angel', pufferfish: 'Pufferfish'
};

const SPECIES_COLOR_VARIANTS_EXT: Record<string, string[]> = {
  arowana:      ['silver', 'golden', 'red', 'green'],
  oscar:        ['tiger', 'red', 'albino'],
  snakehead:    ['olive', 'giant', 'rainbow'],
  alligatorgar: ['olive', 'spotted', 'albino'],
  rtcatfish:    ['natural', 'albino'],
  pleco:        ['common', 'royal', 'goldnugget'],
  flowerhorn:   ['red_dragon', 'golden', 'kamfa', 'blue'],
  peacockbass:  ['natural', 'speckled', 'butterfly'],
  knifefish:    ['natural', 'ghost', 'dark'],
  silverdollar: ['silver', 'spotted', 'red_hook'],
};

let panel: vscode.WebviewPanel | undefined;
let statusBar: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Status bar — always visible summary of tank health
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'aquarium.open';
  statusBar.tooltip = 'Open Aquarium';
  statusBar.text = '🐟 Aquarium';
  statusBar.show();
  context.subscriptions.push(statusBar);

  const cfg = getConfig();
  const autoOpen = cfg.get<boolean>('autoOpen', true);
  const welcomed = context.globalState.get<boolean>('aquarium.welcomed', false);

  if (autoOpen) {
    openAquarium(context);
  }

  if (!welcomed) {
    context.globalState.update('aquarium.welcomed', true);
    if (autoOpen) {
      vscode.window.showInformationMessage(
        'Welcome to VSCode Aquarium! Your tank opens automatically each time VS Code starts.',
        'Disable Auto-open'
      ).then(choice => {
        if (choice === 'Disable Auto-open') {
          getConfig().update('autoOpen', false, vscode.ConfigurationTarget.Global);
        }
      });
    } else {
      vscode.window.showInformationMessage(
        'VSCode Aquarium is installed. Open it from the status bar or via Command Palette: "Aquarium: Open Aquarium".',
        'Open Now'
      ).then(choice => {
        if (choice === 'Open Now') { openAquarium(context); }
      });
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('aquarium.open', () => openAquarium(context)),
    vscode.commands.registerCommand('aquarium.addFish', () => addFish(context)),
    vscode.commands.registerCommand('aquarium.removeAllFish', () => removeAllFish(context)),
    vscode.commands.registerCommand('aquarium.feed', () => {
      panel?.webview.postMessage({ type: 'feed' });
    }),
    vscode.commands.registerCommand('aquarium.switchType', () => switchType(context)),
    vscode.commands.registerCommand('aquarium.toggleAutoOpen', () => toggleAutoOpen()),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aquarium') && panel) {
        pushState(context);
      }
    })
  );
}

export function deactivate() {
  panel?.dispose();
  statusBar?.dispose();
}

function openAquarium(context: vscode.ExtensionContext) {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Active);
    return;
  }
  panel = vscode.window.createWebviewPanel(
    'aquarium',
    '🐟 Aquarium',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
    }
  );

  panel.webview.html = getHtml(context, panel.webview);
  pushState(context);

  panel.webview.onDidReceiveMessage((msg) => {
    if (msg?.type === 'ready') {
      pushState(context);
    } else if (msg?.type === 'spawnFish') {
      const fish = getConfig().get<any[]>('fish', []).slice();
      fish.push({ species: msg.species, colorVariant: msg.colorVariant });
      getConfig().update('fish', fish, vscode.ConfigurationTarget.Global);
    } else if (msg?.type === 'resetFish') {
      getConfig().update('fish', msg.fish, vscode.ConfigurationTarget.Global);
    } else if (msg?.type === 'gameUpdate') {
      const { coins, fishCount } = msg;
      context.globalState.update('aquarium.coins', coins);
      if (statusBar) {
        statusBar.text = `🐟 ${fishCount} fish · 💰 ${coins}`;
      }
    } else if (msg?.type === 'fishDied') {
      const name = SPECIES_LABELS[msg.species] || msg.species;
      vscode.window.showWarningMessage(
        `💀 Your ${name} has died! Feed your fish regularly to keep them alive.`
      );
    } else if (msg?.type === 'achievement') {
      vscode.window.showInformationMessage(`🏆 Achievement: ${msg.text}`);
    }
  });

  panel.onDidDispose(() => {
    panel = undefined;
  });
}

function getConfig() {
  return vscode.workspace.getConfiguration('aquarium');
}

function pushState(context: vscode.ExtensionContext) {
  if (!panel) {
    return;
  }
  const cfg = getConfig();
  const type = cfg.get<string>('type', 'freshwater');
  const validSpecies = new Set(type === 'freshwater' ? FRESHWATER_SPECIES : SALTWATER_SPECIES);
  const rawFish = cfg.get<any[]>('fish', []);
  const filteredFish = rawFish.filter(f => f && validSpecies.has(f.species));
  const fish = filteredFish.length > 0 ? filteredFish : [
    { species: 'arowana', colorVariant: 'silver' },
    { species: 'oscar',   colorVariant: 'tiger'  },
    { species: 'oscar',   colorVariant: 'albino' },
  ];
  const coins = context.globalState.get<number>('aquarium.coins', 0);
  panel.webview.postMessage({
    type: 'state',
    aquariumType: type,
    fish,
    coins,
  });
}

async function addFish(context: vscode.ExtensionContext) {
  const cfg = getConfig();
  const type = cfg.get<string>('type', 'freshwater');
  const speciesList = type === 'freshwater' ? FRESHWATER_SPECIES : SALTWATER_SPECIES;

  const speciesItem = await vscode.window.showQuickPick(
    speciesList.map(s => ({ label: SPECIES_LABELS[s] || s, description: s })),
    { placeHolder: 'Choose a fish species' }
  );
  if (!speciesItem) { return; }
  const species = speciesItem.description!;

  const variants = SPECIES_COLOR_VARIANTS_EXT[species] || [];
  let colorVariant: string | undefined;
  if (variants.length > 0) {
    colorVariant = await vscode.window.showQuickPick(variants, { placeHolder: 'Choose a color variant (Esc for random)' }) ?? undefined;
  }

  const fish = cfg.get<any[]>('fish', []).slice();
  fish.push({ species, colorVariant });
  await cfg.update('fish', fish, vscode.ConfigurationTarget.Global);
  pushState(context);
}

async function removeAllFish(context: vscode.ExtensionContext) {
  await getConfig().update('fish', [], vscode.ConfigurationTarget.Global);
  pushState(context);
}

async function switchType(context: vscode.ExtensionContext) {
  const cfg = getConfig();
  const cur = cfg.get<string>('type', 'freshwater');
  const next = cur === 'freshwater' ? 'saltwater' : 'freshwater';
  const defaults = next === 'freshwater'
    ? [{ species: 'arowana', colorVariant: 'silver' }, { species: 'oscar', colorVariant: 'tiger' }, { species: 'oscar', colorVariant: 'albino' }]
    : [{ species: 'clownfish' }, { species: 'tang' }];
  await cfg.update('type', next, vscode.ConfigurationTarget.Global);
  await cfg.update('fish', defaults, vscode.ConfigurationTarget.Global);
  pushState(context);
  vscode.window.showInformationMessage(`Aquarium switched to ${next}.`);
}

async function toggleAutoOpen() {
  const cfg = getConfig();
  const current = cfg.get<boolean>('autoOpen', true);
  await cfg.update('autoOpen', !current, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(
    `Aquarium auto-open on startup is now ${!current ? 'enabled' : 'disabled'}.`
  );
}

function getHtml(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  const htmlPath = path.join(context.extensionPath, 'media', 'aquarium.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'aquarium.js'))
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'aquarium.css'))
  );
  const arowanaUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'arowana2.jpg'))
  );
  const oscarUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'oscar.jpg'))
  );
  const snakeheadUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'snakehead.jpg'))
  );
  const rtcUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'rtc.jpg'))
  );
  const flowerHornUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'flower-horn.jpg'))
  );
  const agUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'ag.jpg'))
  );
  const plecoUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'pleco.jpg'))
  );
  const peacockbassUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'peacockbass.jpg'))
  );
  const knifefishUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'knifefish.jpg'))
  );
  const silverdollarUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'silverdollar.jpg'))
  );
  const fontawesomeUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'fontawesome.min.css'))
  );
  const faSolidUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'fa-solid.min.css'))
  );
  const csp = `default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';`;
  html = html
    .replace(/{{cspSource}}/g, webview.cspSource)
    .replace(/{{csp}}/g, csp)
    .replace(/{{nonce}}/g, nonce)
    .replace(/{{scriptUri}}/g, scriptUri.toString())
    .replace(/{{styleUri}}/g, styleUri.toString())
    .replace(/{{fontawesomeUri}}/g, fontawesomeUri.toString())
    .replace(/{{faSolidUri}}/g, faSolidUri.toString())
    .replace(/{{arowanaUri}}/g, arowanaUri.toString())
    .replace(/{{oscarUri}}/g, oscarUri.toString())
    .replace(/{{snakeheadUri}}/g, snakeheadUri.toString())
    .replace(/{{rtcUri}}/g, rtcUri.toString())
    .replace(/{{flowerHornUri}}/g, flowerHornUri.toString())
    .replace(/{{agUri}}/g, agUri.toString())
    .replace(/{{plecoUri}}/g, plecoUri.toString())
    .replace(/{{peacockbassUri}}/g, peacockbassUri.toString())
    .replace(/{{knifefishUri}}/g, knifefishUri.toString())
    .replace(/{{silverdollarUri}}/g, silverdollarUri.toString());
  return html;
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
