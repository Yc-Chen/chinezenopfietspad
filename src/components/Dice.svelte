<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { lastRoll, rollDice, openOverlay, rolling, roomId } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();

  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  let shakeFace = $state('🎲');
  let copied = $state(false);

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

  function share(): void {
    const id = crypto.randomUUID().slice(0, 8);
    const url = new URL(window.location.href);
    url.searchParams.set('room', id);
    url.hash = '';
    navigator.clipboard.writeText(url.toString()).catch(() => {});
    window.location.href = url.toString();
  }
</script>

<div class="gb__panel gb__dice-panel">
  <div class="gb__panel-title">{t.dice_title}</div>
  <div class="gb__controls" role="group" aria-label={t.controls_label}>
    <button type="button" class="gb__roll" onclick={rollDice} disabled={$rolling}>
      <span class="gb__roll-icon" class:rolling={$rolling} aria-hidden="true">{shakeFace}</span>
      <span class="gb__roll-label">{t.roll_label}</span>
      <span class="gb__roll-result" aria-live="polite">{$lastRoll ?? ''}</span>
    </button>
    {#if !$roomId}
      <button type="button" class="gb__share" onclick={share}>
        {copied ? t.share_copied : t.share_label}
      </button>
    {/if}
    <button type="button" class="gb__end" onclick={openOverlay}>
      {t.end_game}
    </button>
  </div>
</div>
