<script lang="ts">
  import { onMount } from 'svelte';
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import { currentTile, goToTile } from '../lib/game-state';
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

  onMount(() => {
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
