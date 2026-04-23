import { writable, get } from 'svelte/store';
import type * as Y from 'yjs';
import type { PlayerState } from './p2p';

export const currentTile = writable<number>(0);
export const tokenTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);
export const rolling = writable<boolean>(false);
export const roomId = writable<string | null>(null);

const SHAKE_MS = 380;
const HOP_MS = 120;

let yPlayers: Y.Map<PlayerState> | null = null;
let yTurn: Y.Map<unknown> | null = null;
let localPlayerId: string | null = null;
let yCleanup: (() => void) | null = null;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function connectYjs(
  players: Y.Map<PlayerState>,
  turn: Y.Map<unknown>,
  playerId: string,
): () => void {
  yPlayers = players;
  yTurn = turn;
  localPlayerId = playerId;

  const local = players.get(playerId);
  if (local && local.position > 0) {
    currentTile.set(local.position);
    tokenTile.set(local.position);
  }

  const lastTurnRoll = turn.get('lastRoll') as number | undefined;
  if (lastTurnRoll) lastRoll.set(lastTurnRoll);

  const observePlayers = () => {
    if (!localPlayerId) return;
    const state = players.get(localPlayerId);
    if (state) {
      const pos = state.position;
      const cur = get(currentTile);
      if (pos !== cur && pos > 0) {
        currentTile.set(pos);
        tokenTile.set(pos);
        updateHashAndScroll(pos);
      }
    }
  };

  const observeTurn = () => {
    const r = turn.get('lastRoll') as number | undefined;
    if (r != null) lastRoll.set(r);
  };

  players.observe(observePlayers);
  turn.observe(observeTurn);

  yCleanup = () => {
    players.unobserve(observePlayers);
    turn.unobserve(observeTurn);
    yPlayers = null;
    yTurn = null;
    localPlayerId = null;
  };

  return yCleanup;
}

function syncToYjs(position: number, roll: number | null): void {
  if (!yPlayers || !yTurn || !localPlayerId) return;
  const current = yPlayers.get(localPlayerId);
  if (current) {
    yPlayers.set(localPlayerId, { ...current, position });
  }
  if (roll != null) {
    yTurn.set('lastRoll', roll);
    yTurn.set('lastRollBy', localPlayerId);
    yTurn.set('lastRollAt', Date.now());
  }
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
  syncToYjs(clamped, null);
  updateHashAndScroll(clamped);
}

export async function rollDice(): Promise<void> {
  if (get(rolling)) return;

  const roll = 1 + Math.floor(Math.random() * 6);
  const from = get(currentTile);
  const to = Math.max(1, Math.min(63, from + roll));
  const reduced = prefersReducedMotion();

  rolling.set(true);

  if (reduced) {
    lastRoll.set(roll);
    rolling.set(false);
    tokenTile.set(to);
    currentTile.set(to);
    syncToYjs(to, roll);
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
  syncToYjs(to, roll);
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
