<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import { currentTile, tokenTile, goToTile, roomId, connectYjs, setTileData } from '../lib/game-state';
  import Dice from './Dice.svelte';
  import TileContent from './TileContent.svelte';
  import EndOverlay from './EndOverlay.svelte';

  let { tiles, t }: { tiles: TileMap; t: I18nBundle } = $props();

  const legendItems = $derived([
    { key: 'goose', label: t.legend_goose },
    { key: 'bridge', label: t.legend_bridge },
    { key: 'inn', label: t.legend_inn },
    { key: 'well', label: t.legend_well },
    { key: 'maze', label: t.legend_maze },
    { key: 'prison', label: t.legend_prison },
    { key: 'death', label: t.legend_death },
    { key: 'goal', label: t.legend_goal },
  ]);

  let tokenEl: HTMLDivElement | undefined = $state();
  let tokenX = $state(0);
  let tokenY = $state(0);
  let tokenSize = $state(0);
  let tokenVisible = $state(false);

  const tilePositions = new Map<number, { x: number; y: number; w: number }>();

  function measureTiles(): void {
    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const anchors = wrap.querySelectorAll<HTMLAnchorElement>('a.tile');
    tilePositions.clear();
    anchors.forEach((a) => {
      const n = parseInt(a.dataset.tile ?? '', 10);
      if (Number.isNaN(n)) return;
      const r = a.getBoundingClientRect();
      tilePositions.set(n, {
        x: r.left - wrapRect.left + wrap.scrollLeft + r.width / 2,
        y: r.top - wrapRect.top + wrap.scrollTop + r.height / 2,
        w: r.width,
      });
    });
  }

  function applyTokenPos(n: number): void {
    const pos = tilePositions.get(n);
    if (!pos) return;
    tokenX = pos.x;
    tokenY = pos.y;
    tokenSize = Math.max(12, Math.round(pos.w * 0.35));
    tokenVisible = true;
  }

  onMount(() => {
    setTileData(tiles);

    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (wrap && tokenEl) {
      wrap.appendChild(tokenEl);
    }

    measureTiles();

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.tile'));
    const cleanup: Array<() => void> = [];

    for (const a of anchors) {
      const handler = (e: Event) => {
        e.preventDefault();
        const n = parseInt(a.dataset.tile ?? '', 10);
        if (!Number.isNaN(n)) goToTile(n);
      };
      a.addEventListener('click', handler);
      cleanup.push(() => a.removeEventListener('click', handler));
    }

    const unsubToken = tokenTile.subscribe((n) => {
      if (n > 0) applyTokenPos(n);
      else tokenVisible = false;
    });
    cleanup.push(unsubToken);

    const onResize = () => {
      measureTiles();
      const n = get(tokenTile);
      if (n > 0) applyTokenPos(n);
    };
    window.addEventListener('resize', onResize);
    cleanup.push(() => window.removeEventListener('resize', onResize));

    // Check for room param → lazy-load P2P and join room
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      roomId.set(room);
      import('../lib/p2p').then(({ joinRoom, leaveRoom }) => {
        const { players, turn, localId } = joinRoom(room);
        const yjsCleanup = connectYjs(players, turn, localId);
        cleanup.push(() => {
          yjsCleanup();
          leaveRoom();
        });
      });
    }

    // Check for hash → go to tile
    const match = location.hash.match(/^#tile-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= 63) goToTile(n);
    }

    return () => cleanup.forEach((fn) => fn());
  });

  $effect(() => {
    const n = $currentTile;
    if (typeof document === 'undefined') return;
    document.querySelectorAll('a.tile.is-current').forEach((el) => el.classList.remove('is-current'));
    if (n > 0) {
      const el = document.getElementById(`tile-${n}`);
      if (el) el.classList.add('is-current');
    }
  });
</script>

<Dice {t} />

<div class="gb__panel gb__legend-panel">
  <div class="gb__panel-title">{t.legend_title}</div>
  <div class="gb__legend">
    {#each legendItems as item (item.key)}
      <div class="gb__legend-item">
        <span class="gb__legend-dot gb__legend-dot--{item.key}"></span>
        {item.label}
      </div>
    {/each}
  </div>
</div>

<TileContent {tiles} {t} />
<EndOverlay {t} />

<div
  bind:this={tokenEl}
  class="gb__token"
  class:visible={tokenVisible}
  style="--token-size: {tokenSize}px; transform: translate(calc({tokenX}px - 50%), calc({tokenY}px - 50%));"
  aria-hidden="true"
></div>
