<script lang="ts">
  import type { I18nBundle } from '../lib/i18n';
  import { overlayOpen, closeOverlay } from '../lib/game-state';

  let { t }: { t: I18nBundle } = $props();
  let panel: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!$overlayOpen) return;
    panel?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlay();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
</script>

{#if $overlayOpen}
  <div class="end-overlay" role="dialog" aria-modal="true" aria-labelledby="gb-end-title">
    <button
      type="button"
      class="end-overlay__backdrop"
      onclick={closeOverlay}
      aria-label={t.close_label}
      tabindex="-1"
    ></button>
    <div class="end-overlay__panel" tabindex="-1" bind:this={panel}>
      <button
        type="button"
        class="end-overlay__close"
        onclick={closeOverlay}
        aria-label={t.close_label}
      >×</button>

      <h2 id="gb-end-title">{t.overlay_title}</h2>

      <blockquote class="end-overlay__quote">
        <p>{@html t.overlay_quote}</p>
        <cite>— <a href="https://pavlovpubliceert.nl/voor/kinderen/amsterdam/">{t.overlay_cite}</a></cite>
      </blockquote>

      {#if t.overlay_original}
        <p><em>{t.overlay_original}:</em></p>
        <blockquote class="end-overlay__quote">
          <p>{@html t.overlay_original_quote}</p>
        </blockquote>
      {/if}

      <p>{@html t.overlay_body}</p>

      <p class="end-overlay__cta">
        <a href="https://github.com/Yc-Chen/chineseopfietspad" class="btn btn-primary">
          {t.overlay_cta}
        </a>
      </p>
    </div>
  </div>
{/if}
