import { Bell, ChevronDown, Copy, LogOut, Send, Wifi } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_ROSTER } from "../game/defaults";
import type { PlayerId } from "../game/types";
import { t } from "../i18n";
import { playChatPlayerTone, playChatSystemTone } from "../multiplayer/chatSounds";
import type { MultiplayerState } from "../multiplayer/useMultiplayer";
import { CustomInput } from "./CustomInput";
import { PlayerMarkGlyph } from "./PlayerMarkSpan";
import { Tooltip } from "./Tooltip";

interface MultiplayerPanelProps {
  multiplayer: MultiplayerState;
}

const ROSTER_BY_SYMBOL = new Map(DEFAULT_ROSTER.map((player) => [player.id, player]));

const CHAT_STICKY_BOTTOM_PX = 48;

function isChatScrolledToBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= CHAT_STICKY_BOTTOM_PX;
}

export function MultiplayerPanel({ multiplayer }: MultiplayerPanelProps) {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const canJoin = joinCode.trim().length > 0 && !multiplayer.isOnline;
  const symbolOptions = DEFAULT_ROSTER.map((player) => player.id);

  useEffect(() => {
    if (multiplayer.isOnline) {
      setSymbolPickerOpen(false);
    }
  }, [multiplayer.isOnline]);

  useLayoutEffect(() => {
    if (!multiplayer.isOnline) {
      didInitialChatScrollRef.current = false;
      return;
    }
    const el = chatLogRef.current;
    if (!el || multiplayer.chatMessages.length === 0) return;

    if (!didInitialChatScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      didInitialChatScrollRef.current = true;
      return;
    }

    if (isChatScrolledToBottom(el)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [multiplayer.isOnline, multiplayer.chatMessages]);

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
          <div className="field multiplayer-room-field">
            <div className="multiplayer-nickname-row">
              <button
                className="multiplayer-profile-mark"
                type="button"
                aria-label={t("multiplayer.openPreferredSymbolPicker")}
                onClick={() => setSymbolPickerOpen(true)}
              >
                {multiplayer.localSymbol ? (
                  <MultiplayerSymbol symbol={multiplayer.localSymbol} />
                ) : (
                  <span className="multiplayer-symbol-auto-dash" aria-hidden>
                    —
                  </span>
                )}
              </button>
              <CustomInput
                type="text"
                value={multiplayer.localPlayerNameInput}
                placeholder={t("multiplayer.nickname")}
                aria-label={t("multiplayer.nickname")}
                onChange={(event) => multiplayer.setLocalPlayerName(event.target.value)}
              />
            </div>
          </div>
          <div className="multiplayer-create-block">
            <div className="multiplayer-create-section-title">{t("multiplayer.createRoomSectionTitle")}</div>
            <button className="button full" type="button" onClick={() => multiplayer.createRoom()}>
              {t("multiplayer.createRoom")}
            </button>
          </div>
          <label className="field multiplayer-room-field">
            <span>{t("multiplayer.roomCode")}</span>
            <CustomInput
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
              {multiplayer.localSymbol ? (
                <MultiplayerSymbol symbol={multiplayer.localSymbol} />
              ) : (
                <span className="multiplayer-symbol-auto-dash" aria-hidden>
                  —
                </span>
              )}
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
            <ul className="multiplayer-players-strip" role="list">
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
            <div ref={chatLogRef} className="multiplayer-chat-log" aria-live="polite">
              {multiplayer.chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`multiplayer-chat-message ${message.kind}`}
                  role={message.kind === "issue" ? "status" : undefined}
                >
                  {message.kind === "player" && message.playerName && (
                    <span className="multiplayer-chat-author">{message.playerName}</span>
                  )}
                  <span>{message.text}</span>
                </div>
              ))}
            </div>
            <div className="multiplayer-chat-compose">
              <CustomInput
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

      {symbolPickerOpen && (
        <div className="multiplayer-symbol-modal-backdrop" role="presentation" onClick={() => setSymbolPickerOpen(false)}>
          <div
            className="multiplayer-symbol-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multiplayer-symbol-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="multiplayer-symbol-modal-title">
              {multiplayer.isOnline ? t("multiplayer.chooseSymbol") : t("multiplayer.choosePreferredSymbol")}
            </h3>
            <div className="multiplayer-symbol-picker-grid">
              {!multiplayer.isOnline && (
                <button
                  className={`multiplayer-symbol-picker-option multiplayer-symbol-picker-auto ${multiplayer.localSymbol === null ? "is-selected" : ""}`}
                  type="button"
                  aria-label={t("multiplayer.prefSymbolAuto")}
                  onClick={() => {
                    multiplayer.requestSymbolChange(null);
                    setSymbolPickerOpen(false);
                  }}
                >
                  <span className="multiplayer-symbol-auto-dash" aria-hidden>
                    —
                  </span>
                </button>
              )}
              {symbolOptions.map((symbol) => {
                const available =
                  !multiplayer.isOnline ||
                  multiplayer.availableSymbols.includes(symbol) ||
                  multiplayer.localSymbol === symbol;
                const selected = multiplayer.localSymbol === symbol;
                return (
                  <button
                    key={symbol}
                    className={`multiplayer-symbol-picker-option ${selected ? "is-selected" : ""}`}
                    type="button"
                    disabled={multiplayer.isOnline && (!available || !multiplayer.canChangeProfile)}
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
  const [chatUnreadFromPlayers, setChatUnreadFromPlayers] = useState(false);
  const lastChatMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setChatUnreadFromPlayers(false);
    }
  }, [open]);

  useEffect(() => {
    const messages = multiplayer.chatMessages;
    if (messages.length === 0) {
      lastChatMessageIdRef.current = null;
      return;
    }
    const last = messages[messages.length - 1];
    if (lastChatMessageIdRef.current === last.id) {
      return;
    }
    const previousId = lastChatMessageIdRef.current;
    lastChatMessageIdRef.current = last.id;
    if (previousId === null && messages.length > 1) {
      return;
    }

    if (last.kind === "player") {
      const fromSelf = last.playerId === multiplayer.localPlayerId;
      if (!fromSelf) {
        playChatPlayerTone();
      }
      const fromOthers = last.playerId !== null && last.playerId !== multiplayer.localPlayerId;
      if (!open && fromOthers) {
        setChatUnreadFromPlayers(true);
      }
    } else {
      playChatSystemTone();
    }
  }, [multiplayer.chatMessages, multiplayer.localPlayerId, open]);

  const handleToggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return (
    <div className={`multiplayer-widget ${open ? "open" : ""}`}>
      {open && (
        <div className="multiplayer-widget-popover">
          <header className="multiplayer-widget-header">
            <button
              className="button icon multiplayer-widget-collapse"
              type="button"
              aria-label={t("multiplayer.collapseWidget")}
              onClick={() => setOpen(false)}
            >
              <ChevronDown aria-hidden="true" strokeWidth={2.25} />
            </button>
          </header>
          <div className="multiplayer-widget-popover-body">
            <MultiplayerPanel multiplayer={multiplayer} />
          </div>
        </div>
      )}
      {!open && (
        <Tooltip text={chatUnreadFromPlayers ? t("multiplayer.chatUnreadHint") : t("multiplayer.expandWidget")}>
          <button
            className="multiplayer-widget-toggle"
            type="button"
            aria-label={t("multiplayer.expandWidget")}
            aria-expanded={false}
            onClick={handleToggleOpen}
          >
            {chatUnreadFromPlayers && (
              <span className="multiplayer-widget-unread-badge" aria-hidden>
                <Bell aria-hidden="true" strokeWidth={2.5} />
              </span>
            )}
            <Wifi aria-hidden="true" />
            <span className={`multiplayer-state-dot multiplayer-state-dot-${multiplayer.status}`} aria-hidden />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
