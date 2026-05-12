import { getPlayerMark } from "../game/formatters";
import type { GameConfig, PlayerId } from "../game/types";

interface PlayerMarkSpanProps {
  config: GameConfig;
  playerId: PlayerId;
  className?: string;
}

export function PlayerMarkSpan({ config, playerId, className }: PlayerMarkSpanProps) {
  const mark = getPlayerMark(config, playerId);
  return (
    <span className={className ?? "player-mark-glyph"} style={{ color: mark.color }}>
      {mark.symbol}
    </span>
  );
}
