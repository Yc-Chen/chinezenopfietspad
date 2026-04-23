import { writable, derived, get } from 'svelte/store';
import type * as Y from 'yjs';
import type { PlayerState } from './p2p';
import type { TileMap } from './tiles';

// --- Stores ---

export const currentTile = writable<number>(0);
export const tokenTile = writable<number>(0);
export const lastRoll = writable<number | null>(null);
export const overlayOpen = writable<boolean>(false);
export const rolling = writable<boolean>(false);
export const roomId = writable<string | null>(null);
export const skippingTurn = writable<boolean>(false);

export const allPlayers = writable<Map<string, PlayerState>>(new Map());
export const localId = writable<string>('local');
export const turnPlayerId = writable<string>('local');

export const isMyTurn = derived(
  [localId, turnPlayerId, roomId],
  ([$localId, $turnPlayerId, $roomId]) => {
    if (!$roomId) return true;
    return $localId === $turnPlayerId;
  },
);

// --- Constants ---

const SHAKE_MS = 380;
const HOP_MS = 120;
const HAZARD_PAUSE_MS = 600;

const GOOSE_TILES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];

// --- Internal state ---

let tileData: TileMap | null = null;
let yPlayers: Y.Map<PlayerState> | null = null;
let yTurn: Y.Map<unknown> | null = null;
let myId: string | null = null;

// --- Tile data ---

export function setTileData(tiles: TileMap): void {
  tileData = tiles;
}

// --- Init ---

export function initSinglePlayer(): void {
  localId.set('local');
  turnPlayerId.set('local');
  allPlayers.set(
    new Map([['local', { position: 0, color: '#111', stuck: null, joinedAt: 0 }]]),
  );
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
  if (!yPlayers) return [];
  const entries: [string, PlayerState][] = [];
  yPlayers.forEach((state, id) => {
    entries.push([id, state]);
  });
  entries.sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt || a[0].localeCompare(b[0]),
  );
  return entries.map(([id]) => id);
}

function advanceTurn(): void {
  if (!yPlayers || !yTurn) return;
  const order = getTurnOrder();
  if (order.length === 0) return;

  const currentId = get(turnPlayerId);
  const currentIdx = order.indexOf(currentId);

  for (let i = 1; i <= order.length; i++) {
    const nextIdx = (currentIdx + i) % order.length;
    const nextId = order[nextIdx];
    const player = yPlayers.get(nextId);
    if (!player) continue;

    if (player.stuck === 'inn') {
      yPlayers.set(nextId, { ...player, stuck: null });
      continue;
    }

    if (player.stuck === 'well' || player.stuck === 'prison') {
      const allStuck = order.every((id) => {
        const p = yPlayers!.get(id);
        return p && (p.stuck === 'well' || p.stuck === 'prison');
      });
      if (allStuck) {
        yPlayers.set(nextId, {
          ...player,
          stuck: null,
          position: Math.max(1, player.position - 5),
        });
        yTurn.set('currentPlayer', nextId);
        turnPlayerId.set(nextId);
        return;
      }
      continue;
    }

    yTurn.set('currentPlayer', nextId);
    turnPlayerId.set(nextId);
    return;
  }

  const nextIdx = (currentIdx + 1) % order.length;
  yTurn.set('currentPlayer', order[nextIdx]);
  turnPlayerId.set(order[nextIdx]);
}

// --- Yjs connection ---

function updateAllPlayers(): void {
  if (!yPlayers) return;
  const map = new Map<string, PlayerState>();
  yPlayers.forEach((state, id) => {
    map.set(id, { ...state });
  });
  allPlayers.set(map);
}

function checkAndRescue(tile: number, hazardType: 'well' | 'prison'): boolean {
  if (!yPlayers || !myId) return false;
  let rescued = false;
  yPlayers.forEach((state, id) => {
    if (id !== myId && state.position === tile && state.stuck === hazardType) {
      yPlayers!.set(id, { ...state, stuck: null });
      rescued = true;
    }
  });
  return rescued;
}

function setLocalStuck(stuck: 'well' | 'prison' | 'inn'): void {
  if (!yPlayers || !myId) return;
  const state = yPlayers.get(myId);
  if (state) {
    yPlayers.set(myId, { ...state, stuck });
  }
}

export function connectYjs(
  players: Y.Map<PlayerState>,
  turn: Y.Map<unknown>,
  playerId: string,
): () => void {
  yPlayers = players;
  yTurn = turn;
  myId = playerId;
  localId.set(playerId);

  updateAllPlayers();

  if (!turn.get('currentPlayer')) {
    turn.set('currentPlayer', playerId);
  }
  turnPlayerId.set(turn.get('currentPlayer') as string);

  const local = players.get(playerId);
  if (local && local.position > 0) {
    currentTile.set(local.position);
    tokenTile.set(local.position);
  }

  const lastTurnRoll = turn.get('lastRoll') as number | undefined;
  if (lastTurnRoll) lastRoll.set(lastTurnRoll);

  const observePlayers = (event: Y.YMapEvent<PlayerState>) => {
    updateAllPlayers();

    event.changes.keys.forEach((change, key) => {
      if (change.action === 'delete') {
        if (get(turnPlayerId) === key) {
          advanceTurn();
        }
      }
    });
  };

  const observeTurn = () => {
    const cp = turn.get('currentPlayer') as string | undefined;
    if (cp) turnPlayerId.set(cp);
    const r = turn.get('lastRoll') as number | undefined;
    if (r != null) lastRoll.set(r);
  };

  players.observe(observePlayers);
  turn.observe(observeTurn);

  return () => {
    players.unobserve(observePlayers);
    turn.unobserve(observeTurn);
    yPlayers = null;
    yTurn = null;
    myId = null;
  };
}

// --- Position sync ---

function syncToYjs(position: number, roll: number | null): void {
  if (yPlayers && yTurn && myId) {
    const current = yPlayers.get(myId);
    if (current) {
      yPlayers.set(myId, { ...current, position });
    }
    if (roll != null) {
      yTurn.set('lastRoll', roll);
      yTurn.set('lastRollBy', myId);
      yTurn.set('lastRollAt', Date.now());
    }
  } else {
    const lid = get(localId);
    const players = get(allPlayers);
    const player = players.get(lid);
    if (player) {
      const updated = new Map(players);
      updated.set(lid, { ...player, position });
      allPlayers.set(updated);
    }
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

async function resolveHazards(
  position: number,
  _roll: number,
): Promise<number> {
  const reduced = prefersReducedMotion();
  const hazard = getHazardType(position);
  if (!hazard) return position;

  const inRoom = get(roomId) !== null;
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
      if (inRoom) {
        setLocalStuck('inn');
      } else {
        skippingTurn.set(true);
      }
      break;
    case 'well':
    case 'prison': {
      if (inRoom) {
        const rescued = checkAndRescue(position, hazard);
        if (!rescued) {
          setLocalStuck(hazard);
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

  const inRoom = get(roomId) !== null;

  if (inRoom && !get(isMyTurn)) return;

  if (!inRoom && get(skippingTurn)) {
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
    if (inRoom) advanceTurn();
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

  if (inRoom) advanceTurn();
}

export function openOverlay(): void {
  overlayOpen.set(true);
}

export function closeOverlay(): void {
  overlayOpen.set(false);
}
