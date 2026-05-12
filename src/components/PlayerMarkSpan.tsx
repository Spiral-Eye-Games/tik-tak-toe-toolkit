import {
  Circle,
  Club,
  Diamond,
  Heart,
  Moon,
  Spade,
  Square,
  Star,
  Sun,
  Triangle,
  X as XIcon,
  Zap,
  type LucideIcon
} from "lucide-react";
import { getPlayerMark } from "../game/formatters";
import type { GameConfig, PlayerId } from "../game/types";

function getPlayerIcon(playerId: PlayerId): LucideIcon | null {
  switch (playerId) {
    case "p0":
      return XIcon;
    case "p1":
      return Circle;
    case "p2":
      return Square;
    case "p3":
      return Triangle;
    case "p4":
      return Spade;
    case "p5":
      return Diamond;
    case "p6":
      return Club;
    case "p7":
      return Heart;
    case "p8":
      return Star;
    case "p9":
      return Sun;
    case "p10":
      return Moon;
    case "p11":
      return Zap;
    default:
      return null;
  }
}

const FILLED_PLAYER_IDS = new Set<PlayerId>(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"]);

interface PlayerMarkSpanProps {
  config: GameConfig;
  playerId: PlayerId;
  className?: string;
}

interface PlayerMarkGlyphProps {
  playerId: PlayerId;
  symbol: string;
  className: string;
}

export function PlayerMarkGlyph({ playerId, symbol, className }: PlayerMarkGlyphProps) {
  const Icon = getPlayerIcon(playerId);

  if (!Icon) {
    return <span className={className}>{symbol}</span>;
  }

  return (
    <span
      className={[
        className,
        "player-mark-glyph--icon",
        playerId === "p0" ? "player-mark-glyph--heavy-stroke" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={symbol}
    >
      <Icon aria-hidden="true" fill={FILLED_PLAYER_IDS.has(playerId) ? "currentColor" : "none"} />
    </span>
  );
}

export function PlayerMarkSpan({ config, playerId, className }: PlayerMarkSpanProps) {
  const mark = getPlayerMark(config, playerId);
  return (
    <span style={{ color: mark.color }}>
      <PlayerMarkGlyph playerId={playerId} symbol={mark.symbol} className={className ?? "player-mark-glyph"} />
    </span>
  );
}
