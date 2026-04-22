<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { lastRoll, rollDice, openOverlay } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();
</script>

<div class="gb__panel gb__dice-panel">
  <div class="gb__panel-title">{t.dice_title}</div>
  <div class="gb__controls" role="group" aria-label={t.controls_label}>
    <button type="button" class="gb__roll" onclick={rollDice}>
      <span class="gb__roll-icon" aria-hidden="true">🎲</span>
      <span class="gb__roll-label">{t.roll_label}</span>
      <span class="gb__roll-result" aria-live="polite">{$lastRoll ?? ''}</span>
    </button>
    <button type="button" class="gb__end" onclick={openOverlay}>
      {t.end_game}
    </button>
  </div>
</div>
