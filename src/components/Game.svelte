<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import {
    currentTile,
    tokenTile,
    goToTile,
    setTileData,
    initSinglePlayer,
    allPlayers,
    turnPlayerId,
    setNextTileSource,
    consumeNextTileSource,
    getTileMeta,
  } from '../lib/game-state';
  import Dice from './Dice.svelte';
  import TileContent from './TileContent.svelte';
  import EndOverlay from './EndOverlay.svelte';
  import PlayerList from './PlayerList.svelte';
  import BoardPath from './BoardPath.svelte';

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

  interface TokenData {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    visible: boolean;
    tile: number;
  }

  let tokensContainer: HTMLDivElement | undefined = $state();
  let tokenData = $state<TokenData[]>([]);

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

  const STACK_OFFSET = 8;

  function updateTokenPositions(): void {
    const players = get(allPlayers);
    const currentId = get(turnPlayerId);
    const localTile = get(tokenTile);

    const entries: TokenData[] = [];

    players.forEach((player, id) => {
      const tileNum = id === currentId ? localTile : player.position;
      const pos = tilePositions.get(tileNum);
      entries.push({
        id,
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
        size: pos ? Math.max(12, Math.round(pos.w * 0.35)) : 0,
        color: player.color,
        visible: !!pos && tileNum > 0,
        tile: tileNum,
      });
    });

    const tileGroups = new Map<number, string[]>();
    for (const e of entries) {
      if (!e.visible) continue;
      const group = tileGroups.get(e.tile) ?? [];
      group.push(e.id);
      tileGroups.set(e.tile, group);
    }
    for (const e of entries) {
      if (!e.visible) continue;
      const group = tileGroups.get(e.tile);
      if (!group || group.length <= 1) continue;
      const idx = group.indexOf(e.id);
      const offset = (idx - (group.length - 1) / 2) * STACK_OFFSET;
      e.x += offset;
    }

    tokenData = entries;
  }

  onMount(() => {
    setTileData(tiles);
    initSinglePlayer();

    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (wrap && tokensContainer) {
      wrap.appendChild(tokensContainer);
    }

    measureTiles();

    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a.tile'),
    );
    const cleanup: Array<() => void> = [];

    for (const a of anchors) {
      const handler = (e: Event) => {
        e.preventDefault();
        const n = parseInt(a.dataset.tile ?? '', 10);
        if (!Number.isNaN(n)) {
          setNextTileSource('click');
          goToTile(n);
        }
      };
      a.addEventListener('click', handler);
      cleanup.push(() => a.removeEventListener('click', handler));
    }

    const unsubToken = tokenTile.subscribe(() => updateTokenPositions());
    cleanup.push(unsubToken);

    const unsubPlayers = allPlayers.subscribe(() => updateTokenPositions());
    cleanup.push(unsubPlayers);

    const onResize = () => {
      measureTiles();
      updateTokenPositions();
    };
    window.addEventListener('resize', onResize);
    cleanup.push(() => window.removeEventListener('resize', onResize));

    let lastTile = 0;
    let lastTileTime = Date.now();

    const ph = (): typeof import('posthog-js').default | undefined =>
      (window as unknown as { posthog?: typeof import('posthog-js').default })
        .posthog;

    const flushDwell = (transport?: 'sendBeacon' | 'XHR') => {
      if (lastTile <= 0) return;
      const duration_ms = Date.now() - lastTileTime;
      ph()?.capture(
        'tile_dwell',
        { tile_number: lastTile, duration_ms, ...getTileMeta(lastTile) },
        transport ? { transport } : undefined,
      );
    };

    const unsubTrack = currentTile.subscribe((n) => {
      flushDwell();
      if (n > 0) {
        const source = consumeNextTileSource();
        ph()?.capture('tile_viewed', {
          tile_number: n,
          source,
          ...getTileMeta(n),
        });
      }
      lastTile = n;
      lastTileTime = Date.now();
    });
    cleanup.push(unsubTrack);

    const onPageHide = () => flushDwell('sendBeacon');
    window.addEventListener('pagehide', onPageHide);
    cleanup.push(() => window.removeEventListener('pagehide', onPageHide));

    const match = location.hash.match(/^#tile-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= 63) {
        setNextTileSource('hash');
        goToTile(n);
      }
    }

    return () => cleanup.forEach((fn) => fn());
  });

  $effect(() => {
    const n = $currentTile;
    if (typeof document === 'undefined') return;
    document
      .querySelectorAll('a.tile.is-current')
      .forEach((el) => el.classList.remove('is-current'));
    if (n > 0) {
      const el = document.getElementById(`tile-${n}`);
      if (el) el.classList.add('is-current');
    }
  });
</script>

<BoardPath />
<Dice {t} />

<PlayerList {t} />

<TileContent {tiles} {t} />

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

<EndOverlay {t} />

<div bind:this={tokensContainer} aria-hidden="true">
  {#each tokenData as tok (tok.id)}
    <div
      class="gb__token"
      class:visible={tok.visible}
      style="--token-color: {tok.color}; --token-size: {tok.size}px; transform: translate(calc({tok.x}px - 50%), calc({tok.y}px - 50%));"
    ></div>
  {/each}
</div>
