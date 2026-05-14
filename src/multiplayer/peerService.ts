import Peer, { type DataConnection } from "peerjs";
import { isNetworkMessage, type NetworkMessage } from "./networkTypes";

export interface PeerServiceEvents {
  onOpen?: (peerId: string) => void;
  onConnection?: (connectionId: string) => void;
  onMessage?: (message: NetworkMessage, connectionId: string) => void;
  onClose?: (connectionId: string) => void;
  /** Fallo al abrir el canal de datos con un peer (p. ej. negociación WebRTC); no implica caída de toda la sala. */
  onConnectionSetupFailed?: (remotePeerId: string, error: Error) => void;
  /** Error del peer de señalización u otro fallo no asociado a un único intento de conexión. */
  onFatalError?: (error: Error) => void;
}

export class PeerService {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private events: PeerServiceEvents = {};

  createHost(events: PeerServiceEvents) {
    this.close();
    this.events = events;
    this.peer = new Peer();
    this.bindPeerEvents();
  }

  connectToHost(hostPeerId: string, events: PeerServiceEvents) {
    this.close();
    this.events = events;
    this.peer = new Peer();
    this.bindPeerEvents((peer) => {
      const connection = peer.connect(hostPeerId, { reliable: true });
      this.registerConnection(connection);
    });
  }

  sendTo(connectionId: string, message: NetworkMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.open) return false;
    connection.send(message);
    return true;
  }

  broadcast(message: NetworkMessage): void {
    for (const connectionId of this.connections.keys()) {
      this.sendTo(connectionId, message);
    }
  }

  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    connection.close();
    this.connections.delete(connectionId);
  }

  close() {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.events = {};
  }

  private bindPeerEvents(afterOpen?: (peer: Peer) => void) {
    const peer = this.peer;
    if (!peer) return;

    peer.on("open", (peerId) => {
      this.events.onOpen?.(peerId);
      afterOpen?.(peer);
    });

    peer.on("connection", (connection) => {
      this.registerConnection(connection);
    });

    peer.on("error", (error) => {
      const err = toError(error);
      if (isRecoverablePeerLevelError(err)) {
        const remoteId = extractNegotiationPeerId(err.message) ?? "";
        this.events.onConnectionSetupFailed?.(remoteId, err);
        return;
      }
      this.events.onFatalError?.(err);
    });

    peer.on("disconnected", () => {
      this.events.onFatalError?.(new Error("PeerJS disconnected."));
    });
  }

  private registerConnection(connection: DataConnection) {
    const connectionId = connection.peer;
    this.connections.set(connectionId, connection);

    connection.on("open", () => {
      this.events.onConnection?.(connectionId);
    });

    connection.on("data", (data) => {
      if (isNetworkMessage(data)) {
        this.events.onMessage?.(data, connectionId);
      } else {
        this.events.onConnectionSetupFailed?.(connection.peer, new Error("Received an invalid network message."));
      }
    });

    connection.on("close", () => {
      this.connections.delete(connectionId);
      this.events.onClose?.(connectionId);
    });

    connection.on("error", (error) => {
      this.events.onConnectionSetupFailed?.(connection.peer, toError(error));
    });
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/** Errores habituales de PeerJS al fallar un intento puntual de enlace (no se corta toda la sala). */
function isRecoverablePeerLevelError(error: Error): boolean {
  const m = error.message.toLowerCase();
  if (m.includes("negotiation of connection")) return true;
  if (m.includes("could not connect to peer")) return true;
  if (m.includes("peer-unavailable")) return true;
  if (m.includes("network")) return true;
  if (m.includes("server error")) return true;
  if (m.includes("socket error")) return true;
  if (m.includes("connection to") && m.includes("failed")) return true;
  return false;
}

function extractNegotiationPeerId(message: string): string | null {
  const match = /Negotiation of connection to\s+(\S+)/i.exec(message);
  return match?.[1] ?? null;
}
