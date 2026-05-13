import { Copy, LogOut, Send, Wifi } from "lucide-react";
import { useState } from "react";
import { DEFAULT_ROSTER } from "../game/defaults";
import type { PlayerId } from "../game/types";
import { t } from "../i18n";
import type { MultiplayerState } from "../multiplayer/useMultiplayer";
import { PlayerMarkGlyph } from "./PlayerMarkSpan";
import { Tooltip } from "./Tooltip";

interface MultiplayerPanelProps {
  multiplayer: MultiplayerState;
}

const ROSTER_BY_SYMBOL = new Map(DEFAULT_ROSTER.map((player) => [player.id, player]));

export function MultiplayerPanel({ multiplayer }: MultiplayerPanelProps) {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const canJoin = joinCode.trim().length > 0 && !multiplayer.isOnline;
  const symbolOptions = DEFAULT_ROSTER.map((player) => player.id);

  async function copyRoomCode() {
    if (!multiplayer.roomCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(multiplayer.roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function sendChat() {
    multiplayer.sendChatMessage(chatDraft);
    setChatDraft("");
  }

  return (
    <section className="multiplayer-panel" aria-label={t("multiplayer.panelLabel")}>
      {!multiplayer.isOnline ? (
        <div className="multiplayer-panel-actions">
          <label className="field multiplayer-room-field">
            <span>{t("multiplayer.nickname")}</span>
            <input
              type="text"
              value={multiplayer.localPlayerName}
              placeholder={t("multiplayer.nicknamePlaceholder")}
              onChange={(event) => multiplayer.setLocalPlayerName(event.target.value)}
            />
          </label>
          <div className="multiplayer-create-row">
            <label className="field multiplayer-max-players-field">
              <span>{t("multiplayer.maxPlayers")}</span>
              <input
                type="number"
                min={multiplayer.minRoomPlayers}
                max={multiplayer.maxRoomPlayers}
                value={multiplayer.roomMaxPlayers}
                onChange={(event) => multiplayer.setRoomMaxPlayers(Number(event.target.value))}
              />
            </label>
            <button className="button full" type="button" onClick={multiplayer.createRoom}>
              {t("multiplayer.createRoom")}
            </button>
          </div>
          <label className="field multiplayer-room-field">
            <span>{t("multiplayer.roomCode")}</span>
            <input
              type="text"
              value={joinCode}
              placeholder={t("multiplayer.roomCodePlaceholder")}
              onChange={(event) => setJoinCode(event.target.value)}
            />
          </label>
          <button className="button secondary full" type="button" disabled={!canJoin} onClick={() => multiplayer.joinRoom(joinCode)}>
            {t("multiplayer.joinRoom")}
          </button>
        </div>
      ) : (
        <div className="multiplayer-panel-body">
          <div className="multiplayer-profile-row">
            <button
              className="multiplayer-profile-mark"
              type="button"
              disabled={!multiplayer.canChangeProfile}
              onClick={() => setSymbolPickerOpen(true)}
            >
              {multiplayer.localSymbol ? <MultiplayerSymbol symbol={multiplayer.localSymbol} /> : null}
            </button>
            <div className="multiplayer-profile-copy">
              <div className="multiplayer-profile-name">{multiplayer.localPlayerName}</div>
              <div className="multiplayer-profile-subtitle">
                {t(`multiplayer.roles.${multiplayer.role}`)}
                <Tooltip text={t(`multiplayer.status.${multiplayer.status}`)} passAriaLabel={false}>
                  <span className={`multiplayer-state-dot multiplayer-state-dot-${multiplayer.status}`} aria-hidden />
                </Tooltip>
              </div>
            </div>
            <div className="multiplayer-profile-actions">
              {copied && <span className="multiplayer-copy-toast" role="status">{t("multiplayer.copied")}</span>}
              <Tooltip text={copied ? t("multiplayer.copied") : t("multiplayer.copyCode")}>
                <button className="button icon multiplayer-icon-action" type="button" disabled={!multiplayer.roomCode} onClick={copyRoomCode}>
                  <Copy aria-hidden="true" />
                </button>
              </Tooltip>
              <Tooltip text={t("multiplayer.leaveRoom")}>
                <button className="button icon multiplayer-icon-action" type="button" onClick={multiplayer.leaveRoom}>
                  <LogOut aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="multiplayer-players">
            <span>{t("multiplayer.players")}</span>
            <ul className="multiplayer-players-grid">
              {multiplayer.players.map((player) => (
                <li key={player.id} className={player.connected ? "" : "disconnected"}>
                  <span className="multiplayer-player-mark">
                    {player.symbol ? <MultiplayerSymbol symbol={player.symbol} /> : t("multiplayer.notAssigned")}
                  </span>
                  <span className="multiplayer-player-name">{player.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="multiplayer-chat">
            <div className="multiplayer-chat-log" aria-live="polite">
              {multiplayer.chatMessages.map((message) => (
                <div key={message.id} className={`multiplayer-chat-message ${message.kind}`}>
                  {message.kind === "player" && message.playerName && (
                    <span className="multiplayer-chat-author">{message.playerName}</span>
                  )}
                  <span>{message.text}</span>
                </div>
              ))}
            </div>
            <div className="multiplayer-chat-compose">
              <input
                type="text"
                value={chatDraft}
                placeholder={t("multiplayer.chatPlaceholder")}
                onChange={(event) => setChatDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendChat();
                  }
                }}
              />
              <Tooltip text={t("multiplayer.sendChat")}>
                <button className="button icon multiplayer-icon-action" type="button" disabled={chatDraft.trim().length === 0} onClick={sendChat}>
                  <Send aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {multiplayer.status === "waiting" && (
        <p className="multiplayer-note" role="status">{t("multiplayer.waitingHint")}</p>
      )}

      {multiplayer.error && (
        <p className="multiplayer-error" role="alert">
          {t("multiplayer.errorDetail", { message: multiplayer.error })}
        </p>
      )}

      {symbolPickerOpen && multiplayer.isOnline && (
        <div className="multiplayer-symbol-modal-backdrop" role="presentation" onClick={() => setSymbolPickerOpen(false)}>
          <div
            className="multiplayer-symbol-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multiplayer-symbol-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="multiplayer-symbol-modal-title">{t("multiplayer.chooseSymbol")}</h3>
            <div className="multiplayer-symbol-picker-grid">
              {symbolOptions.map((symbol) => {
                const available = multiplayer.availableSymbols.includes(symbol) || multiplayer.localSymbol === symbol;
                return (
                  <button
                    key={symbol}
                    className="multiplayer-symbol-picker-option"
                    type="button"
                    disabled={!available || !multiplayer.canChangeProfile}
                    aria-label={t(`multiplayer.symbols.${symbol}`)}
                    onClick={() => {
                      multiplayer.requestSymbolChange(symbol);
                      setSymbolPickerOpen(false);
                    }}
                  >
                    <MultiplayerSymbol symbol={symbol} />
                  </button>
                );
              })}
            </div>
            <button className="button secondary full" type="button" onClick={() => setSymbolPickerOpen(false)}>
              {t("actions.close")}
            </button>
          </div>
        </div>
      )}

    </section>
  );
}

function MultiplayerSymbol({ symbol }: { symbol: PlayerId }) {
  const rosterPlayer = ROSTER_BY_SYMBOL.get(symbol);
  return (
    <PlayerMarkGlyph
      icon={symbol}
      className="multiplayer-symbol-glyph"
      label={t(`multiplayer.symbols.${symbol}`)}
      style={{ color: rosterPlayer?.color }}
    />
  );
}

export function FloatingMultiplayerPanel({ multiplayer }: MultiplayerPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`multiplayer-widget ${open ? "open" : ""}`}>
      {open && (
        <div className="multiplayer-widget-popover">
          <MultiplayerPanel multiplayer={multiplayer} />
        </div>
      )}
      <button
        className="multiplayer-widget-toggle"
        type="button"
        aria-label={open ? t("multiplayer.closeMenu") : t("multiplayer.openMenu")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Wifi aria-hidden="true" />
        <span className={`multiplayer-state-dot multiplayer-state-dot-${multiplayer.status}`} aria-hidden />
      </button>
    </div>
  );
}
