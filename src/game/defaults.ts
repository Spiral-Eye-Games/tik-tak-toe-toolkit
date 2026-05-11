import type { GameConfig, HelpContent, PieceMoveMode, Player } from "./types";

export const DEFAULT_COLUMNS = 4;
export const DEFAULT_ROWS = 4;
export const DEFAULT_LINE_RULE = "lose";
export const DEFAULT_LINE_LENGTH = 3;

export const DEFAULT_UNLIMITED_PIECES = false;
export const DEFAULT_MAX_PIECES_PER_PLAYER = 3;
export const DEFAULT_LIMITED_PIECE_MOVE_MODE: PieceMoveMode = "forcedOldest";
export const DEFAULT_UNLIMITED_PIECE_MOVE_MODE: PieceMoveMode = "blocked";

export const DEFAULT_BROKEN_ENABLED = true;
export const DEFAULT_BROKEN_HOLE_TURNS = 0;
export const DEFAULT_GRAVITY_ENABLED = false;

export const PLAYERS: Player[] = ["X", "O"];
export const STARTING_PLAYER: Player = "X";
export const PERMANENT_BROKEN_LABEL = "ROTO";
export const DRAW_IF_NO_LEGAL_MOVES = true;

export const DEFAULT_CONFIG: GameConfig = {
  columns: DEFAULT_COLUMNS,
  rows: DEFAULT_ROWS,
  lineRule: DEFAULT_LINE_RULE,
  lineLength: DEFAULT_LINE_LENGTH,
  pieceLimitType: DEFAULT_UNLIMITED_PIECES ? "unlimited" : "limited",
  maxPiecesPerPlayer: DEFAULT_MAX_PIECES_PER_PLAYER,
  pieceMoveMode: DEFAULT_UNLIMITED_PIECES ? DEFAULT_UNLIMITED_PIECE_MOVE_MODE : DEFAULT_LIMITED_PIECE_MOVE_MODE,
  brokenEnabled: DEFAULT_BROKEN_ENABLED,
  brokenHoleTurns: DEFAULT_BROKEN_HOLE_TURNS,
  gravityEnabled: DEFAULT_GRAVITY_ENABLED
};

export const HELP_CONTENT: Record<string, HelpContent> = {
  general: {
    title: "General",
    html: `
      <p>Esta sección define la estructura básica de la partida.</p>
      <ul>
        <li><strong>N Columnas</strong> controla el ancho del tablero.</li>
        <li><strong>N Filas</strong> controla el alto del tablero.</li>
        <li><strong>Ganar / Perder</strong> cambia el objetivo principal: podés jugar como Ta-Te-Ti normal o como versión misère, donde hacer línea te hace perder.</li>
        <li><strong>N en raya</strong> define cuántas fichas alineadas activan la condición.</li>
      </ul>
    `
  },
  pieces: {
    title: "Fichas",
    html: `
      <p>Esta sección controla cuántas fichas puede tener cada jugador y qué pasa cuando una ficha debe moverse.</p>
      <ul>
        <li><strong>Ilimitadas desactivado</strong>: cada jugador tiene una cantidad limitada de fichas vivas.</li>
        <li><strong>Ilimitadas activado</strong>: los jugadores pueden seguir agregando fichas sin límite.</li>
        <li><strong>Obligado</strong>: al llegar al máximo, la próxima acción debe mover la ficha más vieja.</li>
        <li><strong>Límite</strong>: al llegar al máximo, la próxima acción debe mover cualquier ficha propia.</li>
        <li><strong>Libre</strong>: con fichas limitadas, se puede mover cualquier ficha propia en cualquier momento, incluso antes de colocar todas las fichas posibles.</li>
        <li><strong>Bloqueadas</strong>: con fichas ilimitadas, no se puede mover una ficha ya colocada.</li>
        <li><strong>Libre</strong>: con fichas ilimitadas, se puede elegir mover una ficha propia en vez de colocar una nueva.</li>
      </ul>
      <p>El número sobre cada ficha muestra su orden actual dentro de las fichas de ese jugador.</p>
    `
  },
  holes: {
    title: "Rompe huecos",
    html: `
      <p>Cuando una ficha abandona una casilla, esa casilla puede quedar rota.</p>
      <ul>
        <li>El toggle del título activa o desactiva esta mecánica.</li>
        <li>Si está desactivada, la casilla queda libre normalmente.</li>
        <li>Si está activada, la casilla abandonada queda bloqueada.</li>
        <li><strong>Turnos</strong> define cuánto dura el bloqueo.</li>
        <li>Con <strong>0 turnos</strong>, el hueco queda roto hasta el final de la partida.</li>
      </ul>
    `
  },
  gravity: {
    title: "Gravedad",
    html: `
      <p>La gravedad hace que el tablero funcione más parecido a un Conecta 4.</p>
      <ul>
        <li>El toggle del título activa o desactiva esta mecánica.</li>
        <li>En vez de elegir cualquier casilla vacía, elegís una columna.</li>
        <li>La ficha cae hasta la posición libre más baja posible.</li>
        <li>Los huecos rotos actúan como obstáculos: las fichas no atraviesan casillas rotas.</li>
        <li>Cuando una ficha se mueve o desaparece, las fichas de esa columna se reacomodan hacia abajo.</li>
      </ul>
    `
  }
};
