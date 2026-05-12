import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getColumnLetter } from "../game/formatters";
import type { BoardPosition, GameConfig } from "../game/types";
import { t } from "../i18n";
import { ModalPortal } from "./ModalPortal";

interface RestrictionGridModalProps {
  open: boolean;
  config: GameConfig;
  onApply: (blockedCells: BoardPosition[]) => void;
  onClose: () => void;
}

function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function keyToPosition(key: string): BoardPosition {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

function positionsToSet(positions: BoardPosition[]): Set<string> {
  return new Set(positions.map((position) => getCellKey(position.row, position.col)));
}

function setToPositions(keys: Set<string>): BoardPosition[] {
  return [...keys]
    .map(keyToPosition)
    .sort((a, b) => a.row - b.row || a.col - b.col);
}

export function RestrictionGridModal({ open, config, onApply, onClose }: RestrictionGridModalProps) {
  const [draftBlocked, setDraftBlocked] = useState<Set<string>>(() => positionsToSet(config.restrictionStartBlockedCells));
  const [dragMode, setDragMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftBlocked(positionsToSet(config.restrictionStartBlockedCells));
    setDragMode(null);
  }, [open, config.restrictionStartBlockedCells]);

  useEffect(() => {
    if (!open) return;
    function handlePointerUp() {
      setDragMode(null);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [open]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const cells = useMemo(
    () => Array.from({ length: config.rows }, (_rowValue, row) =>
      Array.from({ length: config.columns }, (_colValue, col) => ({ row, col }))
    ).flat(),
    [config.rows, config.columns]
  );

  function setCell(row: number, col: number, blocked: boolean) {
    const key = getCellKey(row, col);
    setDraftBlocked((previous) => {
      const next = new Set(previous);
      if (blocked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, row: number, col: number) {
    event.preventDefault();
    const key = getCellKey(row, col);
    const nextBlocked = !draftBlocked.has(key);
    setDragMode(nextBlocked);
    setCell(row, col, nextBlocked);
  }

  function handlePointerEnter(row: number, col: number) {
    if (dragMode === null) return;
    setCell(row, col, dragMode);
  }

  function clearAll() {
    setDraftBlocked(new Set());
  }

  function invertAll() {
    setDraftBlocked((previous) => {
      const next = new Set<string>();
      for (const { row, col } of cells) {
        const key = getCellKey(row, col);
        if (!previous.has(key)) next.add(key);
      }
      return next;
    });
  }

  function applyChanges() {
    onApply(setToPositions(draftBlocked));
    onClose();
  }

  return (
    <ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        aria-hidden={false}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="modal restriction-grid-modal" role="dialog" aria-modal="true" aria-labelledby="restrictionGridModalTitle">
          <header className="modal-header">
            <h2 className="modal-title" id="restrictionGridModalTitle">{t("restrictionGrid.title")}</h2>
            <button className="modal-close" type="button" aria-label={t("actions.close")} onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="modal-body restriction-grid-modal-body">
            <p className="restriction-grid-intro">{t("restrictionGrid.intro")}</p>
            <div className="restriction-grid-guide">
              <strong>{t("restrictionGrid.guideTitle")}</strong>
              <span>{t("restrictionGrid.guideBody")}</span>
            </div>

            <div
              className="restriction-grid"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                aspectRatio: `${config.columns} / ${config.rows}`,
                width: `min(100%, ${config.columns * 56 + Math.max(0, config.columns - 1) * 8}px)`
              } as CSSProperties}
            >
              {cells.map(({ row, col }) => {
                const blocked = draftBlocked.has(getCellKey(row, col));
                const coordinate = `${getColumnLetter(col)}${row + 1}`;
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    className={`restriction-grid-cell${blocked ? " blocked" : ""}`}
                    aria-pressed={blocked}
                    aria-label={t("restrictionGrid.cellLabel", { coordinate })}
                    title={coordinate}
                    onPointerDown={(event) => handlePointerDown(event, row, col)}
                    onPointerEnter={() => handlePointerEnter(row, col)}
                  >
                    <span>{coordinate}</span>
                  </button>
                );
              })}
            </div>

            <div className="restriction-grid-meta">
              {t("restrictionGrid.selectedCount", { count: draftBlocked.size })}
            </div>

            <div className="restriction-grid-actions">
              <button className="button secondary" type="button" onClick={clearAll}>
                {t("restrictionGrid.clear")}
              </button>
              <button className="button secondary" type="button" onClick={invertAll}>
                {t("restrictionGrid.invert")}
              </button>
              <button className="button secondary" type="button" onClick={onClose}>
                {t("actions.close")}
              </button>
              <button className="button" type="button" onClick={applyChanges}>
                {t("restrictionGrid.apply")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
