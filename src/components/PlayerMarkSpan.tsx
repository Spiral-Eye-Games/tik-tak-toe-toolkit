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
import type { CSSProperties } from "react";
import { getPlayerLabel, getPlayerMark } from "../game/formatters";
import type { GameConfig, PlayerIconId, PlayerId } from "../game/types";

const PLAYER_ICONS = {
  cross: XIcon,
  circle: Circle,
  triangle: Triangle,
  square: Square,
  spade: Spade,
  diamond: Diamond,
  club: Club,
  heart: Heart,
  moon: Moon,
  sun: Sun,
  zap: Zap,
  star: Star
} satisfies Record<PlayerIconId, LucideIcon>;

const FILLED_PLAYER_ICONS = new Set<PlayerIconId>([
  "circle",
  "square",
  "triangle",
  "spade",
  "diamond",
  "club",
  "heart",
  "star",
  "sun",
  "moon",
  "zap"
]);

interface PlayerMarkSpanProps {
  config: GameConfig;
  playerId: PlayerId;
  className?: string;
}

interface PlayerMarkGlyphProps {
  icon: PlayerIconId;
  className: string;
  label?: string;
  style?: CSSProperties;
}

export function PlayerMarkGlyph({ icon, className, label, style }: PlayerMarkGlyphProps) {
  const Icon = PLAYER_ICONS[icon];

  return (
    <span
      className={[
        className,
        "player-mark-glyph--icon",
        icon === "cross" ? "player-mark-glyph--heavy-stroke" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      style={style}
    >
      <Icon aria-hidden="true" fill={FILLED_PLAYER_ICONS.has(icon) ? "currentColor" : "none"} />
    </span>
  );
}

export function PlayerMarkSpan({ config, playerId, className }: PlayerMarkSpanProps) {
  const mark = getPlayerMark(config, playerId);
  const label = getPlayerLabel(config, playerId);
  return <PlayerMarkGlyph icon={mark.icon} className={className ?? "player-mark-glyph"} label={label} style={{ color: mark.color }} />;
}
