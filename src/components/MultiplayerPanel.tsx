import { useState } from "react";
import { DEFAULT_ROSTER } from "../game/defaults";
import type { PlayerId } from "../game/types";
import { t } from "../i18n";
import type { MultiplayerState } from "../multiplayer/useMultiplayer";
import { PlayerMarkGlyph } from "./PlayerMarkSpan";

interface MultiplayerPanelProps {
  multiplayer: MultiplayerState;
}

const ROSTER_BY_SYMBOL = new Map(DEFAULT_ROSTER.map((player) => [player.id, player]));

export function MultiplayerPanel({ multiplayer }: MultiplayerPanelProps) {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const canJoin = joinCode.trim().length > 0 && !multiplayer.isOnline;
  const symbolOptions = DEFAULT_ROSTER.slice(0, multiplayer.roomMaxPlayers).map((player) => player.id);

  async function copyRoomCode() {
    if (!multiplayer.roomCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(multiplayer.roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="multiplayer-panel" aria-labelledby="multiplayer-title">
      <div className="multiplayer-panel-header">
        <div>
          <h2 id="multiplayer-title">{t("multiplayer.title")}</h2>
          <p>{t("multiplayer.subtitle")}</p>
        </div>
        <span className={`multiplayer-status multiplayer-status-${multiplayer.status}`}>
          {t(`multiplayer.status.${multiplayer.status}`)}
        </span>
      </div>

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
          <button className="button secondary full multiplayer-symbol-button" type="button" onClick={() => setSymbolPickerOpen(true)}>
            <span>{t("multiplayer.chooseSymbol")}</span>
            {multiplayer.localSymbol && <MultiplayerSymbol symbol={multiplayer.localSymbol} />}
          </button>
          <label className="field">
            <span>{t("multiplayer.maxPlayers")}</span>
            <input
              type="number"
              min={multiplayer.minRoomPlayers}
              max={multiplayer.maxRoomPlayers}
              value={multiplayer.roomMaxPlayers}
              onChange={(event) => multiplayer.setRoomMaxPlayers(Number(event.target.value))}
            />
            <span className="field-help">
              {t("multiplayer.maxPlayersHint", {
                minPlayers: multiplayer.minRoomPlayers,
                maxPlayers: multiplayer.maxRoomPlayers
              })}
            </span>
          </label>
          <button className="button full" type="button" onClick={multiplayer.createRoom}>
            {t("multiplayer.createRoom")}
          </button>
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
          {multiplayer.roomCode && (
            <div className="multiplayer-room-code">
              <span>{t("multiplayer.roomCode")}</span>
              <code>{multiplayer.roomCode}</code>
              <button className="button secondary full" type="button" onClick={copyRoomCode}>
                {copied ? t("multiplayer.copied") : t("multiplayer.copyCode")}
              </button>
            </div>
          )}

          <dl className="multiplayer-meta">
            <div>
              <dt>{t("multiplayer.role")}</dt>
              <dd>{t(`multiplayer.roles.${multiplayer.role}`)}</dd>
            </div>
            <div>
              <dt>{t("multiplayer.symbol")}</dt>
              <dd>
                <button
                  className="multiplayer-symbol-inline-button"
                  type="button"
                  disabled={!multiplayer.canChangeProfile}
                  onClick={() => setSymbolPickerOpen(true)}
                >
                  {multiplayer.localSymbol ? <MultiplayerSymbol symbol={multiplayer.localSymbol} /> : t("multiplayer.notAssigned")}
                </button>
              </dd>
            </div>
          </dl>

          <div className="multiplayer-players">
            <span>{t("multiplayer.players")}</span>
            <ul>
              {multiplayer.players.map((player) => (
                <li key={player.id}>
                  <span>{player.name}</span>
                  <span>{player.symbol ? <MultiplayerSymbol symbol={player.symbol} /> : t("multiplayer.notAssigned")}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="multiplayer-panel-actions">
            <button className="button secondary full" type="button" onClick={multiplayer.sendDebugMessage}>
              {t("multiplayer.sendDebug")}
            </button>
            <button className="button secondary full" type="button" onClick={multiplayer.leaveRoom}>
              {t("multiplayer.leaveRoom")}
            </button>
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

      {symbolPickerOpen && (
        <div className="multiplayer-symbol-picker" role="dialog" aria-modal="true" aria-label={t("multiplayer.chooseSymbol")}>
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
      )}

      {multiplayer.debugMessages.length > 0 && (
        <div className="multiplayer-debug" aria-live="polite">
          <span>{t("multiplayer.debugMessages")}</span>
          <ul>
            {multiplayer.debugMessages.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
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
        aria-expanded={open}
        aria-controls="multiplayer-title"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{open ? t("multiplayer.closeMenu") : t("multiplayer.openMenu")}</span>
        <span className={`multiplayer-status multiplayer-status-${multiplayer.status}`}>
          {t(`multiplayer.status.${multiplayer.status}`)}
        </span>
      </button>
    </div>
  );
}
