import { writable, get } from 'svelte/store';

export const currentTile = writable<number>(0);
export const tokenTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);
export const rolling = writable<boolean>(false);

const SHAKE_MS = 380;
const HOP_MS = 120;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function updateHashAndScroll(n: number): void {
  if (typeof window === 'undefined') return;
  try {
    history.replaceState(null, '', `#tile-${n}`);
  } catch {
    // history API not available
  }
  const content = document.getElementById('tile-content');
  if (content) {
    content.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
}

export function goToTile(n: number): void {
  const clamped = Math.max(1, Math.min(63, n));
  currentTile.set(clamped);
  tokenTile.set(clamped);
  updateHashAndScroll(clamped);
}

export async function rollDice(): Promise<void> {
  if (get(rolling)) return;

  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  const roll = a + b;
  const from = get(currentTile);
  const to = Math.max(1, Math.min(63, from + roll));
  const reduced = prefersReducedMotion();

  rolling.set(true);

  if (reduced) {
    lastRoll.set(roll);
    rolling.set(false);
    tokenTile.set(to);
    currentTile.set(to);
    updateHashAndScroll(to);
    return;
  }

  await delay(SHAKE_MS);
  lastRoll.set(roll);
  rolling.set(false);

  if (from === 0 || from === to) {
    tokenTile.set(to);
  } else {
    const step = from < to ? 1 : -1;
    let pos = from;
    while (pos !== to) {
      pos += step;
      tokenTile.set(pos);
      await delay(HOP_MS);
    }
  }

  currentTile.set(to);
  updateHashAndScroll(to);
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function openOverlay(): void {
  overlayOpen.set(true);
}

export function closeOverlay(): void {
  overlayOpen.set(false);
}
