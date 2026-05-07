import { writable, derived, get } from 'svelte/store';
import type { TileMap } from './tiles';

// --- Types ---

export interface PlayerState {
  position: number;
  color: string;
  stuck: 'well' | 'prison' | 'inn' | null;
}

// --- Constants ---

const SHAKE_MS = 380;
const HOP_MS = 120;
const HAZARD_PAUSE_MS = 600;

const GOOSE_TILES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
const PLAYER_COLORS = ['#111', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f39c12'];
export const MAX_PLAYERS = 6;

// --- Stores ---

export const currentTile = writable<number>(0);
export const tokenTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);
export const rolling = writable<boolean>(false);
export const skippingTurn = writable<boolean>(false);

export const allPlayers = writable<Map<string, PlayerState>>(new Map());
export const turnPlayerId = writable<string>('p1');

export const playerCount = derived(allPlayers, ($p) => $p.size);

// --- Internal state ---

let tileData: TileMap | null = null;
let nextPlayerId = 1;

// --- Tile-source tagging (for analytics) ---

export type TileSource = 'click' | 'dice' | 'hash' | 'hazard' | 'turn' | 'init';
let _nextTileSource: TileSource = 'init';

export function setNextTileSource(s: TileSource): void {
  _nextTileSource = s;
}

export function consumeNextTileSource(): TileSource {
  const s = _nextTileSource;
  _nextTileSource = 'init';
  return s;
}

export function getTileMeta(n: number): {
  title?: string;
  status?: string;
  hazard_type?: string;
} {
  const t = tileData?.[String(n)];
  if (!t) return {};
  return {
    title: t.title,
    status: t.status,
    hazard_type: t.hazard_type,
  };
}

// --- Tile data ---

export function setTileData(tiles: TileMap): void {
  tileData = tiles;
}

// --- Init ---

export function initSinglePlayer(): void {
  nextPlayerId = 2;
  turnPlayerId.set('p1');
  allPlayers.set(
    new Map([['p1', { position: 0, color: PLAYER_COLORS[0], stuck: null }]]),
  );
}

// --- Player management ---

export function addPlayer(): void {
  const players = get(allPlayers);
  if (players.size >= MAX_PLAYERS) return;
  const id = `p${nextPlayerId++}`;
  const color = PLAYER_COLORS[(players.size) % PLAYER_COLORS.length];
  const updated = new Map(players);
  updated.set(id, { position: 0, color, stuck: null });
  allPlayers.set(updated);
}

// --- Helpers ---

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

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// --- Turn management ---

function getTurnOrder(): string[] {
  return [...get(allPlayers).keys()];
}

function updatePlayer(id: string, patch: Partial<PlayerState>): void {
  const players = get(allPlayers);
  const player = players.get(id);
  if (!player) return;
  const updated = new Map(players);
  updated.set(id, { ...player, ...patch });
  allPlayers.set(updated);
}

function advanceTurn(): void {
  const players = get(allPlayers);
  const order = getTurnOrder();
  if (order.length <= 1) return;

  const currentId = get(turnPlayerId);
  const currentIdx = order.indexOf(currentId);

  for (let i = 1; i <= order.length; i++) {
    const nextIdx = (currentIdx + i) % order.length;
    const nextId = order[nextIdx];
    const player = players.get(nextId);
    if (!player) continue;

    if (player.stuck === 'inn') {
      updatePlayer(nextId, { stuck: null });
      continue;
    }

    if (player.stuck === 'well' || player.stuck === 'prison') {
      const allStuck = order.every((pid) => {
        const p = get(allPlayers).get(pid);
        return p && (p.stuck === 'well' || p.stuck === 'prison');
      });
      if (allStuck) {
        updatePlayer(nextId, {
          stuck: null,
          position: Math.max(1, player.position - 5),
        });
        turnPlayerId.set(nextId);
        setNextTileSource('turn');
        currentTile.set(Math.max(1, player.position - 5));
        tokenTile.set(Math.max(1, player.position - 5));
        return;
      }
      continue;
    }

    turnPlayerId.set(nextId);
    setNextTileSource('turn');
    currentTile.set(player.position);
    tokenTile.set(player.position);
    return;
  }

  const nextIdx = (currentIdx + 1) % order.length;
  turnPlayerId.set(order[nextIdx]);
}

// --- Hazard helpers ---

function checkAndRescue(tile: number, hazardType: 'well' | 'prison'): boolean {
  const players = get(allPlayers);
  const currentId = get(turnPlayerId);
  let rescued = false;
  players.forEach((state, id) => {
    if (id !== currentId && state.position === tile && state.stuck === hazardType) {
      updatePlayer(id, { stuck: null });
      rescued = true;
    }
  });
  return rescued;
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
    content.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}

// --- Actions ---

export function goToTile(n: number): void {
  const clamped = Math.max(1, Math.min(63, n));
  currentTile.set(clamped);
  tokenTile.set(clamped);
  const currentId = get(turnPlayerId);
  updatePlayer(currentId, { position: clamped });
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

async function resolveHazards(
  position: number,
  _roll: number,
): Promise<number> {
  const reduced = prefersReducedMotion();
  const hazard = getHazardType(position);
  if (!hazard) return position;

  const multi = get(allPlayers).size > 1;
  const currentId = get(turnPlayerId);
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
      if (multi) {
        updatePlayer(currentId, { stuck: 'inn' });
      } else {
        skippingTurn.set(true);
      }
      break;
    case 'well':
    case 'prison': {
      if (multi) {
        const rescued = checkAndRescue(position, hazard);
        if (!rescued) {
          updatePlayer(currentId, { stuck: hazard });
        }
      } else {
        dest = Math.max(1, position - 5);
        await delay(reduced ? 0 : HAZARD_PAUSE_MS);
        if (!reduced) await animateHop(position, dest);
        else tokenTile.set(dest);
      }
      break;
    }
    case 'maze':
      dest = 39;
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

  const multi = get(allPlayers).size > 1;
  const currentId = get(turnPlayerId);

  if (!multi && get(skippingTurn)) {
    skippingTurn.set(false);
    return;
  }

  if (multi) {
    const player = get(allPlayers).get(currentId);
    if (player?.stuck === 'inn') {
      updatePlayer(currentId, { stuck: null });
      advanceTurn();
      return;
    }
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
    setNextTileSource('dice');
    currentTile.set(to);
    const final = await resolveHazards(to, roll);
    if (final !== to) {
      setNextTileSource('hazard');
      currentTile.set(final);
    }
    updatePlayer(currentId, { position: final });
    updateHashAndScroll(final);
    if (multi) advanceTurn();
    return;
  }

  await delay(SHAKE_MS);
  lastRoll.set(roll);
  rolling.set(false);

  await animateHop(from, to);

  setNextTileSource('dice');
  currentTile.set(to);
  updateHashAndScroll(to);

  const final = await resolveHazards(to, roll);
  if (final !== to) {
    setNextTileSource('hazard');
    currentTile.set(final);
    updateHashAndScroll(final);
  }

  updatePlayer(currentId, { position: final });

  if (multi) advanceTurn();
}

export function openOverlay(): void {
  overlayOpen.set(true);
}

export function closeOverlay(): void {
  overlayOpen.set(false);
}
