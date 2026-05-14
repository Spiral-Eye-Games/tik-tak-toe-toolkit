import { t } from "../i18n";

/**
 * Convierte mensajes crudos de PeerJS / red en texto localizado para el chat.
 * Si ya parece un mensaje de aplicación (p. ej. error enviado por el host), se devuelve tal cual.
 */
export function humanizeWireErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("negotiation of connection")) {
    return t("multiplayer.system.negotiationFailed");
  }
  if (lower.includes("could not connect to peer") || lower.includes("peer-unavailable")) {
    return t("multiplayer.system.peerUnreachable");
  }
  if (lower.includes("peerjs disconnected") || lower === "peerjs disconnected.") {
    return t("multiplayer.system.signalingDisconnected");
  }
  if (lower.includes("invalid network message") || lower.includes("received an invalid")) {
    return t("multiplayer.system.invalidWireData");
  }
  if (lower.includes("network error") || lower.includes("socket closed") || lower.includes("server error")) {
    return t("multiplayer.system.networkGlitch");
  }
  const trimmed = raw.trim();
  if (trimmed.length > 0 && !looksLikeTechnicalPeerMessage(trimmed)) {
    return trimmed;
  }
  return t("multiplayer.system.genericWireError");
}

function looksLikeTechnicalPeerMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("webrtc") ||
    lower.includes("rtcpeerconnection") ||
    lower.includes("ice ") ||
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(text)
  );
}
