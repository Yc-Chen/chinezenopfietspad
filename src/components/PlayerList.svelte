<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { allPlayers, localId, turnPlayerId } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();

  const playerEntries = $derived(
    [...$allPlayers.entries()].sort(
      (a, b) => a[1].joinedAt - b[1].joinedAt || a[0].localeCompare(b[0]),
    ),
  );
</script>

<div class="gb__panel gb__players-panel">
  <div class="gb__panel-title">{t.players_title}</div>
  {#each playerEntries as [id, player], i (id)}
    <div class="gb__player-item" class:gb__player-turn={id === $turnPlayerId}>
      <span class="gb__player-dot" style="background: {player.color}"></span>
      <span class="gb__player-name">
        {t.player_label}
        {i + 1}
        {#if id === $localId}
          <span class="gb__player-you">{t.player_you}</span>
        {/if}
      </span>
      {#if player.stuck === 'well'}
        <span class="gb__player-status">{t.player_stuck_well}</span>
      {:else if player.stuck === 'prison'}
        <span class="gb__player-status">{t.player_stuck_prison}</span>
      {:else if player.stuck === 'inn'}
        <span class="gb__player-status">{t.player_stuck_inn}</span>
      {:else if id === $turnPlayerId}
        <span class="gb__player-status">▶</span>
      {/if}
    </div>
  {/each}
</div>
