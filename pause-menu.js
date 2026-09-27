'use strict';

// Pause menu: overlay separate from the game-over #overlay.
// Relies on globals defined in game.js: togglePause(), init(), startLevel.

const pauseMenu = document.getElementById('pause-menu');
const pauseMainPanel = document.getElementById('pause-main');
const pauseControlsPanel = document.getElementById('pause-controls');
const startLevelSelect = document.getElementById('start-level-select');

for (let lvl = 1; lvl <= 15; lvl++) {
  const opt = document.createElement('option');
  opt.value = String(lvl);
  opt.textContent = lvl;
  startLevelSelect.appendChild(opt);
}
startLevelSelect.value = String(typeof startLevel !== 'undefined' ? startLevel : 1);

startLevelSelect.addEventListener('change', () => {
  const parsed = parseInt(startLevelSelect.value, 10);
  startLevel = parsed >= 1 && parsed <= 15 ? parsed : 1;
});

function showPauseMainPanel() {
  pauseControlsPanel.classList.add('hidden');
  pauseMainPanel.classList.remove('hidden');
}

function getPauseFocusOptions() {
  const panel = pauseControlsPanel.classList.contains('hidden') ? pauseMainPanel : pauseControlsPanel;
  return Array.from(panel.querySelectorAll('.pause-option'));
}

function movePauseFocus(step) {
  const options = getPauseFocusOptions();
  if (!options.length) return;
  const currentIndex = options.indexOf(document.activeElement);
  let nextIndex = currentIndex + step;
  if (nextIndex < 0) nextIndex = options.length - 1;
  if (nextIndex >= options.length) nextIndex = 0;
  options[nextIndex].focus();
}

pauseMenu.addEventListener('click', e => {
  const action = e.target.dataset.action;
  if (!action) return;
  switch (action) {
    case 'resume':
      togglePause();
      break;
    case 'restart':
      showPauseMainPanel();
      init();
      pauseMenu.classList.add('hidden');
      break;
    case 'controls':
      pauseMainPanel.classList.add('hidden');
      pauseControlsPanel.classList.remove('hidden');
      const firstControl = pauseControlsPanel.querySelector('.pause-option');
      if (firstControl) firstControl.focus();
      break;
    case 'back':
      showPauseMainPanel();
      const firstMain = pauseMainPanel.querySelector('.pause-option');
      if (firstMain) firstMain.focus();
      break;
  }
});

document.addEventListener('keydown', e => {
  if (pauseMenu.classList.contains('hidden')) return;

  // Prevent Space from re-triggering a focused button in the menu
  // (Space is bound to hard drop in the main game and should stay inert here).
  if (e.code === 'Space') {
    e.preventDefault();
    return;
  }

  // Let the native <select> handle its own arrow-key navigation.
  if (document.activeElement && document.activeElement.tagName === 'SELECT') return;

  if (e.code === 'ArrowDown') {
    e.preventDefault();
    movePauseFocus(1);
  } else if (e.code === 'ArrowUp') {
    e.preventDefault();
    movePauseFocus(-1);
  }
  // Enter activates the focused button natively; nothing extra needed.
});

// Reset to the main panel and focus the first option whenever the menu opens.
const pauseMenuObserver = new MutationObserver(() => {
  if (!pauseMenu.classList.contains('hidden')) {
    showPauseMainPanel();
    const first = pauseMainPanel.querySelector('.pause-option');
    if (first) first.focus();
  }
});
pauseMenuObserver.observe(pauseMenu, { attributes: true, attributeFilter: ['class'] });
