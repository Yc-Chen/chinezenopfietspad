import { writable, get } from 'svelte/store';

export const currentTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);

export function goToTile(n: number): void {
  const clamped = Math.max(1, Math.min(63, n));
  currentTile.set(clamped);

  if (typeof window === 'undefined') return;

  try {
    history.replaceState(null, '', `#tile-${clamped}`);
  } catch {
    // history API not available; silently ignore
  }

  const content = document.getElementById('tile-content');
  if (content) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    content.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
}

export function rollDice(): void {
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  lastRoll.set(a + b);
  goToTile(get(currentTile) + a + b);
}

export function openOverlay(): void {
  overlayOpen.set(true);
}

export function closeOverlay(): void {
  overlayOpen.set(false);
}
