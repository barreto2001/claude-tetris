'use strict';

// Visual themes / skins for the Tetris board. Loaded after game.js.
// Exposes `window.getActiveTheme()` which game.js consults from
// `drawBlock`, `drawGrid` and `draw`/`drawNext`.

const THEMES = {
  retro: {
    // Same palette as the original game.js COLORS — the fallback theme.
    colors: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - yellow
      '#ba68c8', // T - purple
      '#81c784', // S - green
      '#e57373', // Z - red
      '#7986cb', // J - indigo
      '#ffb74d', // L - orange
      '#f06292', // Plus - pink
    ],
    bg: '#1a1a25',
    grid: '#22222e',
    // No custom drawBlock: falls back to the default flat block + highlight.
  },

  neon: {
    colors: [
      null,
      '#00e5ff',
      '#fff176',
      '#e040fb',
      '#69f0ae',
      '#ff1744',
      '#536dfe',
      '#ffab40',
      '#ff4081',
    ],
    bg: '#050508',
    grid: '#12121e',
    drawBlock(context, x, y, colorIndex, size, alpha, colors) {
      const color = colors[colorIndex];
      const bx = x * size + 1;
      const by = y * size + 1;
      const bw = size - 2;
      const bh = size - 2;

      context.globalAlpha = alpha;
      context.shadowBlur = 14;
      context.shadowColor = color;
      context.fillStyle = color;
      context.fillRect(bx, by, bw, bh);

      // Reset glow immediately so it never bleeds into later draws
      // (grid lines, next blocks, etc.) or tanks performance.
      context.shadowBlur = 0;
      context.shadowColor = 'transparent';

      context.fillStyle = 'rgba(255,255,255,0.18)';
      context.fillRect(bx, by, bw, 4);
      context.globalAlpha = 1;
    },
  },

  pastel: {
    colors: [
      null,
      '#b3e5fc',
      '#fff9c4',
      '#e1bee7',
      '#c8e6c9',
      '#ffcdd2',
      '#c5cae9',
      '#ffe0b2',
      '#f8bbd0',
    ],
    bg: '#fdf6f0',
    grid: '#e8dfe0',
    drawBlock(context, x, y, colorIndex, size, alpha, colors) {
      const color = colors[colorIndex];
      const bx = x * size + 1;
      const by = y * size + 1;
      const bw = size - 2;
      const bh = size - 2;
      const radius = Math.min(6, bw / 3, bh / 3);
      const hasRoundRect = typeof context.roundRect === 'function';

      context.globalAlpha = alpha;
      context.fillStyle = color;
      if (hasRoundRect) {
        context.beginPath();
        context.roundRect(bx, by, bw, bh, radius);
        context.fill();
      } else {
        context.fillRect(bx, by, bw, bh);
      }

      context.fillStyle = 'rgba(255,255,255,0.35)';
      if (hasRoundRect) {
        context.beginPath();
        context.roundRect(bx, by, bw, 4, [radius, radius, 0, 0]);
        context.fill();
      } else {
        context.fillRect(bx, by, bw, 4);
      }
      context.globalAlpha = 1;
    },
  },

  pixel: {
    colors: [
      null,
      '#4dd0e1',
      '#ffd54f',
      '#ba68c8',
      '#81c784',
      '#e57373',
      '#7986cb',
      '#ffb74d',
      '#f06292',
    ],
    bg: '#1a1a25',
    grid: '#22222e',
    drawBlock(context, x, y, colorIndex, size, alpha, colors) {
      const color = colors[colorIndex];
      const bx = x * size + 1;
      const by = y * size + 1;
      const bw = size - 2;
      const bh = size - 2;

      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(bx, by, bw, bh);

      // 4x4 pixel-art texture overlay, alternating light/dark tiles.
      const cellW = bw / 4;
      const cellH = bh / 4;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          context.fillStyle = (r + c) % 2 === 0
            ? 'rgba(0,0,0,0.08)'
            : 'rgba(255,255,255,0.08)';
          context.fillRect(bx + c * cellW, by + r * cellH, cellW, cellH);
        }
      }
      context.globalAlpha = 1;
    },
  },
};

const SKIN_STORAGE_KEY = 'tetris.skin.v1';
let currentSkinName = 'retro';

function getActiveTheme() {
  return THEMES[currentSkinName] || THEMES.retro;
}
window.getActiveTheme = getActiveTheme;

function loadStoredSkin() {
  try {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && THEMES[stored]) return stored;
  } catch (e) {
    // localStorage unavailable (e.g. private mode) — fall back silently.
  }
  return 'retro';
}

function saveSkin(name) {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, name);
  } catch (e) {
    // Ignore persistence failures; keep working in-memory.
  }
}

function applyTheme(name) {
  currentSkinName = THEMES[name] ? name : 'retro';
}

// Apply the saved (or default) theme before the game's first real draw().
applyTheme(loadStoredSkin());

const skinSelect = document.getElementById('skin-select');
if (skinSelect) {
  skinSelect.value = currentSkinName;
  skinSelect.addEventListener('change', () => {
    applyTheme(skinSelect.value);
    saveSkin(skinSelect.value);
    if (typeof window.draw === 'function') window.draw();
    if (typeof window.drawNext === 'function') window.drawNext();
  });
}

// Refresh the "next" preview immediately: it may have already been drawn
// once (during the initial spawn in game.js's init()) before this script
// applied the stored theme.
if (typeof window.drawNext === 'function') window.drawNext();
