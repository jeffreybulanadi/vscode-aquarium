(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const canvas = document.getElementById('aquarium');
  const ctx = canvas.getContext('2d');
  const label = document.getElementById('label');
  const feedBtn = document.getElementById('feedBtn');
  const foodTypeSelect = document.getElementById('foodType');

  let W = 0, H = 0;
  let aquariumType = 'freshwater';
  let fish = [];
  let bgCanvas = null;
  const bubbles = [];
  const plants = [];
  const pellets = [];
  let lastTime = performance.now();

  // ---------- Sprite loading ----------
  const SPRITES = {};

  function removeWhiteBackground(img) {
    const oc = document.createElement('canvas');
    oc.width = img.naturalWidth;
    oc.height = img.naturalHeight;
    const oc2 = oc.getContext('2d');
    oc2.drawImage(img, 0, 0);
    const id = oc2.getImageData(0, 0, oc.width, oc.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      // Only strip achromatic (near-gray) very-bright pixels — preserves pale fish like axolotl
      const minC = Math.min(r, g, b);
      const chroma = Math.max(r, g, b) - minC; // 0 = grey/white, high = coloured
      if (minC > 212 && chroma < 28) {
        d[i + 3] = minC >= 240 ? 0 : Math.round(((240 - minC) / 28) * 255);
      }
    }
    oc2.putImageData(id, 0, 0);
    return oc;
  }

  // Chroma-key removal (dead code preserved for future use — not called in runtime)
  // function removeColorBackground(img, tolerance) { ... }

  function loadSprites() {
    const assets = window.FISH_ASSETS || {};
    const keys = Object.keys(assets);
    if (keys.length === 0) { return Promise.resolve(); }
    return Promise.all(keys.map(key => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { SPRITES[key] = removeWhiteBackground(img); resolve(); };
      img.onerror = resolve;
      img.src = assets[key];
    })));
  }

  // ---------- Sprite species definitions ----------
  // fx/fy/fw/fh are fractions of the source sprite canvas (0-1)
  // facesLeft: head is at LEFT of image (need scale(-dir,1)); else head at RIGHT
  const SPRITE_SPECIES = {
    arowana:      { sheet: 'arowana',    fx: 0,        fy: 0,        fw: 1,        fh: 1,        targetH: 160, facesLeft: true,  tailRatio: 0.22 },
    oscar:        { sheet: 'oscar',fx: 0,        fy: 0,        fw: 1,        fh: 1,        targetH: 76,  facesLeft: false, tailRatio: 0.20 },
    snakehead:    { sheet: 'composite1', fx: 45/1339,  fy: 8/784,    fw: 1250/1339,fh: 248/784,  targetH: 34,  facesLeft: false, tailRatio: 0.22 },
    peacockbass:  { sheet: 'composite1', fx: 65/1339,  fy: 278/784,  fw: 1240/1339,fh: 255/784,  targetH: 64,  facesLeft: false, tailRatio: 0.22 },
    alligatorgar: { sheet: 'ag',         fx: 0,        fy: 0,        fw: 1,        fh: 1,        targetH: 140, facesLeft: false, tailRatio: 0.22 },
    rtcatfish:    { sheet: 'rtc',        fx: 0,        fy: 0,        fw: 1,        fh: 1,        targetH: 124, facesLeft: false, tailRatio: 0.25 },
    pleco:        { sheet: 'composite2', fx: 115/1339, fy: 540/784,  fw: 975/1339, fh: 242/784,  targetH: 48,  facesLeft: false, tailRatio: 0.18 },
    flowerhorn:   { sheet: 'flowerhorn', fx: 0,        fy: 0,        fw: 1,        fh: 1,        targetH: 88,  facesLeft: true,  tailRatio: 0.22 },
  };

  // Color variants per species — CSS filter strings
  const SPECIES_COLOR_VARIANTS = {
    arowana:      [{ id: 'silver',    filter: '' },
                   { id: 'golden',    filter: 'sepia(0.8) saturate(2.2) hue-rotate(18deg) brightness(1.1)' },
                   { id: 'red',       filter: 'sepia(1) saturate(3) hue-rotate(-20deg)' },
                   { id: 'green',     filter: 'hue-rotate(60deg) saturate(1.6) brightness(0.9)' }],
    oscar:        [{ id: 'tiger',     filter: '' },
                   { id: 'red',       filter: 'hue-rotate(-20deg) saturate(1.8) brightness(1.05)' },
                   { id: 'albino',    filter: 'sepia(0.25) brightness(1.5) saturate(0.4)' }],
    snakehead:    [{ id: 'olive',     filter: '' },
                   { id: 'giant',     filter: 'hue-rotate(28deg) saturate(0.7) brightness(0.88)' },
                   { id: 'rainbow',   filter: 'hue-rotate(-40deg) saturate(2.2) brightness(1.05)' }],
    peacockbass:  [{ id: 'speckled',  filter: '' },
                   { id: 'butterfly', filter: 'hue-rotate(22deg) saturate(1.4)' },
                   { id: 'mono',      filter: 'saturate(0.25) brightness(1.1)' }],
    alligatorgar: [{ id: 'olive',     filter: '' },
                   { id: 'spotted',   filter: 'hue-rotate(15deg) contrast(1.25)' },
                   { id: 'albino',    filter: 'sepia(0.35) brightness(1.6) saturate(0.4)' }],
    rtcatfish:    [{ id: 'natural',   filter: '' },
                   { id: 'albino',    filter: 'sepia(0.25) brightness(1.7) saturate(0.35)' }],
    pleco:        [{ id: 'common',    filter: '' },
                   { id: 'royal',     filter: 'hue-rotate(180deg) saturate(1.6) brightness(0.75)' },
                   { id: 'goldnugget',filter: 'sepia(0.7) saturate(3.2) hue-rotate(24deg)' }],
    flowerhorn:   [{ id: 'red_dragon',filter: '' },
                   { id: 'golden',    filter: 'sepia(0.6) saturate(2.5) hue-rotate(10deg) brightness(1.1)' },
                   { id: 'kamfa',     filter: 'hue-rotate(200deg) saturate(1.4) brightness(0.9)' },
                   { id: 'blue',      filter: 'hue-rotate(160deg) saturate(1.8) brightness(0.95)' }],
  };

  // Y zone fractions (fraction of canvas height) — controls vertical swim territory
  const SPECIES_ZONE = {
    alligatorgar: { yMin: 0.08, yMax: 0.55 },
    arowana:      { yMin: 0.22, yMax: 0.34 },
    snakehead:    { yMin: 0.08, yMax: 0.52 },
    peacockbass:  { yMin: 0.15, yMax: 0.75 },
    oscar:        { yMin: 0.15, yMax: 0.75 },
    rtcatfish:    { yMin: 0.20, yMax: 0.82 },
    flowerhorn:   { yMin: 0.18, yMax: 0.78 },
    pleco:        { yMin: 0.90, yMax: 0.97 },
  };

  // Base swim speeds (px/s)
  const SPECIES_SPEED = {
    peacockbass: 45, arowana: 35, snakehead: 30,
    oscar: 22, rtcatfish: 22, alligatorgar: 22, flowerhorn: 18,
    pleco: 8,
  };

  // ---------- Resize ----------
  function resize() {
    const DPR = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bgCanvas = null;  // invalidate baked background on resize
    seedPlants();
    fish.forEach(clampFish);
  }
  window.addEventListener('resize', resize);

  // ---------- Plants ----------
  function seedPlants() {
    plants.length = 0;
    const count = Math.max(5, Math.floor(W / 110));
    for (let i = 0; i < count; i++) {
      const hue = 95 + Math.random() * 35;
      const numBlades = 5 + Math.floor(Math.random() * 6);
      plants.push({
        x: (i + 0.2 + Math.random() * 0.6) * (W / count),
        height: 75 + Math.random() * 110,
        sway: Math.random() * Math.PI * 2,
        hue,
        blades: numBlades,
        bladeOffsets: Array.from({length: numBlades}, (_, b) => (b - numBlades/2 + 0.5) * 9 + (Math.random()-0.5)*4),
        bladePhases:  Array.from({length: numBlades}, () => Math.random() * Math.PI * 2),
        bladeHeights: Array.from({length: numBlades}, () => 0.55 + Math.random() * 0.45),
        // Pre-cache gradient color strings — avoids template literal per blade per frame
        stopColors: [
          `hsl(${hue - 8},52%,13%)`,
          `hsl(${hue},65%,26%)`,
          `hsl(${hue + 10},73%,38%)`,
        ],
      });
    }
  }

  // ---------- Bubbles ----------
  function spawnBubble() {
    bubbles.push({
      x: Math.random() * W,
      y: H + 5,
      r: 2 + Math.random() * 5,
      vy: -(20 + Math.random() * 40),
      drift: (Math.random() - 0.5) * 12,
      life: 0
    });
  }

  // ---------- Fish factory ----------
  function buildVisualParams(species, colorVariantId) {
    const variants = SPECIES_COLOR_VARIANTS[species] || [];
    let variant = variants.find(v => v.id === colorVariantId);
    if (!variant && variants.length > 0) {
      variant = variants[Math.floor(Math.random() * variants.length)];
    }
    const base = { colorVariant: variant ? variant.id : 'default', colorFilter: variant ? variant.filter : '' };
    if (species === 'oscar') {
      // Pre-compute orange patch positions once — avoid per-frame Math.random flicker
      const L = 65, Bh = 52;
      base.patches = [
        { x: 0.28 * L,  y: -0.28 * Bh, rx: 0.17 * L, ry: 0.22 * Bh, a: 0.3  },
        { x: -0.08 * L, y:  0.32 * Bh,  rx: 0.21 * L, ry: 0.15 * Bh, a: -0.2 },
        { x: -0.24 * L, y: -0.18 * Bh, rx: 0.14 * L, ry: 0.24 * Bh, a: 0.1  },
        { x:  0.12 * L, y:  0.38 * Bh,  rx: 0.11 * L, ry: 0.12 * Bh, a: 0.4  },
        { x: -0.36 * L, y:  0.28 * Bh,  rx: 0.16 * L, ry: 0.11 * Bh, a: -0.3 },
        { x:  0.40 * L, y:  0.04 * Bh,  rx: 0.09 * L, ry: 0.17 * Bh, a: 0.5  },
      ];
    }
    return base;
  }

  function makeFish(species, colorVariantId) {
    const zone = SPECIES_ZONE[species] || { yMin: 0.10, yMax: 0.85 };
    const spd  = SPECIES_SPEED[species] || 25;
    const yPos = H * (zone.yMin + Math.random() * (zone.yMax - zone.yMin));
    return {
      species,
      visualParams: buildVisualParams(species, colorVariantId),
      x: Math.random() * W,
      y: yPos,
      vx: (Math.random() < 0.5 ? -1 : 1) * (spd * 0.6 + Math.random() * spd * 0.4),
      vy: (Math.random() - 0.5) * 8,
      targetY: yPos,
      changeIn: 1 + Math.random() * 3,
      tailPhase: Math.random() * Math.PI * 2,
      mood: 'wander',
      target: null,
      hunger: 0
    };
  }

  function clampFish(f) {
    const margin = 50;
    const zone = SPECIES_ZONE[f.species] || { yMin: 0.05, yMax: 0.90 };
    const yMin = Math.max(40, H * zone.yMin);
    const yMax = Math.min(H - 40, H * zone.yMax);
    f.x = Math.max(margin, Math.min(W - margin, f.x));
    f.y = Math.max(yMin, Math.min(yMax, f.y));
  }

  function rebuildFish(list) {
    fish = list
      .filter(entry => entry.species === 'arowana' || !!SPRITE_SPECIES[entry.species])
      .map(entry => makeFish(entry.species, entry.colorVariant));
    fish.forEach(clampFish);
    const type = aquariumType === 'saltwater' ? '🐠 Saltwater' : '🐟 Freshwater';
    label.textContent = `${type} · ${fish.length} fish`;
  }

  // ---------- Update ----------
  function update(dt) {
    if (Math.random() < dt * 5) spawnBubble();
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y += b.vy * dt;
      b.x += Math.sin((b.life += dt) * 3) * b.drift * dt;
      if (b.y < -10) bubbles.splice(i, 1);
    }

    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      p.vy = Math.min(p.vy + 30 * dt, 40);
      p.y += p.vy * dt;
      if (p.y >= H - 30) {
        p.y = H - 30;
        p.vy = 0;
        // Food resting on floor: use a slower decay so it persists longer
        if (!p.resting) { p.resting = true; p.restLife = 60; }
        p.restLife -= dt;
        if (p.restLife <= 0) pellets.splice(i, 1);
      } else {
        p.life -= dt;
        if (p.life <= 0) pellets.splice(i, 1);
      }
    }

    for (const f of fish) {
      f.hunger += dt * 0.05;
      f.tailPhase += dt * (4 + Math.abs(f.vx) * 0.06);

      if (pellets.length > 0 && (!f.target || !pellets.includes(f.target))) {
        let best = null, bestD = Infinity;
        for (const p of pellets) {
          const d = (p.x - f.x) ** 2 + (p.y - f.y) ** 2;
          if (d < bestD) { bestD = d; best = p; }
        }
        f.target = best;
        f.mood = 'feeding';
      }
      if (pellets.length === 0) { f.target = null; f.mood = 'wander'; }

      let desiredVx, desiredVy;
      if (f.target) {
        const dx = f.target.x - f.x;
        const dy = f.target.y - f.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 80 + f.hunger * 20;
        desiredVx = (dx / dist) * speed;
        desiredVy = (dy / dist) * speed;
        if (dist < 15) {
          const idx = pellets.indexOf(f.target);
          if (idx >= 0) pellets.splice(idx, 1);
          f.hunger = Math.max(0, f.hunger - 1);
          f.target = null;
        }
      } else {
        f.changeIn -= dt;
        if (f.changeIn <= 0) {
          f.changeIn = 2 + Math.random() * 4;
          const z = SPECIES_ZONE[f.species] || { yMin: 0.10, yMax: 0.85 };
          f.targetY = H * z.yMin + Math.random() * H * (z.yMax - z.yMin);
          if (Math.random() < 0.25) f.vx = -f.vx;
        }
        const spd = SPECIES_SPEED[f.species] || 25;
        const baseSpeed = spd + Math.sin(performance.now() / 1500 + f.tailPhase) * spd * 0.3;
        desiredVx = Math.sign(f.vx || 1) * baseSpeed;
        // Organic vertical weave: gentle sine tied to tail phase
        const weave = Math.sin(f.tailPhase * 0.4) * baseSpeed * 0.06;
        desiredVy = (f.targetY - f.y) * 0.3 + weave;
      }

      f.vx += (desiredVx - f.vx) * Math.min(1, dt * 2);
      f.vy += (desiredVy - f.vy) * Math.min(1, dt * 1.5);  // slower vy blend = smoother depth
      if (f.species === 'arowana') f.vy *= 0.72;  // keep arowana gliding horizontally
      if (f.species === 'pleco')   f.vy *= 0.30;  // pleco hugs the bottom
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      const margin = 50;
      const bz = SPECIES_ZONE[f.species] || { yMin: 0.05, yMax: 0.90 };
      const yMin = Math.max(40, H * bz.yMin);
      const yMax = Math.min(H - 40, H * bz.yMax);
      if (f.x < margin)     { f.x = margin;     f.vx =  Math.abs(f.vx); }
      if (f.x > W - margin) { f.x = W - margin; f.vx = -Math.abs(f.vx); }
      // Soft boundary: zero out vy and pick new interior targetY — no elastic bounce
      if (f.y < yMin) {
        f.y = yMin; f.vy = 0;
        f.targetY = yMin + (yMax - yMin) * (0.2 + Math.random() * 0.5);
      }
      if (f.y > yMax) {
        f.y = yMax; f.vy = 0;
        f.targetY = yMin + (yMax - yMin) * (0.2 + Math.random() * 0.5);
      }
    }
  }

  // ---------- Background ----------
  // Bakes static gradient + gravel to an offscreen canvas once per resize/type-change.
  // Each frame we just blit it, then layer the animated shimmer on top.
  function prebakeBackground() {
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = W; bgCanvas.height = H;
    const bc = bgCanvas.getContext('2d');

    const grad = bc.createLinearGradient(0, 0, 0, H);
    if (aquariumType === 'saltwater') {
      grad.addColorStop(0, '#0a3a78'); grad.addColorStop(0.5, '#0a5a9a'); grad.addColorStop(1, '#063060');
    } else {
      grad.addColorStop(0, '#1a6a78'); grad.addColorStop(0.5, '#1f8896'); grad.addColorStop(1, '#0e4858');
    }
    bc.fillStyle = grad;
    bc.fillRect(0, 0, W, H);

    const gravelH = 28;
    bc.fillStyle = aquariumType === 'saltwater' ? '#c8b884' : '#3a2a1a';
    bc.fillRect(0, H - gravelH, W, gravelH);
    bc.fillStyle = aquariumType === 'saltwater' ? '#b09860' : '#5a3a22';
    for (let i = 0; i < W; i += 8) {
      bc.beginPath();
      bc.arc(i + (i % 16 ? 0 : 4), H - gravelH + 4 + (i % 7), 3, 0, Math.PI * 2);
      bc.fill();
    }
  }

  function drawBackground(t) {
    if (!bgCanvas) prebakeBackground();
    ctx.drawImage(bgCanvas, 0, 0);

    // Animated light shimmer — cheap, no GC, drawn on top of baked base
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const x = ((t * 30 + i * 220) % (W + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(x, 0, 90, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlants(t) {
    for (const p of plants) {
      ctx.save();
      ctx.translate(p.x, H - 28);
      const master = Math.sin(t * 1.2 + p.sway);
      for (let b = 0; b < p.blades; b++) {
        const ox = p.bladeOffsets[b];
        const h  = p.height * p.bladeHeights[b];
        const sw = master * 0.14 + Math.sin(t * 1.9 + p.bladePhases[b]) * 0.05;
        const tx = ox + sw * h, ty = -h;
        const cx1 = ox + sw * h * 0.30, cy1 = -h * 0.38;
        const cx2 = tx - sw * h * 0.08, cy2 = -h * 0.72;
        const hw  = Math.max(1.5, 4.2 - Math.abs(ox) * 0.05);

        // Re-use cached stop color strings — no template literals / GC per blade
        const grad = ctx.createLinearGradient(ox, 0, tx, ty);
        grad.addColorStop(0,   p.stopColors[0]);
        grad.addColorStop(0.5, p.stopColors[1]);
        grad.addColorStop(1,   p.stopColors[2]);

        ctx.beginPath();
        ctx.moveTo(ox - hw, -1);
        ctx.bezierCurveTo(cx1 - hw * 0.7, cy1, cx2 - hw * 0.3, cy2, tx, ty);
        ctx.bezierCurveTo(cx2 + hw * 0.3, cy2, cx1 + hw * 0.7, cy1, ox + hw, -1);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawBubbles() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (const b of bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFood() {
    const now = performance.now() / 600;  // hoist outside per-item loop
    for (const p of pellets) {
      ctx.save();
      ctx.translate(p.x, p.y);
      const w = p.wiggle + now;
      const type = p.type || 'pellet';

      if (type === 'pellet') {
        ctx.fillStyle = '#8a5a20';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b07838';
        ctx.beginPath();
        ctx.arc(-1, -1, 1.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'superworm') {
        ctx.rotate(p.angle + Math.sin(w) * 0.3);
        // Segmented body — 6 overlapping ovals
        const segs = 6, segL = 4, segH = 3.2;
        for (let s = 0; s < segs; s++) {
          const bx = (s - segs / 2 + 0.5) * (segL * 0.75);
          const by = Math.sin(w + s * 0.8) * 1.2;
          const t  = s / (segs - 1);
          ctx.fillStyle = `hsl(42,${70 - t * 15}%,${52 + t * 10}%)`;
          ctx.beginPath();
          ctx.ellipse(bx, by, segL / 2, segH / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Head
        ctx.fillStyle = '#3a2800';
        ctx.beginPath();
        ctx.arc((segs / 2) * (segL * 0.75) - 1, Math.sin(w + segs * 0.8) * 1.2, 2.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'cricket') {
        ctx.rotate(p.angle + Math.sin(w * 0.8) * 0.2);
        // Body (oval)
        ctx.fillStyle = '#5a4020';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#3a2810';
        ctx.beginPath();
        ctx.ellipse(7, 0, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Antennae
        ctx.strokeStyle = '#3a2810';
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(9, -1); ctx.lineTo(15 + Math.sin(w) * 2, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(9,  1); ctx.lineTo(14 + Math.cos(w) * 2,  5); ctx.stroke();
        // Legs (3 per side)
        ctx.strokeStyle = '#4a3018';
        for (let l = 0; l < 3; l++) {
          const lx = -3 + l * 3.5;
          const kick = Math.sin(w * 1.5 + l * 1.1) * 2;
          ctx.beginPath(); ctx.moveTo(lx, -3); ctx.lineTo(lx - 1, -7 - kick); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(lx,  3); ctx.lineTo(lx + 1,  7 + kick); ctx.stroke();
        }

      } else if (type === 'shrimp') {
        ctx.rotate(p.angle);
        // Curved segmented body
        const bend = Math.sin(w * 0.9) * 0.25;
        ctx.save();
        ctx.rotate(bend);
        // Tail fan
        ctx.fillStyle = 'rgba(255,160,120,0.75)';
        for (let f2 = -2; f2 <= 2; f2++) {
          ctx.beginPath();
          ctx.moveTo(-9, 0);
          ctx.lineTo(-14 + Math.abs(f2), f2 * 3);
          ctx.lineTo(-12, f2 * 1.5);
          ctx.closePath();
          ctx.fill();
        }
        // Body segments
        const cols = ['#ffb09a','#ffa080','#ff9070','#ff8060','#e06850'];
        for (let s = 0; s < 5; s++) {
          const bx = (s - 2) * 3;
          ctx.fillStyle = cols[s];
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.ellipse(bx, Math.sin(bend * 3 + s * 0.5) * 1.2, 2.4, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Head + rostrum
        ctx.fillStyle = '#e06040';
        ctx.beginPath();
        ctx.ellipse(9, 0, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rostrum spike
        ctx.strokeStyle = '#c04020';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(17, -3); ctx.stroke();
        // Eye
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(11, -1.5, 1, 0, Math.PI * 2); ctx.fill();
        // Swimmerets
        ctx.strokeStyle = 'rgba(255,160,120,0.6)';
        ctx.lineWidth = 0.7;
        for (let l = 0; l < 4; l++) {
          const lx = l * 3.5 - 5;
          ctx.beginPath(); ctx.moveTo(lx, 3); ctx.lineTo(lx + Math.sin(w + l) * 2, 7); ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // ===================== AROWANA CANVAS FALLBACK =====================
  // Used before sprite loads. Sprite path handled via SPRITE_SPECIES.
  function drawArowanaCanvas(f) {
    const phase = f.tailPhase;
    const dir = f.vx >= 0 ? 1 : -1;
    const L = 145, Hh = 17;       // very elongated — 8:1 ratio
    const wag = Math.sin(phase) * 0.3;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(dir, 1);
    ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 0.01) * 0.3);

    // --- Tail fin (bilobed, drawn first so body overlaps base) ---
    ctx.fillStyle = 'rgba(170, 210, 228, 0.9)';
    ctx.strokeStyle = 'rgba(120, 170, 200, 0.7)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(-L / 2 - 14, -Hh / 2 + wag * 30, -L / 2 - 30, -Hh + wag * 42);
    ctx.quadraticCurveTo(-L / 2 - 18, -Hh / 3, -L / 2, 0);
    ctx.quadraticCurveTo(-L / 2 - 14, Hh / 2 - wag * 30, -L / 2 - 30, Hh - wag * 42);
    ctx.quadraticCurveTo(-L / 2 - 18, Hh / 3, -L / 2, 0);
    ctx.fill(); ctx.stroke();

    // --- Long dorsal fin (from ~mid-body to caudal peduncle) ---
    ctx.fillStyle = 'rgba(195, 230, 248, 0.72)';
    ctx.strokeStyle = 'rgba(130, 180, 210, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(L / 8, -Hh / 2);
    ctx.quadraticCurveTo(-L / 8, -Hh - 16 + Math.sin(phase * 0.6) * 3, -L / 2 + 4, -Hh / 3);
    ctx.lineTo(-L / 2 + 4, -Hh / 2 + 1);
    ctx.quadraticCurveTo(-L / 8, -Hh - 5, L / 8, -Hh / 2 + 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // --- Long anal fin (mirror on belly) ---
    ctx.beginPath();
    ctx.moveTo(L / 8, Hh / 2);
    ctx.quadraticCurveTo(-L / 8, Hh + 16 - Math.sin(phase * 0.6) * 3, -L / 2 + 4, Hh / 3);
    ctx.lineTo(-L / 2 + 4, Hh / 2 - 1);
    ctx.quadraticCurveTo(-L / 8, Hh + 5, L / 8, Hh / 2 - 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // --- Main body — flat-topped torpedo ---
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(L / 2, 2);                                                 // snout (slightly below center — upturned mouth)
      ctx.bezierCurveTo(L / 2 - 8,  -Hh * 0.18, L / 3,  -Hh * 0.72, 0,   -Hh / 2);   // flat dorsal line
      ctx.bezierCurveTo(-L / 4, -Hh * 0.48, -L / 2 + 10, -Hh * 0.28, -L / 2, 0);
      ctx.bezierCurveTo(-L / 2 + 10, Hh * 0.42, -L / 4,   Hh * 0.62, 0,    Hh / 2);   // curved belly
      ctx.bezierCurveTo(L / 3,  Hh * 0.88, L / 2 - 8,   Hh * 0.32, L / 2, 2);
      ctx.closePath();
    };

    const bodyGrad = ctx.createLinearGradient(0, -Hh, 0, Hh);
    bodyGrad.addColorStop(0,    '#6a9ab0');
    bodyGrad.addColorStop(0.18, '#b8d8ec');
    bodyGrad.addColorStop(0.45, '#e6f4ff');   // bright silver midband
    bodyGrad.addColorStop(0.72, '#a8cce0');
    bodyGrad.addColorStop(1,    '#5a8898');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#5a8090';
    ctx.lineWidth = 0.8;
    bodyPath();
    ctx.fill(); ctx.stroke();

    // --- Scales (clipped to body) ---
    ctx.save();
    bodyPath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(90, 150, 190, 0.38)';
    ctx.lineWidth = 0.7;
    const cols = 22, scaleW = L / cols;
    for (let col = 0; col < cols; col++) {
      const cx = -L / 2 + col * scaleW + scaleW / 2;
      // Upper row
      ctx.beginPath();
      ctx.arc(cx, -2, scaleW * 0.58, Math.PI, 0);
      ctx.stroke();
      // Lower row (offset)
      ctx.beginPath();
      ctx.arc(cx + scaleW / 2, 3, scaleW * 0.58, 0, Math.PI);
      ctx.stroke();
    }
    // Lateral line
    ctx.strokeStyle = 'rgba(90, 150, 190, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, 1.5, L / 2 - 6, 0);
    ctx.stroke();
    ctx.restore();

    // --- Iridescent sheen ---
    const sheen = ctx.createLinearGradient(-L / 4, -Hh, L / 4, 0);
    sheen.addColorStop(0, 'rgba(210, 245, 255, 0.38)');
    sheen.addColorStop(1, 'rgba(100, 200, 230, 0.0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.ellipse(-L / 10, -Hh / 3, L / 3.2, Hh / 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Pectoral fin ---
    ctx.fillStyle = 'rgba(195, 230, 248, 0.62)';
    ctx.strokeStyle = 'rgba(130, 180, 210, 0.45)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(L / 4, 2);
    ctx.quadraticCurveTo(L / 10, Hh / 2 + 11, -L / 10, Hh / 3);
    ctx.lineTo(L / 10, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // --- Extended lower jaw (prognathous mouth) ---
    ctx.fillStyle = '#9ab8ca';
    ctx.strokeStyle = '#5a8090';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(L / 2, 2);
    ctx.lineTo(L / 2 + 14, 7);    // jaw tip projects forward
    ctx.lineTo(L / 2 + 10, 11);
    ctx.lineTo(L / 2 - 3, 7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Upper lip
    ctx.fillStyle = '#8aaaba';
    ctx.beginPath();
    ctx.moveTo(L / 2,  2);
    ctx.lineTo(L / 2 + 6, -1);
    ctx.lineTo(L / 2 + 2, 2);
    ctx.closePath();
    ctx.fill();

    // --- Barbels ---
    ctx.strokeStyle = '#7aaaba';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    for (let b = 0; b < 2; b++) {
      ctx.beginPath();
      ctx.moveTo(L / 2 + 10 + b * 3, 7 + b);
      ctx.quadraticCurveTo(
        L / 2 + 16 + b * 4, 15 + b * 2,
        L / 2 + 11 + b * 2, 24 + b * 3 + Math.sin(phase + b) * 4
      );
      ctx.stroke();
    }

    // --- Eye ---
    const ex = L / 2 - 14, ey = -Hh / 4;
    ctx.fillStyle = '#18283a';
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(ex + 1.5, ey - 1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ===================== OSCAR =====================
  // Oscar cichlid: tall oval body, dark charcoal base with irregular
  // orange-red tiger blotches, enormous orange-ringed eye, spiny dorsal,
  // large cichlid mouth, ocellus spot near tail.
  function drawOscar(f) {
    const phase = f.tailPhase;
    const dir = f.vx >= 0 ? 1 : -1;
    const { patches } = f.visualParams;
    const L = 65, Bh = 52;
    const wag = Math.sin(phase) * 0.22;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(dir, 1);
    ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 0.01) * 0.22);

    // --- Caudal (tail) fin ---
    ctx.fillStyle = '#1c0c04';
    ctx.strokeStyle = '#0a0500';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(-L / 2 - 10, -Bh / 3 + wag * 22, -L / 2 - 24, -Bh / 2.6 + wag * 28);
    ctx.quadraticCurveTo(-L / 2 - 27, 0, -L / 2 - 24,  Bh / 2.6 - wag * 28);
    ctx.quadraticCurveTo(-L / 2 - 10,  Bh / 3 - wag * 22, -L / 2, 0);
    ctx.fill(); ctx.stroke();

    // --- Body base (deep oval, head slightly wider — teardrop) ---
    const bodyGrad = ctx.createRadialGradient(L / 12, -Bh / 6, 3, 0, 0, L / 1.3);
    bodyGrad.addColorStop(0,   '#4e2e14');
    bodyGrad.addColorStop(0.5, '#281408');
    bodyGrad.addColorStop(1,   '#120800');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#0a0500';
    ctx.lineWidth = 1.2;
    // Slightly wider/taller at head side
    ctx.beginPath();
    ctx.save();
    ctx.scale(1, 1);
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.bezierCurveTo(L / 2,  -Bh / 2, -L / 2 + 14, -Bh / 2, -L / 2, 0);
    ctx.bezierCurveTo(-L / 2,  Bh / 2, L / 2,         Bh / 2, L / 2, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // --- Orange blotch pattern (clipped to body) ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.bezierCurveTo(L / 2, -Bh / 2, -L / 2 + 14, -Bh / 2, -L / 2, 0);
    ctx.bezierCurveTo(-L / 2,  Bh / 2, L / 2,        Bh / 2, L / 2, 0);
    ctx.clip();
    for (const p of patches) {
      // Dark orange base
      ctx.fillStyle = '#c05010';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, p.a, 0, Math.PI * 2);
      ctx.fill();
      // Brighter orange highlight centre
      ctx.fillStyle = '#e87030';
      ctx.beginPath();
      ctx.ellipse(p.x - p.rx * 0.12, p.y - p.ry * 0.2, p.rx * 0.52, p.ry * 0.52, p.a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // --- Ocellus spot (iconic black spot with orange halo near tail) ---
    ctx.fillStyle = '#ff9028';
    ctx.beginPath();
    ctx.arc(-L / 2 + 17, -Bh / 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0500';
    ctx.beginPath();
    ctx.arc(-L / 2 + 17, -Bh / 4, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // --- Spiny dorsal fin ---
    ctx.fillStyle = 'rgba(28, 10, 2, 0.92)';
    ctx.strokeStyle = '#0a0500';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(L / 2 - 4, -Bh / 2 + 2);
    const spines = 11;
    for (let i = 0; i < spines; i++) {
      const xi = L / 2 - 4 - i * (L - 8) / spines;
      const sh  = i < 5 ? 13 + i * 2.8 : 27 - (i - 5) * 2.2;
      ctx.lineTo(xi, -Bh / 2 - sh + Math.sin(phase * 0.8 + i * 0.45) * 1.5);
    }
    ctx.lineTo(-L / 2 + 6, -Bh / 2 + 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Orange dorsal edge
    ctx.strokeStyle = 'rgba(220, 80, 10, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(L / 4, -Bh / 2 - 14);
    ctx.quadraticCurveTo(0, -Bh / 2 - 24, -L / 4, -Bh / 2 - 19);
    ctx.stroke();

    // --- Anal fin ---
    ctx.fillStyle = 'rgba(28, 10, 2, 0.85)';
    ctx.strokeStyle = '#0a0500';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(L / 4, Bh / 2 - 3);
    ctx.quadraticCurveTo(0, Bh / 2 + 15 + Math.sin(phase * 0.6) * 2, -L / 4, Bh / 2 - 3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // --- Pectoral fin ---
    ctx.fillStyle = 'rgba(48, 20, 4, 0.8)';
    ctx.beginPath();
    ctx.moveTo(L / 3, Bh / 8);
    ctx.quadraticCurveTo(L / 5, Bh / 2.2, L / 10, Bh / 3);
    ctx.lineTo(L / 4, 0);
    ctx.closePath();
    ctx.fill();

    // --- Large cichlid mouth ---
    ctx.fillStyle = '#2a1008';
    ctx.strokeStyle = '#0a0500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L / 2 + 1, -Bh / 10);
    ctx.lineTo(L / 2 + 10, -Bh / 18);
    ctx.quadraticCurveTo(L / 2 + 13, 0, L / 2 + 10, Bh / 18);
    ctx.lineTo(L / 2 + 1, Bh / 10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // --- Eye — very large with thick orange iris ring ---
    const ex = L / 2 - 16, ey = -Bh / 5;
    ctx.fillStyle = '#e87820';          // orange ring
    ctx.beginPath();
    ctx.arc(ex, ey, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#120800';           // dark iris
    ctx.beginPath();
    ctx.arc(ex, ey, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';           // catchlight
    ctx.beginPath();
    ctx.arc(ex + 2.5, ey - 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ===================== GENERIC (other species) =====================
  const SPECIES_DEF = {
    goldfish:      { len: 55,  height: 30, body: '#ff8a1f', belly: '#ffd28a', fin: '#ff6a00', tail: 'fan',     shape: 'oval'    },
    guppy:         { len: 35,  height: 18, body: '#5fb0e8', belly: '#cfeaff', fin: '#ff77aa', tail: 'fan',     shape: 'oval'    },
    angelfish:     { len: 60,  height: 60, body: '#e8e8e8', belly: '#ffffff', fin: '#333',    tail: 'kite',    shape: 'diamond', stripes: '#333' },
    betta:         { len: 50,  height: 30, body: '#a01060', belly: '#e040a0', fin: '#400030', tail: 'flowing', shape: 'oval'    },
    clownfish:     { len: 50,  height: 28, body: '#ff7720', belly: '#ffd0a0', fin: '#222',    tail: 'fan',     shape: 'oval', stripes: '#fff' },
    tang:          { len: 60,  height: 38, body: '#1860c8', belly: '#1860c8', fin: '#ffd000', tail: 'fan',     shape: 'oval'    },
    lionfish:      { len: 70,  height: 36, body: '#b8401a', belly: '#f0d088', fin: '#fff0c0', tail: 'fan',     shape: 'oval', stripes: '#3a1a08' },
    'angel-marine':{ len: 65,  height: 60, body: '#ffd14a', belly: '#ffe890', fin: '#1860c8', tail: 'kite',    shape: 'diamond', stripes: '#1860c8' },
    pufferfish:    { len: 55,  height: 48, body: '#d8c060', belly: '#f4ecb8', fin: '#806030', tail: 'fan',     shape: 'round', spots: '#3a2a08' },
  };

  function drawGeneric(f) {
    const d = SPECIES_DEF[f.species] || SPECIES_DEF.goldfish;
    const phase = f.tailPhase;
    const dir = f.vx >= 0 ? 1 : -1;
    const L = d.len, Hh = d.height;
    const wag = Math.sin(phase) * 0.28;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(dir, 1);
    ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 0.01) * 0.3);

    ctx.fillStyle = d.fin;
    ctx.beginPath();
    if (d.tail === 'flowing') {
      ctx.moveTo(-L/2,0);
      ctx.quadraticCurveTo(-L/2-25,-Hh+wag*10,-L/2-35,Hh/2+wag*15);
      ctx.quadraticCurveTo(-L/2-20,0,-L/2-35,-Hh/2-wag*15);
      ctx.quadraticCurveTo(-L/2-25,Hh-wag*10,-L/2,0);
    } else if (d.tail === 'kite') {
      ctx.moveTo(-L/2,0); ctx.lineTo(-L/2-20,-Hh/2+wag*8); ctx.lineTo(-L/2-10,0); ctx.lineTo(-L/2-20,Hh/2-wag*8);
    } else {
      ctx.moveTo(-L/2,0); ctx.lineTo(-L/2-18,-Hh/2+wag*8); ctx.lineTo(-L/2-18,Hh/2-wag*8);
    }
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = d.body;
    ctx.beginPath();
    if (d.shape === 'diamond') {
      ctx.moveTo(L/2,0); ctx.lineTo(0,-Hh/2); ctx.lineTo(-L/2,0); ctx.lineTo(0,Hh/2);
    } else {
      ctx.ellipse(0, 0, L/2, Hh/2, 0, 0, Math.PI*2);
    }
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = d.belly;
    ctx.beginPath();
    ctx.ellipse(0, Hh/4, L/2.2, Hh/4, 0, 0, Math.PI*2);
    ctx.fill();

    if (d.stripes) {
      ctx.fillStyle = d.stripes;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i*(L/4),0,4,Hh/2-2,0,0,Math.PI*2); ctx.fill(); }
    }
    if (d.spots) {
      ctx.fillStyle = d.spots;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-L/4+i*8,-Hh/6+(i%2?6:-2),3,0,Math.PI*2); ctx.fill(); }
    }

    ctx.fillStyle = d.fin;
    ctx.beginPath();
    ctx.moveTo(-L/6,-Hh/2); ctx.quadraticCurveTo(0,-Hh/2-14,L/6,-Hh/2); ctx.closePath(); ctx.fill();

    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(L/3,-Hh/8,Math.max(3,Hh/10),0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(L/3+1,-Hh/8,Math.max(1.5,Hh/18),0,Math.PI*2); ctx.fill();

    ctx.restore();
  }

  // ===================== GENERIC SPRITE FISH =====================
  // Handles any species in SPRITE_SPECIES: crops from sheet, applies color filter,
  // splits into body + tail with wag animation.
  function drawSpriteSheetFish(f) {
    const def = SPRITE_SPECIES[f.species];
    if (!def) return;
    const sprite = SPRITES[def.sheet];
    if (!sprite) return;

    const phase = f.tailPhase;
    const dir   = f.vx >= 0 ? 1 : -1;
    const { targetH, tailRatio, facesLeft } = def;

    // Pixel crop from the source sheet
    const sx = def.fx * sprite.width,  sy = def.fy * sprite.height;
    const sw = def.fw * sprite.width,  sh = def.fh * sprite.height;

    // Derive targetW from real sprite aspect ratio — preserves proportions correctly
    const targetW = targetH * (sw / sh);
    const tailW   = targetW * tailRatio;
    const OVERLAP = Math.max(5, Math.round(targetH * 0.06));

    ctx.save();
    ctx.translate(f.x, f.y + Math.sin(phase * 0.7) * 1.5);
    if (f.visualParams && f.visualParams.colorFilter) { ctx.filter = f.visualParams.colorFilter; }
    // facesLeft → original image has head-LEFT → scale(-dir) to swim correctly
    ctx.scale(facesLeft ? -dir : dir, 1);
    ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 0.01) * 0.2);

    if (facesLeft) {
      // Tail is at the RIGHT of the image (x = +targetW/2)
      const pivotX = targetW / 2 - tailW;
      // Body
      ctx.save();
      ctx.beginPath();
      ctx.rect(-targetW / 2, -targetH / 2 - 4, targetW - tailW + OVERLAP, targetH + 8);
      ctx.clip();
      ctx.drawImage(sprite, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
      // Tail (wag around pivot)
      ctx.save();
      ctx.translate(pivotX, 0);
      ctx.rotate(Math.sin(phase) * 0.22);
      ctx.translate(-pivotX, 0);
      ctx.beginPath();
      ctx.rect(pivotX - OVERLAP, -targetH / 2 - 4, tailW + OVERLAP, targetH + 8);
      ctx.clip();
      ctx.drawImage(sprite, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
    } else {
      // Tail is at the LEFT of the image (x = -targetW/2)
      const pivotX = -targetW / 2 + tailW;
      // Body
      ctx.save();
      ctx.beginPath();
      ctx.rect(pivotX - OVERLAP, -targetH / 2 - 4, targetW - tailW + OVERLAP, targetH + 8);
      ctx.clip();
      ctx.drawImage(sprite, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
      // Tail (wag around pivot)
      ctx.save();
      ctx.translate(pivotX, 0);
      ctx.rotate(Math.sin(phase) * 0.22);
      ctx.translate(-pivotX, 0);
      ctx.beginPath();
      ctx.rect(-targetW / 2, -targetH / 2 - 4, tailW + OVERLAP, targetH + 8);
      ctx.clip();
      ctx.drawImage(sprite, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFish(f) {
    const def = SPRITE_SPECIES[f.species];
    if (def && SPRITES[def.sheet]) { drawSpriteSheetFish(f); return; }
    // Canvas fallbacks (sprite not loaded yet)
    if (f.species === 'arowana') drawArowanaCanvas(f);
    else if (f.species === 'oscar') drawOscar(f);
    else drawGeneric(f);
  }

  // Soft elliptical shadow under each fish — depth cue
  function drawFishShadow(f) {
    const def = SPRITE_SPECIES[f.species];
    const fishH = def ? def.targetH : 50;
    const fishW = fishH * 2.2;
    const floorY = H - 28;
    const dist = floorY - f.y;
    if (dist > H * 0.65) return;  // too far up — shadow invisible
    const alpha = Math.max(0, 0.22 - dist / (H * 0.65) * 0.22);
    const scaleX = Math.max(0.3, 1 - dist / (H * 0.55));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(f.x, floorY - 2, fishW * 0.42 * scaleX, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function render(t) {
    drawBackground(t);
    drawPlants(t);
    drawBubbles();
    drawFood();
    for (const f of fish) drawFishShadow(f);
    for (const f of fish) drawFish(f);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render(now / 1000);
    requestAnimationFrame(loop);
  }

  // ---------- Interaction ----------
  function dropFood(x, y, type) {
    const foodType = type || (foodTypeSelect ? foodTypeSelect.value : 'pellet');
    const count = foodType === 'superworm' ? 3 : foodType === 'cricket' ? 4 : 6;
    for (let i = 0; i < count; i++) {
      pellets.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 10,
        vy: 8 + Math.random() * 10,
        life: 35,
        type: foodType,
        angle: Math.random() * Math.PI * 2,
        wiggle: Math.random() * Math.PI * 2,
      });
    }
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    dropFood(e.clientX - rect.left, e.clientY - rect.top);
  });
  feedBtn.addEventListener('click', () => dropFood(W / 2, 20));

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (msg.type === 'state') {
      if (aquariumType !== msg.aquariumType) { bgCanvas = null; }  // rebake for new water type
      aquariumType = msg.aquariumType;
      rebuildFish(msg.fish || []);
    } else if (msg.type === 'feed') {
      dropFood(W / 2, 20);
    }
  });

  // ---------- Init ----------
  loadSprites().then(() => {
    resize();
    vscode.postMessage({ type: 'ready' });
    requestAnimationFrame((t) => { lastTime = t; loop(t); });
  });
})();
