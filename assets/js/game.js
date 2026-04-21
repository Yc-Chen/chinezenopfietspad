(() => {
  const dataEl = document.getElementById('tiles-data');
  if (!dataEl) return;

  let tiles = {};
  try { tiles = JSON.parse(dataEl.textContent); } catch { tiles = {}; }

  const rollBtn = document.getElementById('gb-roll');
  const rollResult = document.getElementById('gb-roll-result');
  const endBtn = document.getElementById('gb-end');
  const endOverlay = document.getElementById('gb-end-overlay');
  const contentEl = document.getElementById('tile-content');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let currentTile = 0;

  function rollTwoDice() {
    return (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function miniMd(s) {
    return s.split(/\n\n+/).map(p =>
      '<p>' + escapeHtml(p)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>') +
      '</p>'
    ).join('');
  }

  function renderContent(n) {
    const t = tiles[String(n)] || {};
    const status = t.status || 'empty';
    let html = '<p class="tile-pos">Vakje ' + n + '</p>';
    if (t.title) html += '<h2>' + escapeHtml(t.title) + '</h2>';
    if (t.body) {
      html += '<div>' + miniMd(t.body) + '</div>';
    } else if (status === 'empty') {
      html += '<p class="gb__hint">Leeg vakje — nog geen inhoud gevuld. Open <code>data/tiles/v1.yaml</code> om er iets voor te schrijven.</p>';
    }
    if (t.did_you_know) {
      html += '<div class="dyk"><strong>Did you know:</strong> ' + miniMd(t.did_you_know) + '</div>';
    }
    contentEl.innerHTML = html;
  }

  function goToTile(n) {
    n = Math.max(1, Math.min(63, n));
    currentTile = n;

    document.querySelectorAll('.tile.is-current').forEach(el => el.classList.remove('is-current'));
    const tileEl = document.getElementById('tile-' + n);
    if (tileEl) tileEl.classList.add('is-current');

    try { history.replaceState(null, '', '#tile-' + n); } catch {}

    renderContent(n);
    contentEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  rollBtn?.addEventListener('click', () => {
    const roll = rollTwoDice();
    if (rollResult) rollResult.textContent = String(roll);
    goToTile(currentTile + roll);
  });

  document.querySelectorAll('.tile').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const n = parseInt(a.dataset.tile, 10);
      if (!Number.isNaN(n)) goToTile(n);
    });
  });

  function openOverlay() {
    if (!endOverlay) return;
    endOverlay.hidden = false;
    endOverlay.querySelector('.end-overlay__panel')?.focus();
  }

  function closeOverlay() {
    if (!endOverlay) return;
    endOverlay.hidden = true;
    endBtn?.focus();
  }

  endBtn?.addEventListener('click', openOverlay);
  endOverlay?.querySelectorAll('[data-close-overlay]').forEach(el => {
    el.addEventListener('click', closeOverlay);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && endOverlay && !endOverlay.hidden) closeOverlay();
  });

  const hashMatch = location.hash.match(/^#tile-(\d+)$/);
  if (hashMatch) {
    const n = parseInt(hashMatch[1], 10);
    if (n >= 1 && n <= 63) goToTile(n);
  }
})();
