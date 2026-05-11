interface TopBarProps {
  status: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ status, canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  return (
    <header className="topbar">
      <h1>Ta-Te-Ti Toolkit</h1>
      <div className="turn-pill">{status}</div>
      <div className="topbar-actions">
        <button className="button icon" title="Deshacer" type="button" disabled={!canUndo} onClick={onUndo}>↶</button>
        <button className="button icon" title="Rehacer" type="button" disabled={!canRedo} onClick={onRedo}>↷</button>
      </div>
    </header>
  );
}
