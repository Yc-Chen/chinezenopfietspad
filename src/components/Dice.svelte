<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { lastRoll, rollDice, openOverlay, rolling } from '../lib/game-state';

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
</script>

<div class="gb__panel gb__dice-panel">
  <div class="gb__panel-title">{t.dice_title}</div>
  <div class="gb__controls" role="group" aria-label={t.controls_label}>
    <button type="button" class="gb__roll" onclick={rollDice} disabled={$rolling}>
      <span class="gb__roll-icon" class:rolling={$rolling} aria-hidden="true">{shakeFace}</span>
      <span class="gb__roll-label">{t.roll_label}</span>
      <span class="gb__roll-result" aria-live="polite">{$lastRoll ?? ''}</span>
    </button>
    <button type="button" class="gb__end" onclick={openOverlay}>
      {t.end_game}
    </button>
  </div>
</div>
