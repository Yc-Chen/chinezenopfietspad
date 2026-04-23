import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export interface PlayerState {
  position: number;
  color: string;
  stuck: 'well' | 'prison' | 'inn' | null;
  joinedAt: number;
}

const PLAYER_COLORS = ['#111', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f39c12'];

function getSignalingUrls(): string[] {
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.');
  if (isLocal) {
    return [`ws://${host}:4444`];
  }
  return [`wss://${host}:4444`];
}

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
  players.set(localId, {
    position: 0,
    color: PLAYER_COLORS[colorIndex],
    stuck: null,
    joinedAt: Date.now(),
  });

  provider = new WebrtcProvider(`chineseopfietspad-${roomId}`, doc, {
    signaling: getSignalingUrls(),
  });

  const awarenessHandler = ({ removed }: { added: number[]; updated: number[]; removed: number[] }) => {
    for (const clientId of removed) {
      const pid = clientId.toString();
      if (players.has(pid) && pid !== localId) {
        players.delete(pid);
      }
    }
  };
  provider.awareness.on('change', awarenessHandler);

  return { doc, provider, players, turn, localId };
}

export function leaveRoom(): void {
  if (doc && localId) {
    const players = doc.getMap<PlayerState>('players');
    players.delete(localId);
  }
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
