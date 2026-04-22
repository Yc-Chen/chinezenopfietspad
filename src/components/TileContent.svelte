<script lang="ts">
  import type { TileMap } from '../lib/tiles';
  import type { I18nBundle } from '../lib/i18n';
  import { currentTile } from '../lib/game-state';

  let { tiles, t }: { tiles: TileMap; t: I18nBundle } = $props();

  const tile = $derived($currentTile > 0 ? tiles[String($currentTile)] : undefined);

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
</section>
