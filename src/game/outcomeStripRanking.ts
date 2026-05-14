import type { GameState, PlayerId } from "./types";

export type OutcomeStripKind = "eliminated" | "round_won" | "active";

export type OutcomePlaceSlot =
  | { type: "none" }
  | { type: "final"; rank: number }
  | { type: "provisional"; value: number }
  | { type: "draw" };

export interface OutcomeStripRowModel {
  playerId: PlayerId;
  kind: OutcomeStripKind;
  place: OutcomePlaceSlot;
}

function rosterParticipantIds(state: GameState): PlayerId[] {
  return state.config.roster.slice(0, state.config.playerCount).map((player) => player.id);
}

function rowKind(state: GameState, playerId: PlayerId): OutcomeStripKind {
  if (state.eliminationOrderLose.includes(playerId)) return "eliminated";
  if (state.placementOrderWin.includes(playerId)) return "round_won";
  return "active";
}

function gameOverDisplayOrder(state: GameState, participants: PlayerId[]): PlayerId[] {
  const summary = state.gameEndSummary;
  if (!summary) return participants;

  if (summary.type === "draw") {
    return participants;
  }

  if (summary.type === "ranking") {
    const ordered: PlayerId[] = [];
    for (const id of summary.orderedIds) {
      if (participants.includes(id)) ordered.push(id);
    }
    for (const id of participants) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered;
  }

  const ordered: PlayerId[] = [];
  if (summary.winnerId && participants.includes(summary.winnerId)) {
    ordered.push(summary.winnerId);
  }
  if (summary.loserId && participants.includes(summary.loserId) && !ordered.includes(summary.loserId)) {
    ordered.push(summary.loserId);
  }
  for (const id of [...state.eliminationOrderLose].reverse()) {
    if (participants.includes(id) && !ordered.includes(id)) ordered.push(id);
  }
  for (const id of participants) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

function inProgressDisplayOrder(state: GameState, participants: PlayerId[]): PlayerId[] {
  const { config } = state;
  const order: PlayerId[] = [];

  if (config.lineRule === "win" && !config.singleWinner) {
    for (const id of state.placementOrderWin) {
      if (participants.includes(id) && !order.includes(id)) order.push(id);
    }
    for (const id of participants) {
      if (state.activePlayerIds.includes(id) && !order.includes(id)) order.push(id);
    }
    return order;
  }

  if (config.lineRule === "lose") {
    for (const id of participants) {
      if (state.activePlayerIds.includes(id)) order.push(id);
    }
    for (const id of [...state.eliminationOrderLose].reverse()) {
      if (participants.includes(id) && !order.includes(id)) order.push(id);
    }
    return order;
  }

  for (const id of participants) {
    if (state.activePlayerIds.includes(id)) order.push(id);
  }
  return order;
}

function legacyStripRows(state: GameState): OutcomeStripRowModel[] {
  const rows: OutcomeStripRowModel[] = [];
  if (state.config.lineRule === "lose") {
    for (const id of state.eliminationOrderLose) {
      rows.push({ playerId: id, kind: "eliminated", place: { type: "none" } });
    }
  } else if (state.config.lineRule === "win" && !state.config.singleWinner) {
    for (const id of state.placementOrderWin) {
      rows.push({ playerId: id, kind: "round_won", place: { type: "none" } });
    }
  }
  return rows;
}

/** Filas del ranking lateral del tablero (3+ jugadores: siempre todos; 2 jugadores: solo eliminados / rondas ganadas como antes). */
export function buildOutcomeStripRows(state: GameState): OutcomeStripRowModel[] {
  if (state.config.playerCount <= 2) {
    return legacyStripRows(state);
  }

  const participants = rosterParticipantIds(state);

  if (state.gameOver && state.gameEndSummary) {
    const order = gameOverDisplayOrder(state, participants);
    const summary = state.gameEndSummary;

    if (summary.type === "draw") {
      return order.map((playerId) => ({
        playerId,
        kind: rowKind(state, playerId),
        place: { type: "draw" }
      }));
    }

    return order.map((playerId, index) => ({
      playerId,
      kind: rowKind(state, playerId),
      place: { type: "final", rank: index + 1 }
    }));
  }

  const order = inProgressDisplayOrder(state, participants);
  const { config } = state;

  return order.map((playerId) => {
    let place: OutcomePlaceSlot = { type: "provisional", value: 0 };

    if (config.lineRule === "win" && !config.singleWinner) {
      const winIdx = state.placementOrderWin.indexOf(playerId);
      if (winIdx >= 0) {
        /** Orden de llegada al “podio” provisional: 1 = primero en completar línea, etc. */
        place = { type: "provisional", value: winIdx + 1 };
      } else if (state.eliminationOrderLose.includes(playerId)) {
        const idx = state.eliminationOrderLose.indexOf(playerId);
        const n = state.eliminationOrderLose.length;
        place = { type: "provisional", value: -(n - idx) };
      } else {
        place = { type: "provisional", value: 0 };
      }
    } else if (state.eliminationOrderLose.includes(playerId)) {
      const idx = state.eliminationOrderLose.indexOf(playerId);
      const n = state.eliminationOrderLose.length;
      place = { type: "provisional", value: -(n - idx) };
    }

    return {
      playerId,
      kind: rowKind(state, playerId),
      place
    };
  });
}
