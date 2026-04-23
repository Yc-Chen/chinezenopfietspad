<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import { currentTile, prefersReducedMotion } from '../lib/game-state';

  let { tiles, t }: { tiles: TileMap; t: I18nBundle } = $props();

  const tile = $derived($currentTile > 0 ? tiles[String($currentTile)] : undefined);

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  const flyConfig = $derived({
    y: 8,
    duration: mounted && !prefersReducedMotion() ? 220 : 0,
  });

  function escapeHtml(s: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return s.replace(/[&<>"']/g, (c) => map[c]);
  }

  function formatBody(s: string): string {
    return s
      .split(/\n\n+/)
      .map((p) => '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>')
      .join('');
  }
</script>

<section id="tile-content" class="gb__panel gb__content" aria-live="polite">
  {#key $currentTile}
    <div in:fly={flyConfig}>
      {#if !tile}
        <p class="gb__hint">{t.hint_start}</p>
      {:else}
        <p class="tile-pos">{t.tile_word} {$currentTile}</p>
        {#if tile.title}
          <h2>{tile.title}</h2>
        {/if}
        {#if tile.body}
          {@html formatBody(tile.body)}
        {:else if !tile.status || tile.status === 'empty'}
          <p class="gb__hint">{t.hint_empty}</p>
        {/if}
        {#if tile.did_you_know}
          <div class="dyk">
            <strong>{t.did_you_know}</strong>
            {@html formatBody(tile.did_you_know)}
          </div>
        {/if}
      {/if}
    </div>
  {/key}
</section>
