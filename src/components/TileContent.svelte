<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import { currentTile, prefersReducedMotion } from '../lib/game-state';
  import { formatBody } from '../lib/format';

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

</script>

<section
  id="tile-content"
  class="gb__panel gb__content"
  class:gb__content--has-image={tile?.image}
  aria-live="polite"
>
  {#key $currentTile}
    <div class="gb__content-fly" in:fly={flyConfig}>
      {#if tile?.image}
        <img class="gb__content-bg" src={tile.image} alt={tile.image_alt ?? ''} />
        <div class="gb__content-scrim" aria-hidden="true"></div>
      {/if}
      <div class="gb__content-inner">
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
        {/if}
      </div>
    </div>
  {/key}
</section>
