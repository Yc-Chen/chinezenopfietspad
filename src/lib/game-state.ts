import { writable, get } from 'svelte/store';
import type * as Y from 'yjs';
import type { PlayerState } from './p2p';
import type { TileMap } from './tiles';

export const currentTile = writable<number>(0);
export const tokenTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);
export const rolling = writable<boolean>(false);
export const roomId = writable<string | null>(null);
export const skippingTurn = writable<boolean>(false);

const SHAKE_MS = 380;
const HOP_MS = 120;
const HAZARD_PAUSE_MS = 600;

let tileData: TileMap | null = null;

export function setTileData(tiles: TileMap): void {
  tileData = tiles;
}

const GOOSE_TILES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];

function nextGoose(from: number): number {
  for (const g of GOOSE_TILES) {
    if (g > from) return g;
  }
  return from;
}

function resolveOvershoot(from: number, roll: number): number {
  const raw = from + roll;
  if (raw <= 63) return raw;
  return 63 - (raw - 63);
}

function getHazardType(n: number): string | undefined {
  return tileData?.[String(n)]?.hazard_type;
}

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

async function animateHop(from: number, to: number): Promise<void> {
  if (from === 0 || from === to) {
    tokenTile.set(to);
    return;
  }
  const step = from < to ? 1 : -1;
  let pos = from;
  while (pos !== to) {
    pos += step;
    tokenTile.set(pos);
    await delay(HOP_MS);
  }
}

async function resolveHazards(position: number, roll: number): Promise<number> {
  const reduced = prefersReducedMotion();
  const hazard = getHazardType(position);
  if (!hazard) return position;

  let dest = position;

  switch (hazard) {
    case 'goose': {
      dest = nextGoose(position);
      if (dest !== position) {
        await delay(reduced ? 0 : HAZARD_PAUSE_MS);
        if (!reduced) await animateHop(position, dest);
        else tokenTile.set(dest);
      }
      break;
    }
    case 'bridge':
      dest = 12;
      await delay(reduced ? 0 : HAZARD_PAUSE_MS);
      if (!reduced) await animateHop(position, dest);
      else tokenTile.set(dest);
      break;
    case 'inn':
      skippingTurn.set(true);
      break;
    case 'well':
      dest = Math.max(1, position - 5);
      await delay(reduced ? 0 : HAZARD_PAUSE_MS);
      if (!reduced) await animateHop(position, dest);
      else tokenTile.set(dest);
      break;
    case 'maze':
      dest = 39;
      await delay(reduced ? 0 : HAZARD_PAUSE_MS);
      if (!reduced) await animateHop(position, dest);
      else tokenTile.set(dest);
      break;
    case 'prison':
      dest = Math.max(1, position - 5);
      await delay(reduced ? 0 : HAZARD_PAUSE_MS);
      if (!reduced) await animateHop(position, dest);
      else tokenTile.set(dest);
      break;
    case 'death':
      dest = 1;
      await delay(reduced ? 0 : HAZARD_PAUSE_MS);
      if (!reduced) await animateHop(position, dest);
      else tokenTile.set(dest);
      break;
    case 'goal':
      break;
  }

  return dest;
}

export async function rollDice(): Promise<void> {
  if (get(rolling)) return;

  if (get(skippingTurn)) {
    skippingTurn.set(false);
    return;
  }

  const roll = 1 + Math.floor(Math.random() * 6);
  const from = get(currentTile);
  const to = resolveOvershoot(from, roll);
  const reduced = prefersReducedMotion();

  rolling.set(true);

  if (reduced) {
    lastRoll.set(roll);
    rolling.set(false);
    tokenTile.set(to);
    currentTile.set(to);
    const final = await resolveHazards(to, roll);
    if (final !== to) {
      currentTile.set(final);
    }
    syncToYjs(final, roll);
    updateHashAndScroll(final);
    return;
  }

  await delay(SHAKE_MS);
  lastRoll.set(roll);
  rolling.set(false);

  await animateHop(from, to);

  currentTile.set(to);
  updateHashAndScroll(to);

  const final = await resolveHazards(to, roll);
  if (final !== to) {
    currentTile.set(final);
    updateHashAndScroll(final);
  }

  syncToYjs(final, roll);
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
