<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import {
    lastRoll,
    rollDice,
    openOverlay,
    rolling,
    skippingTurn,
    allPlayers,
    turnPlayerId,
    playerCount,
  } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();

  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  let shakeFace = $state('🎲');

  $effect(() => {
    if (!$rolling) {
      shakeFace = '🎲';
      return;
    }
    const id = setInterval(() => {
      shakeFace = faces[Math.floor(Math.random() * 6)];
    }, 60);
    return () => clearInterval(id);
  });

  const turnColor = $derived($allPlayers.get($turnPlayerId)?.color ?? '#111');

  const rollLabel = $derived.by(() => {
    if ($skippingTurn) return t.skip_turn;
    return t.roll_label;
  });
</script>

<div class="gb__panel gb__dice-panel">
  <div class="gb__panel-title">{t.dice_title}</div>
  <div class="gb__controls" role="group" aria-label={t.controls_label}>
    <button
      type="button"
      class="gb__roll"
      onclick={rollDice}
      disabled={$rolling}
    >
      {#if $playerCount > 1}
        <span
          class="gb__turn-dot"
          style="background: {turnColor}"
          aria-hidden="true"></span>
      {/if}
      <span
        class="gb__roll-icon"
        class:rolling={$rolling}
        aria-hidden="true">{shakeFace}</span
      >
      <span class="gb__roll-label">{rollLabel}</span>
      <span class="gb__roll-result" aria-live="polite">{$lastRoll ?? ''}</span>
    </button>
    <button type="button" class="gb__end" onclick={openOverlay}>
      {t.end_game}
    </button>
  </div>
</div>
