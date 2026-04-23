import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const FRESHWATER_SPECIES = ['arowana', 'oscar', 'snakehead', 'peacockbass', 'axolotl', 'alligatorgar', 'rtcatfish', 'pleco', 'flowerhorn', 'goldfish', 'guppy', 'angelfish', 'betta'];
const SALTWATER_SPECIES = ['clownfish', 'tang', 'lionfish', 'angel-marine', 'pufferfish'];

const SPECIES_LABELS: Record<string, string> = {
  arowana: 'Arowana', oscar: 'Oscar Cichlid', snakehead: 'Snakehead',
  peacockbass: 'Peacock Bass', axolotl: 'Axolotl', alligatorgar: 'Alligator Gar',
  rtcatfish: 'Red-Tailed Catfish', pleco: 'Pleco', flowerhorn: 'Flowerhorn Cichlid',
  goldfish: 'Goldfish', guppy: 'Guppy', angelfish: 'Angelfish', betta: 'Betta',
  clownfish: 'Clownfish', tang: 'Tang', lionfish: 'Lionfish', 'angel-marine': 'Marine Angel', pufferfish: 'Pufferfish'
};

const SPECIES_COLOR_VARIANTS_EXT: Record<string, string[]> = {
  arowana:      ['silver', 'golden', 'red', 'green'],
  oscar:        ['tiger', 'red', 'albino'],
  snakehead:    ['olive', 'giant', 'rainbow'],
  peacockbass:  ['speckled', 'butterfly', 'mono'],
  axolotl:      ['leucistic', 'wild', 'golden', 'melanoid'],
  alligatorgar: ['olive', 'spotted', 'albino'],
  rtcatfish:    ['natural', 'albino'],
  pleco:        ['common', 'royal', 'goldnugget'],
  flowerhorn:   ['red_dragon', 'golden', 'kamfa', 'blue'],
};

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Auto-open the aquarium when the extension activates
  openAquarium(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('aquarium.open', () => openAquarium(context)),
    vscode.commands.registerCommand('aquarium.addFish', () => addFish(context)),
    vscode.commands.registerCommand('aquarium.removeAllFish', () => removeAllFish(context)),
    vscode.commands.registerCommand('aquarium.feed', () => {
      panel?.webview.postMessage({ type: 'feed' });
    }),
    vscode.commands.registerCommand('aquarium.switchType', () => switchType(context))
  );
}

export function deactivate() {
  panel?.dispose();
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
  panel.webview.postMessage({
    type: 'state',
    aquariumType: cfg.get<string>('type', 'freshwater'),
    fish: cfg.get<any[]>('fish', [])
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
    ? [{ species: 'arowana' }, { species: 'oscar' }, { species: 'peacockbass' }, { species: 'pleco' }]
    : [{ species: 'clownfish' }, { species: 'tang' }];
  await cfg.update('type', next, vscode.ConfigurationTarget.Global);
  await cfg.update('fish', defaults, vscode.ConfigurationTarget.Global);
  pushState(context);
  vscode.window.showInformationMessage(`Aquarium switched to ${next}.`);
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
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'arowana.png'))
  );
  const oscarUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'oscar.jpg'))
  );
  const composite1Uri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'snakehead-peacockbass-axolotl.jpg'))
  );
  const composite2Uri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'Untitled design.jpg'))
  );
  const rtcUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'rtc.jpg'))
  );
  const flowerHornUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'flower-horn.jpg'))
  );
  const underwaterGrassUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'underwater-grass.jpg'))
  );
  const csp = `default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;
  html = html
    .replace(/{{cspSource}}/g, webview.cspSource)
    .replace(/{{csp}}/g, csp)
    .replace(/{{nonce}}/g, nonce)
    .replace(/{{scriptUri}}/g, scriptUri.toString())
    .replace(/{{styleUri}}/g, styleUri.toString())
    .replace(/{{arowanaUri}}/g, arowanaUri.toString())
    .replace(/{{oscarUri}}/g, oscarUri.toString())
    .replace(/{{composite1Uri}}/g, composite1Uri.toString())
    .replace(/{{composite2Uri}}/g, composite2Uri.toString())
    .replace(/{{rtcUri}}/g, rtcUri.toString())
    .replace(/{{flowerHornUri}}/g, flowerHornUri.toString())
    .replace(/{{underwaterGrassUri}}/g, underwaterGrassUri.toString());
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
