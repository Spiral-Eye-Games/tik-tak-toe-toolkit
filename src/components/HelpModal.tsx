interface HelpModalProps {
  open: boolean;
  title: string;
  html: string;
  onClose: () => void;
}

export function HelpModal({ open, title, html, onClose }: HelpModalProps) {
  return (
    <div
      className={`modal-backdrop ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header className="modal-header">
          <h2 className="modal-title" id="modalTitle">{title}</h2>
          <button className="modal-close" type="button" aria-label="Cerrar" onClick={onClose}>×</button>
        </header>
        <div className="modal-body" dangerouslySetInnerHTML={{ __html: html }} />
      </section>
    </div>
  );
}
