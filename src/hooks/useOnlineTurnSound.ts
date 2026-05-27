import { useEffect, useRef } from "react";
import type { ConnectionStatus } from "../multiplayer/networkTypes";
import { playOnlineTurnTone } from "../multiplayer/chatSounds";
import type { PlayerId as GamePlayerId } from "../game/types";

interface UseOnlineTurnSoundOptions {
  isOnline: boolean;
  localSymbol: GamePlayerId | null;
  currentPlayer: GamePlayerId;
  gameOver: boolean;
  status: ConnectionStatus;
}

export function useOnlineTurnSound({
  isOnline,
  localSymbol,
  currentPlayer,
  gameOver,
  status
}: UseOnlineTurnSoundOptions): void {
  const prevCurrentPlayerRef = useRef<GamePlayerId | null>(null);
  const skipNextRef = useRef(true);

  useEffect(() => {
    if (!isOnline) {
      prevCurrentPlayerRef.current = null;
      skipNextRef.current = true;
      return;
    }

    const sessionReady =
      status !== "connecting" &&
      status !== "creating-room" &&
      localSymbol !== null;

    if (!sessionReady) {
      return;
    }

    const previousPlayer = prevCurrentPlayerRef.current;
    prevCurrentPlayerRef.current = currentPlayer;

    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (
      gameOver ||
      currentPlayer !== localSymbol ||
      previousPlayer === localSymbol
    ) {
      return;
    }

    playOnlineTurnTone();
  }, [isOnline, localSymbol, currentPlayer, gameOver, status]);
}
