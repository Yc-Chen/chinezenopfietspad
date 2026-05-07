<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { allPlayers, turnPlayerId, addPlayer, MAX_PLAYERS } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();

  const playerEntries = $derived(
    [...$allPlayers.entries()],
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
  {#if $allPlayers.size < MAX_PLAYERS}
    <button type="button" class="gb__add-player" onclick={addPlayer}>
      + {t.add_player}
    </button>
  {/if}
</div>
