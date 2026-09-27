'use strict';

(function () {
  const STORAGE_KEY = 'tetris.records.v1';
  const MAX_RECORDS = 5;
  const MAX_NAME_LEN = 12;

  const startScreen = document.getElementById('start-screen');
  const startTop5El = document.getElementById('start-top5');
  const startBestComboEl = document.getElementById('start-best-combo');
  const startMaxLinesEl = document.getElementById('start-max-lines');
  const playBtn = document.getElementById('play-btn');
  const resetRecordsBtn = document.getElementById('reset-records-btn');

  const recordEntryEl = document.getElementById('record-entry');
  const playerNameInput = document.getElementById('player-name');
  const saveRecordBtn = document.getElementById('save-record-btn');
  const overlayRecordsEl = document.getElementById('overlay-records');
  const overlayTop5El = document.getElementById('overlay-top5');

  function defaultData() {
    return { top: [], bestCombo: 0, maxLines: 0 };
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaultData();
      return {
        top: Array.isArray(parsed.top) ? parsed.top : [],
        bestCombo: typeof parsed.bestCombo === 'number' ? parsed.bestCombo : 0,
        maxLines: typeof parsed.maxLines === 'number' ? parsed.maxLines : 0,
      };
    } catch (e) {
      return defaultData();
    }
  }

  function saveRecords(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable (private mode, blocked cookies, quota...) — keep playing in-memory only.
    }
  }

  function clearRecords() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function qualifies(score, top) {
    if (top.length < MAX_RECORDS) return true;
    const worst = top[top.length - 1];
    return !worst || score > worst.score;
  }

  function renderList(listEl, top, highlightIndex) {
    listEl.textContent = '';
    if (top.length === 0) {
      const li = document.createElement('li');
      li.className = 'record-empty';
      li.textContent = 'Sin récords todavía';
      listEl.appendChild(li);
      return;
    }
    top.forEach((rec, i) => {
      const li = document.createElement('li');
      li.className = 'record-row';
      if (i === highlightIndex) li.classList.add('record-new');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'record-name';
      nameSpan.textContent = rec.name;

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'record-score';
      scoreSpan.textContent = rec.score.toLocaleString();

      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      listEl.appendChild(li);
    });
  }

  function renderStartScreen() {
    const data = loadRecords();
    renderList(startTop5El, data.top, -1);
    startBestComboEl.textContent = data.bestCombo;
    startMaxLinesEl.textContent = data.maxLines;
  }

  function showStartScreen() {
    renderStartScreen();
    startScreen.classList.remove('hidden');
  }

  function hideStartScreen() {
    startScreen.classList.add('hidden');
  }

  playBtn.addEventListener('click', () => {
    hideStartScreen();
    if (typeof window.init === 'function') window.init();
  });

  resetRecordsBtn.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres borrar todos los récords guardados?')) {
      clearRecords();
      renderStartScreen();
    }
  });

  function onGameOver(result) {
    const data = loadRecords();
    data.bestCombo = Math.max(data.bestCombo, result.maxCombo || 0);
    data.maxLines = Math.max(data.maxLines, result.maxLines || 0);
    saveRecords(data);

    if (qualifies(result.score, data.top)) {
      recordEntryEl.classList.remove('hidden');
      overlayRecordsEl.classList.add('hidden');
      playerNameInput.value = '';

      const commit = () => {
        let name = (playerNameInput.value || '').trim().slice(0, MAX_NAME_LEN);
        if (!name) name = 'ANON';

        const record = {
          name,
          score: result.score,
          lines: result.lines,
          level: result.level,
          maxCombo: result.maxCombo || 0,
          maxLines: result.maxLines || 0,
          date: new Date().toISOString(),
        };

        data.top.push(record);
        data.top.sort((a, b) => b.score - a.score);
        data.top = data.top.slice(0, MAX_RECORDS);
        const insertedIndex = data.top.indexOf(record);
        saveRecords(data);

        recordEntryEl.classList.add('hidden');
        overlayRecordsEl.classList.remove('hidden');
        renderList(overlayTop5El, data.top, insertedIndex);

        saveRecordBtn.onclick = null;
        playerNameInput.onkeydown = null;
      };

      saveRecordBtn.onclick = commit;
      playerNameInput.onkeydown = (e) => {
        if (e.key === 'Enter') commit();
      };
    } else {
      recordEntryEl.classList.add('hidden');
      overlayRecordsEl.classList.remove('hidden');
      renderList(overlayTop5El, data.top, -1);
    }
  }

  window.RecordsAPI = { onGameOver };

  showStartScreen();
})();
