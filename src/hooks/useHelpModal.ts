import { useEffect, useState } from "react";
import { buildRulesText } from "../game/formatters";
import type { GameState } from "../game/types";
import { t } from "../i18n";

interface ModalState {
  open: boolean;
  title: string;
  html: string;
}

export function useHelpModal(gameState: GameState) {
  const [modal, setModal] = useState<ModalState>(() => ({
    open: false,
    title: t("modal.helpTitle"),
    html: ""
  }));

  function closeModal() {
    setModal({ open: false, title: t("modal.helpTitle"), html: "" });
  }

  function openHelp(helpKey: string) {
    const title = t(`help.${helpKey}.title`);
    const html = t(`help.${helpKey}.html`);
    setModal({ open: true, title, html });
  }

  function openRulesHelp() {
    const newGameStrong = `<strong>${t("buttons.newGame")}</strong>`;
    setModal({
      open: true,
      title: t("modal.rulesCurrentTitle"),
      html: `<p>${buildRulesText(gameState.config)}</p><p>${t("rules.modal.intro", { newGame: newGameStrong })}</p>`
    });
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return {
    modal,
    closeModal,
    openHelp,
    openRulesHelp
  };
}
