import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export interface PlayerState {
  position: number;
  color: string;
}

const PLAYER_COLORS = ['#111', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f39c12'];

let doc: Y.Doc | null = null;
let provider: WebrtcProvider | null = null;
let localId: string | null = null;

export function getLocalId(): string | null {
  return localId;
}

export function getPlayersMap(): Y.Map<PlayerState> | null {
  return doc?.getMap<PlayerState>('players') ?? null;
}

export function getTurnMap(): Y.Map<unknown> | null {
  return doc?.getMap('turn') ?? null;
}

export function joinRoom(roomId: string): {
  doc: Y.Doc;
  provider: WebrtcProvider;
  players: Y.Map<PlayerState>;
  turn: Y.Map<unknown>;
  localId: string;
} {
  doc = new Y.Doc();
  localId = doc.clientID.toString();

  const players = doc.getMap<PlayerState>('players');
  const turn = doc.getMap<unknown>('turn');

  const colorIndex = doc.clientID % PLAYER_COLORS.length;
  players.set(localId, { position: 0, color: PLAYER_COLORS[colorIndex] });

  provider = new WebrtcProvider(`chineseopfietspad-${roomId}`, doc, {
    signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
  });

  return { doc, provider, players, turn, localId };
}

export function leaveRoom(): void {
  if (provider) {
    provider.destroy();
    provider = null;
  }
  if (doc) {
    doc.destroy();
    doc = null;
  }
  localId = null;
}

export function isInRoom(): boolean {
  return doc !== null;
}

export function generateRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}
