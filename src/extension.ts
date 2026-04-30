import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// ---- Types -------------------------------------------------------

interface FishEntry {
    readonly species: string;
    readonly colorVariant?: string;
}

type WebviewMessageType =
    | 'ready' | 'spawnFish' | 'resetFish' | 'gameUpdate' | 'fishDied' | 'achievement' | 'openExternal';

interface WebviewMessage {
    readonly type: WebviewMessageType;
    readonly species?: string;
    readonly colorVariant?: string;
    readonly fish?: FishEntry[];
    readonly coins?: number;
    readonly fishCount?: number;
    readonly text?: string;
    readonly url?: string;
}

// ---- Constants ---------------------------------------------------

const FRESHWATER_SPECIES: readonly string[] = [
    'arowana', 'oscar', 'snakehead', 'alligatorgar', 'rtcatfish', 'pleco',
    'flowerhorn', 'peacockbass', 'knifefish', 'silverdollar', 'tilapia',
    'indonesiantiger', 'electricblueram', 'diamondstingray', 'cherrybarb',
    'angelfish', 'arapaima', 'germanram', 'iridescentshark',
    'calicooranda', 'calicoranchu', 'cowranchu', 'lionheadoranda', 'redcaporanda',
];

const SALTWATER_SPECIES: readonly string[] = [
    'clownfish', 'tang', 'lionfish', 'angel-marine', 'pufferfish',
];

const SPECIES_LABELS: Readonly<Record<string, string>> = {
    arowana: 'Arowana', oscar: 'Oscar Cichlid', snakehead: 'Snakehead',
    alligatorgar: 'Alligator Gar', rtcatfish: 'Red-Tailed Catfish',
    pleco: 'Pleco', flowerhorn: 'Flowerhorn Cichlid',
    peacockbass: 'Peacock Bass', knifefish: 'Knifefish', silverdollar: 'Silver Dollar',
    tilapia: 'Tilapia', indonesiantiger: 'Indonesian Tiger Fish',
    electricblueram: 'Electric Blue Ram', diamondstingray: 'Diamond Stingray',
    cherrybarb: 'Cherry Barb', angelfish: 'Angelfish',
    arapaima: 'Arapaima', germanram: 'German Ram', iridescentshark: 'Iridescent Shark',
    calicooranda: 'Calico Oranda', calicoranchu: 'Calico Ranchu', cowranchu: 'Cow Ranchu',
    lionheadoranda: 'Lionhead Oranda', redcaporanda: 'Redcap Oranda',
    clownfish: 'Clownfish', tang: 'Tang', lionfish: 'Lionfish',
    'angel-marine': 'Marine Angel', pufferfish: 'Pufferfish',
};

const SPECIES_COLOR_VARIANTS: Readonly<Record<string, readonly string[]>> = {
    arowana:         ['silver', 'golden', 'red', 'green'],
    oscar:           ['tiger', 'red', 'albino'],
    snakehead:       ['olive', 'giant', 'rainbow'],
    alligatorgar:    ['olive', 'spotted', 'albino'],
    rtcatfish:       ['natural', 'albino'],
    pleco:           ['common', 'royal', 'goldnugget'],
    flowerhorn:      ['red_dragon', 'golden', 'kamfa', 'blue'],
    peacockbass:     ['natural', 'speckled', 'butterfly'],
    knifefish:       ['natural', 'ghost', 'dark'],
    silverdollar:    ['silver', 'spotted', 'red_hook'],
    tilapia:         ['natural', 'blue', 'red'],
    indonesiantiger: ['natural', 'dark', 'amber'],
    electricblueram: ['blue', 'longfin', 'gold'],
    diamondstingray: ['natural', 'dark', 'albino'],
    cherrybarb:      ['red', 'female', 'albino'],
    angelfish:       ['silver', 'gold', 'black', 'marble'],
    arapaima:        ['natural', 'gold', 'juvenile'],
    germanram:       ['natural', 'female', 'gold'],
    iridescentshark: ['natural', 'juvenile', 'albino'],
    calicooranda:    ['calico', 'red', 'blue'],
    calicoranchu:    ['calico', 'red', 'blue'],
    cowranchu:       ['tri', 'red', 'albino'],
    lionheadoranda:  ['natural', 'gold', 'blue'],
    redcaporanda:    ['redcap', 'red', 'gold'],
};

/** Maps HTML template placeholder key to filename inside media/fish/. */
const FISH_IMAGE_FILES: Readonly<Record<string, string>> = {
    arowanaUri:         'arowana2.jpg',
    oscarUri:           'oscar.jpg',
    snakeheadUri:       'snakehead.jpg',
    rtcUri:             'rtc.jpg',
    flowerHornUri:      'flower-horn.jpg',
    agUri:              'ag.jpg',
    plecoUri:           'pleco.jpg',
    peacockbassUri:     'peacockbass.jpg',
    knifefishUri:       'knifefish.jpg',
    silverdollarUri:    'silverdollar.jpg',
    tilapiaUri:         'tilapia.jpg',
    indonesiantigerUri: 'indonesian-tiger.jpg',
    electricblueramUri: 'electric-blue-ram.jpg',
    diamondstingrayUri: 'diamond-stingray.jpg',
    cherrybarbUri:      'cherrybarb.jpg',
    angelfishUri:       'angelfish.jpg',
    arapaimaUri:        'arapaima.jpg',
    germanramUri:       'german-ram.jpg',
    iridescentsharkUri: 'iridescent-shark.jpg',
    calicoOrandaUri:    'calico-oranda.jpg',
    calicoRanchuUri:    'calico-ranchu.jpg',
    cowRanchuUri:       'cow-ranchu.jpg',
    lionheadOrandaUri:  'lionhead-oranda.jpg',
    redcapOrandaUri:    'redcap-oranda.jpg',
};

// ---- Module state ------------------------------------------------

let panel: vscode.WebviewPanel | undefined;
let statusBar: vscode.StatusBarItem | undefined;
/** HTML template cached after first disk read. Resets on extension update (process restart). */
let _htmlTemplate: string | undefined;

// ---- Activation --------------------------------------------------

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'aquarium.open';
    statusBar.tooltip = 'Open Aquarium';
    statusBar.text = 'Fish Aquarium';
    statusBar.show();
    context.subscriptions.push(statusBar);

    const cfg = getConfig();
    const autoOpen = cfg.get<boolean>('autoOpen', true);
    const welcomed = context.globalState.get<boolean>('aquarium.welcomed', false);

    // One-time migration: clear old default fish so users start with an empty tank.
    const migrationVersion = context.globalState.get<number>('aquarium.migrationVersion', 0);
    if (migrationVersion < 2) {
        const rawFish = cfg.get<FishEntry[]>('fish', []);
        const isOldDefault =
            rawFish.length > 0 &&
            rawFish.length <= 3 &&
            rawFish.every(f =>
                (f.species === 'arowana' && !f.colorVariant) ||
                (f.species === 'oscar' && (f.colorVariant === 'tiger' || f.colorVariant === 'albino'))
            );
        if (isOldDefault) {
            await cfg.update('fish', [], vscode.ConfigurationTarget.Global);
        }
        await context.globalState.update('aquarium.migrationVersion', 2);
    }

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

export function deactivate(): void {
    panel?.dispose();
    statusBar?.dispose();
}

// ---- Panel management --------------------------------------------

function openAquarium(context: vscode.ExtensionContext): void {
    if (panel) {
        panel.reveal(vscode.ViewColumn.Active);
        return;
    }

    panel = vscode.window.createWebviewPanel(
        'aquarium',
        'Aquarium',
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
        }
    );

    panel.webview.html = getHtml(context, panel.webview);
    pushState(context);

    // Pass context.subscriptions so the listener disposable is freed on deactivation.
    panel.webview.onDidReceiveMessage(
        (msg: WebviewMessage) => handleWebviewMessage(msg, context),
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => { panel = undefined; });
}

function handleWebviewMessage(msg: WebviewMessage, context: vscode.ExtensionContext): void {
    switch (msg.type) {
        case 'ready':
            pushState(context);
            break;
        case 'spawnFish': {
            if (!msg.species) { return; }
            const fish = getConfig().get<FishEntry[]>('fish', []).slice();
            fish.push({ species: msg.species, colorVariant: msg.colorVariant });
            getConfig().update('fish', fish, vscode.ConfigurationTarget.Global);
            break;
        }
        case 'resetFish':
            getConfig().update('fish', msg.fish ?? [], vscode.ConfigurationTarget.Global);
            break;
        case 'gameUpdate': {
            const coins = msg.coins ?? 0;
            const fishCount = msg.fishCount ?? 0;
            context.globalState.update('aquarium.coins', coins);
            if (statusBar) {
                statusBar.text = `Fish ${fishCount} fish | Coin ${coins}`;
            }
            break;
        }
        case 'fishDied': {
            const name = SPECIES_LABELS[msg.species ?? ''] ?? msg.species ?? 'Unknown';
            vscode.window.showWarningMessage(
                `Your ${name} has died! Feed your fish regularly to keep them alive.`
            );
            break;
        }
        case 'achievement':
            vscode.window.showInformationMessage(`Achievement: ${msg.text ?? ''}`);
            break;
        case 'openExternal':
            if (msg.url) {
                vscode.env.openExternal(vscode.Uri.parse(msg.url));
            }
            break;
    }
}

// ---- State sync --------------------------------------------------

function getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('aquarium');
}

function pushState(context: vscode.ExtensionContext): void {
    if (!panel) { return; }
    const cfg = getConfig();
    const type = cfg.get<string>('type', 'freshwater');
    const validSpecies = new Set<string>(type === 'freshwater' ? FRESHWATER_SPECIES : SALTWATER_SPECIES);
    const rawFish = cfg.get<FishEntry[]>('fish', []);
    const fish = rawFish.filter(f => f && validSpecies.has(f.species));
    const coins = context.globalState.get<number>('aquarium.coins', 0);
    panel.webview.postMessage({ type: 'state', aquariumType: type, fish, coins });
}

// ---- Commands ----------------------------------------------------

async function addFish(context: vscode.ExtensionContext): Promise<void> {
    const cfg = getConfig();
    const type = cfg.get<string>('type', 'freshwater');
    const speciesList = type === 'freshwater' ? FRESHWATER_SPECIES : SALTWATER_SPECIES;

    const speciesItem = await vscode.window.showQuickPick(
        speciesList.map(s => ({ label: SPECIES_LABELS[s] ?? s, description: s })),
        { placeHolder: 'Choose a fish species' }
    );
    if (!speciesItem) { return; }

    const species = speciesItem.description!;
    const variants = SPECIES_COLOR_VARIANTS[species] ?? [];
    let colorVariant: string | undefined;
    if (variants.length > 0) {
        colorVariant = await vscode.window.showQuickPick(
            [...variants],
            { placeHolder: 'Choose a color variant (Esc for random)' }
        ) ?? undefined;
    }

    const fish = cfg.get<FishEntry[]>('fish', []).slice();
    fish.push({ species, colorVariant });
    await cfg.update('fish', fish, vscode.ConfigurationTarget.Global);
    pushState(context);
}

async function removeAllFish(context: vscode.ExtensionContext): Promise<void> {
    await getConfig().update('fish', [], vscode.ConfigurationTarget.Global);
    pushState(context);
}

async function switchType(context: vscode.ExtensionContext): Promise<void> {
    const cfg = getConfig();
    const cur = cfg.get<string>('type', 'freshwater');
    const next = cur === 'freshwater' ? 'saltwater' : 'freshwater';
    await cfg.update('type', next, vscode.ConfigurationTarget.Global);
    await cfg.update('fish', [], vscode.ConfigurationTarget.Global);
    pushState(context);
    vscode.window.showInformationMessage(`Aquarium switched to ${next}.`);
}

async function toggleAutoOpen(): Promise<void> {
    const cfg = getConfig();
    const current = cfg.get<boolean>('autoOpen', true);
    await cfg.update('autoOpen', !current, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
        `Aquarium auto-open on startup is now ${!current ? 'enabled' : 'disabled'}.`
    );
}

// ---- HTML generation ---------------------------------------------

function getHtml(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    // Read template from disk once; the extension host process restarts on update,
    // so the cached string is always in sync with the installed version.
    if (!_htmlTemplate) {
        _htmlTemplate = fs.readFileSync(
            path.join(context.extensionPath, 'media', 'aquarium.html'), 'utf8'
        );
    }

    const nonce = getNonce();
    const csp = [
        `default-src 'none'`,
        `img-src ${webview.cspSource} data:`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `font-src ${webview.cspSource}`,
        `script-src 'nonce-${nonce}'`,
    ].join('; ');

    let html = _htmlTemplate
        .replace(/{{cspSource}}/g, webview.cspSource)
        .replace(/{{csp}}/g, csp)
        .replace(/{{nonce}}/g, nonce)
        .replace(/{{scriptUri}}/g, webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'media', 'aquarium.js'))
        ).toString())
        .replace(/{{styleUri}}/g, webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'media', 'aquarium.css'))
        ).toString())
        .replace(/{{fontawesomeUri}}/g, webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'media', 'fontawesome.min.css'))
        ).toString())
        .replace(/{{faSolidUri}}/g, webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'media', 'fa-solid.min.css'))
        ).toString());

    // Fish image URIs: data-driven loop eliminates one const declaration per species.
    for (const [key, filename] of Object.entries(FISH_IMAGE_FILES)) {
        html = html.replace(
            `{{${key}}}`,
            webview.asWebviewUri(
                vscode.Uri.file(path.join(context.extensionPath, 'media', 'fish', filename))
            ).toString()
        );
    }

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