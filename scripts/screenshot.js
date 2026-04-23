/**
 * Playwright screenshot script for VSCode Aquarium extension
 * Captures the aquarium with fish, HUD, and game state
 * Usage: npm run screenshot
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 720 } });

  // Build mock HTML that simulates the webview environment
  const aquariumHtml = fs.readFileSync(path.join(__dirname, '../media/aquarium.html'), 'utf8');
  const aquariumCss = fs.readFileSync(path.join(__dirname, '../media/aquarium.css'), 'utf8');
  const aquariumJs = fs.readFileSync(path.join(__dirname, '../media/aquarium.js'), 'utf8');

  // Hardcode data URIs for fish sprites (in production, use file:// URLs)
  const mediaPath = path.join(__dirname, '../media');

  // Convert image to data URI
  function imageToDataUri(filePath) {
    if (!fs.existsSync(filePath)) {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA'; // fallback tiny 1x1
    }
    const data = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${data.toString('base64')}`;
  }

  const arowanaUri = imageToDataUri(path.join(mediaPath, 'arowana2.jpg'));
  const oscarUri = imageToDataUri(path.join(mediaPath, 'oscar.jpg'));
  const composite1Uri = imageToDataUri(path.join(mediaPath, 'snakehead-peacockbass-axolotl.jpg'));
  const composite2Uri = imageToDataUri(path.join(mediaPath, 'Untitled design.jpg'));
  const rtcUri = imageToDataUri(path.join(mediaPath, 'rtc.jpg'));
  const flowerHornUri = imageToDataUri(path.join(mediaPath, 'flower-horn.jpg'));
  const agUri = imageToDataUri(path.join(mediaPath, 'ag.jpg'));

  // Build FA CSS (use file URLs for webfonts)
  const faSolidCss = fs.readFileSync(path.join(mediaPath, 'fa-solid.min.css'), 'utf8')
    .replace(/\.\/webfonts\//g, `file:///${path.join(mediaPath, 'webfonts').replace(/\\/g, '/')}/`);
  const fontawesomeCss = fs.readFileSync(path.join(mediaPath, 'fontawesome.min.css'), 'utf8')
    .replace(/\.\/webfonts\//g, `file:///${path.join(mediaPath, 'webfonts').replace(/\\/g, '/')}/`);

  // Mock vscode API
  const vscodeApiMock = `
    window.acquireVsCodeApi = () => ({
      postMessage: (msg) => console.log('vscode.postMessage:', msg),
      getState: () => ({}),
      setState: () => {}
    });
  `;

  const mockHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        ${fontawesomeCss}
        ${faSolidCss}
        ${aquariumCss}
      </style>
    </head>
    <body>
      <div id="tank">
        <canvas id="aquarium" width="1024" height="720"></canvas>
        <div id="hud">
          <span id="label"><i class="fa-solid fa-fish"></i> Freshwater · 3 fish</span>
          <span id="clockLabel"><i class="fa-solid fa-clock"></i> 14:32</span>
          <div id="foodSelector">
            <button class="food-opt active" data-food="pellet"    title="Pellet"><i class="fa-solid fa-circle-dot"></i></button>
            <button class="food-opt"        data-food="superworm" title="Superworm"><i class="fa-solid fa-worm"></i></button>
            <button class="food-opt"        data-food="cricket"   title="Cricket"><i class="fa-solid fa-bug"></i></button>
            <button class="food-opt"        data-food="shrimp"    title="Shrimp"><i class="fa-solid fa-shrimp"></i></button>
          </div>
          <button id="feedBtn"  title="Drop food"><i class="fa-solid fa-utensils"></i> Feed</button>
          <button id="cleanBtn" title="Clean tank (5 min cooldown)"><i class="fa-solid fa-broom"></i> Clean</button>
          <span id="coinsLabel"><i class="fa-solid fa-coins"></i> 245</span>
        </div>
      </div>
      <script>${vscodeApiMock}</script>
      <script>window.FISH_ASSETS={
        arowana:'${arowanaUri}',
        oscar:'${oscarUri}',
        composite1:'${composite1Uri}',
        composite2:'${composite2Uri}',
        rtc:'${rtcUri}',
        flowerhorn:'${flowerHornUri}',
        ag:'${agUri}'
      };</script>
      <script>
        ${aquariumJs}
      </script>
    </body>
    </html>
  `;

  await page.setContent(mockHtml, { waitUntil: 'networkidle' });

  // Wait for sprites to load (aquarium.js loads them on init)
  await page.waitForTimeout(3000);

  // Trigger a few interactions to populate the aquarium
  await page.evaluate(() => {
    // Manually spawn fish to show activity
    const canvas = document.getElementById('aquarium');
    if (canvas) {
      // Simulate clicks to drop food
      for (let i = 0; i < 2; i++) {
        const event = new MouseEvent('click', {
          clientX: 200 + i * 300,
          clientY: 400,
          bubbles: true,
        });
        canvas.dispatchEvent(event);
      }
    }
  });

  // Wait for animation to render
  await page.waitForTimeout(2000);

  // Take screenshot at full resolution
  const screenshotPath = path.join(__dirname, '../media/screenshot.png');

  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`✅ Screenshot saved: ${screenshotPath}`);

  await browser.close();
  console.log('Playwright screenshot complete!');
})().catch((err) => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
