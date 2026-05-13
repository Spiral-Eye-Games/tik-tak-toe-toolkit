import Peer, { type DataConnection } from "peerjs";
import { isNetworkMessage, type NetworkMessage } from "./networkTypes";

export interface PeerServiceEvents {
  onOpen?: (peerId: string) => void;
  onConnection?: (connectionId: string) => void;
  onMessage?: (message: NetworkMessage, connectionId: string) => void;
  onClose?: (connectionId: string) => void;
  onError?: (error: Error) => void;
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
      this.events.onError?.(toError(error));
    });

    peer.on("disconnected", () => {
      this.events.onError?.(new Error("PeerJS disconnected."));
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
        this.events.onError?.(new Error("Received an invalid network message."));
      }
    });

    connection.on("close", () => {
      this.connections.delete(connectionId);
      this.events.onClose?.(connectionId);
    });

    connection.on("error", (error) => {
      this.events.onError?.(toError(error));
    });
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
