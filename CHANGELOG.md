# Changelog

## [v2.12.0] — 2026-05-14 — Omisión de turno y rendición (`93bd07b`)

**Resumen revisado:** flujo para **omitir turno** (FAB, bloqueos con `skipTurnLock`) y **rendirse** (FAB + modal de confirmación); extensión de `config`/`defaults`, `outcomes`, red `useMultiplayer`, estilos e i18n.

---

## [v2.11.0] — 2026-05-14 — Gravedad: colisiones / «colliders» (`03d54e8`)

**Resumen revisado:** ajustes en `gravity`, `brokenHoles`, `placement`, `moves`; nuevos campos en tipos/formatters; refactor de secciones en sidebar y textos.

---

## [v2.10.2] — 2026-05-14 — Ajustes de reglas y UI (`4233298`)

**Resumen revisado:** cambios en `clockTimeouts`, `config`, `defaults`, `outcomes`, `skipTurn`, `formatters`, `Board`/strips/sidebar y traducciones (commit etiquetado genéricamente como «fixes»).

---

## [v2.10.1] — 2026-05-14 — Corrección menor de estilos (`f946055`)

**Resumen revisado:** cambio puntual en `styles.css`.

---

## [v2.10.0] — 2026-05-14 — Entradas numéricas, lista de turnos, undo/redo en tablero (`ade0882`)

**Resumen revisado:** componentes **`CustomSelect`**, **`NumericDraftInput`** / modo numérico, **`BoardUndoRedoRow`**; lógica de **`boardTurnTimeline`**, **`outcomeStripRanking`**, mejoras fuertes en `BoardEventStrip` / `BoardOutcomeStrip`, `SidebarSections`, CSS e i18n. Salto importante de **Y** dentro de **v2**.

---

## [v2.9.0] — 2026-05-14 — Cronómetro en barra superior (`d1d0c87`)

**Resumen revisado:** integración visual del cronómetro en `TopBar`, toques en `useGameClock`, `clock`, estilos y textos.

---

## [v2.8.2] — 2026-05-14 — Ajustes finos multijugador «online» (`e0e1e29`)

**Resumen revisado:** pequeños cambios en `App` y comportamiento/handshake en `useMultiplayer`.

---

## [v2.8.1] — 2026-05-14 — Publicación / wiring online (`3dfd90a`)

**Resumen revisado:** simplificación de fragmentos/lógica en `App`.

---

## [v2.8.0] — 2026-05-14 — Omitir turno en partida sincronizada (`7937b70`)

**Resumen revisado:** **`BoardSkipTurnFab`**, lógica `skipTurn`, pequeños cambios en reloj/config/reducer, panel multiplayer e i18n. *(Nota interna del repo: el historial tiene «v3.4» en el mensaje de commit; aquí corresponde a un incremento de **Y** o **feature** dentro de **v2**.)*

---

## [v2.7.0] — 2026-05-14 — Robustez PeerJS y mensajes de error (`033e57f`)

**Resumen revisado:** refactor de `useMultiplayer`, **`peerService`**, **`wireErrorMessage`**, tipos de red, panel y estilos.

---

## [v2.6.1] — 2026-05-13 — Iteración panel multijugador (`f42b773`)

**Resumen revisado:** ampliaciones en `MultiplayerPanel` y hook; strings i18n.

---

## [v2.6.0] — 2026-05-13 — Chat, sonidos y panel multiplayer v3 (`a316d40`)

**Resumen revisado:** **`chatSounds`**, mejoras grandes del **`MultiplayerPanel`**, **`isDev`**, caché de sesión, más integración `useMultiplayer`.

---

## [v2.5.2] — 2026-05-13 — Sesión borrador multijugador y tooltips (`d4a34c3`)

**Resumen revisado:** `sessionCache` para modo red, **`useDraftConfig`** más estricto, `Tooltip`, `MultiplayerPanel`, `App`.

---

## [v2.5.1] — 2026-05-13 — Pulido panel e i18n (`ab1e025`)

**Resumen revisado:** pequeños cambios en panel, locales y hook.

---

## [v2.5.0] — 2026-05-13 — Mayor iteración UI multijugador (`2024fdb`)

**Resumen revisado:** refactor sustancial **`MultiplayerPanel`**, **`useMultiplayer`**, **`networkTypes`**, estilos y claves nuevas en traducciones.

---

## [v2.4.1] — 2026-05-13 — Ajustes visuales del panel (`89c11ca`)

**Resumen revisado:** reorden/layout `MultiplayerPanel` y CSS.

---

## [v2.4.0] — 2026-05-13 — Sincronización y estados avanzados online (`f1ffac8`)

**Resumen revisado:** muchos cambios en **`App`**, **`useMultiplayer`** (histórico, mensajes), **`MultiplayerPanel`**, `outcomes`, `config`; commit original «various upgrades 1».

---

## [v2.3.1] — 2026-05-13 — Corrección actualizaciones de conexión (`7963ef7`)

**Resumen revisado:** ajustes de efectos/estado en `App`.

---

## [v2.3.0] — 2026-05-13 — Partidas online jugables sincronizadas (`6b8bd92`)

**Resumen revisado:** cableado fuerte **`App`** + **`Board`** + **`VictoryModal`**, bloqueos en **`Cell`**, **`useMultiplayer`** (envío/recibo de estado), panel y strings.

---

## [v2.2.0] — 2026-05-13 — Límites de sesión / jugadores (`f851310`)

**Resumen revisado:** límites y validaciones en panel, **`peerService`**, **`useMultiplayer`**, i18n.

---

## [v2.1.0] — 2026-05-13 — Mejoras UI del panel online (`4aa544f`)

**Resumen revisado:** más UI en **`MultiplayerPanel`**, integración **`App`**, estilos, textos.

---

## [v2.0.4] — 2026-05-13 — Lista de jugadores conectados (`1b0881d`)

**Resumen revisado:** tipo/conteo en `networkTypes`; lógica de pares/listas en **`useMultiplayer`**.

---

## [v2.0.3] — 2026-05-13 — Fix workflow deploy (`efbf869`)

**Resumen revisado:** línea puntual en `.github/workflows/deploy.yml`.

---

## [v2.0.2] — 2026-05-13 — Workflow de despliegue (`37a4bfa`, `e76c780`)

**Resumen revisado:** dos commits «fix deploy» reorganizando el job de GitHub Actions.

---

## [v2.0.0] — 2026-05-13 — Primera versión multijugador en red PeerJS (`95269ca`)

**Resumen revisado:** dependencia **`peerjs`**, módulos **`peerService`**, **`useMultiplayer`**, **`MultiplayerPanel`**, tipos **`networkTypes`**, textos nuevos y estilos. **Primer aumento mayor** respecto al juego solo en local (**v1 → v2** según tu criterio).

---

## [v1.10.3] — 2026-05-12 — Ranking / empates (`856f82d`)

**Resumen revisado:** correcciones en **`outcomes.ts`** y `dist`/assets.

---

## [v1.10.2] — 2026-05-12 — Iconos de jugador en tablero (`ad75ad8`)

**Resumen revisado:** simplificación/ajuste de **`PlayerMarkSpan`** y estilos conectados; toques **`Cell`** / **`VictoryModal`** / `defaults`.

---

## [v1.10.1] — 2026-05-12 — Textos de ayuda y formatters (`cffaf67`)

**Resumen revisado:** grandes sumas en **`formatters`** y locale para ayuda modales.

---

## [v1.10.0] — 2026-05-12 — Cajas rotas / restricciones de movimiento y modales (`104b802`)

**Resumen revisado:** módulo **`restrictions.ts`**, modales **`MovementInfoModal`**, **`RestrictionGridModal`**, cambios en `moves`, `placement`, configuración sidebar e i18n.

---

## [v1.9.1] — 2026-05-12 — Correcciones post‑colapso (`08ac0b5`)

**Resumen revisado:** `clockTimeouts`, `config`, `outcomes`; UI sidebar/board.

---

## [v1.9.0] — 2026-05-12 — Colapso de bloques (`b5d6274`)

**Resumen revisado:** motor **`collapse.ts`**, **`eventCountdowns`**, integración reducer/outcomes/UI e i18n.

---

## [v1.8.1] — 2026-05-12 — Inputs numéricos en configuración (`f2c1af0`)

**Resumen revisado:** mejor comportamiento/edición numérica en **`SidebarSections`**.

---

## [v1.8.0] — 2026-05-12 — “Monedas” / marcadores por jugador (`da5e234`)

**Resumen revisado:** rediseño fuerte **`PlayerMarkSpan`**; simplificación configuración marcadores y estilos; panel jugadores anterior retirado o fusionado.

---

## [v1.7.1] — 2026-05-12 — Iconos Lucide (`35b2cd6`)

**Resumen revisado:** **`lucide-react`** en `package.json`, iconos sustituyen emojis locales en UI.

---

## [v1.7.0] — 2026-05-12 — Refactor del motor por módulos (`a9d0f4e`)

**Resumen revisado:** regla **`project-architecture`**, extracción **`board`**, **`brokenHoles`**, **`lines`**, **`placement`**, **`moves`**, **`outcomes`**, **`history`**, **`clockTimeouts`**, **`turns`**, hooks **`useDraftConfig`**, **`useGameClock`**, **`useHelpModal`**, **`usePendingGravityRotation`**; **`SidebarSections`** desde **`Sidebar`**; reducer más liviano.

---

## [v1.6.1] — 2026-05-12 — Herramienta de build (`2794efd`)

**Resumen revisado:** `vite.config.ts` fuente de verdad (eliminación de `vite.config.js` stale), tweaks `tsconfig` y workflow deploy.

---

## [v1.6.0] — 2026-05-12 — Estado de partida en banner (`3a5952c`)

**Resumen revisado:** **`MatchStatusBanner`**, **`sessionCache`**, mejoras **`App`**, **`TopBar`**, **`Sidebar`** e i18n.

---

## [v1.5.2] — 2026-05-11 — Sin emojis en favor de símbolos (`9faad9f`)

**Resumen revisado:** opciones **`cellKindStyle`** / config de piezas sin emojis fuertes; ajustes en celdas, modales, formatters.

---

## [v1.5.1] — 2026-05-11 — Portales modal y tooltips (`01eb332`)

**Resumen revisado:** **`Tooltip`**, **`ModalPortal`**, reestructuración modales (**`PlayersModal`**, **`PresetModal`**, **`HelpModal`**, configuración).

---

## [v1.5.0] — 2026-05-11 — Presets de partida (`4869e29`)

**Resumen revisado:** **`PresetModal`** y motor **`presets.ts`**.

---

## [v1.4.0] — 2026-05-11 — Cronómetro por jugada (`795267c`)

**Resumen revisado:** módulo **`clock.ts`**, integración reducer, sidebar barra lateral, configuración tiempo e i18n.

---

## [v1.3.0] — 2026-05-11 — Gravedad y casillas rotas (`a57c21d`)

**Resumen revisado:** **`gravity.ts`**, reglas **`brokenHoles`** en práctica ampliadas, configuración granular sidebar, formato y textos.

---

## [v1.2.0] — 2026-05-11 — Multijugador local por turnos (`7f7e1c8`)

**Resumen revisado:** **`PlayersModal`**, **`VictoryModal`**, **`BoardOutcomeStrip`**, flujo varios jugadores en **`reducer`/`rules`**, diseño **`Board`** y estilos. *(No PeerJS todavía; es el modo “humano contra humano” en el mismo cliente.)*

---

## [v1.1.0] — 2026-05-11 — Internacionalización EN/ES (`a6d29bf`)

**Resumen revisado:** **`i18n.ts`**, **`locales/en.json`**, **`es.json`**, reemplazo de literales visibles por claves **`t(...)`**.

---

## [v1.0.2] — 2026-05-11 — Nombre público base (`f18aaa9`)

**Resumen revisado:** ajuste en **`vite.config`**.

---

## [v1.0.2] — 2026-05-11 — CI: workflow en `.github/workflows` (`b854663`)

**Resumen revisado:** mueve/definición correcta **`deploy.yml`**, README.

---

## [v1.0.1] — 2026-05-11 — Despliegue documentado (`fb129af`)

**Resumen revisado:** README para flujo Pages.

---

## [v1.0.1] — 2026-05-11 — Workflow inicial GitHub Pages (`7fdf38a`)

**Resumen revisado:** primer archivo de workflow *(ruta inicial atípica; corregido en commit siguiente)*.

---

## [v1.0.1] — 2026-05-11 — Licencia y lockfile (`fd65aef`)

**Resumen revisado:** **`LICENSE`**, actualización **`package-lock.json`**.

---

## [v1.0.0] — 2026-05-11 — Primer commit migración React+Vite (`ec184b4`)

**Resumen revisado:** app base (**`App`**, **`Board`**, **`Cell`**, sidebar, configuración), motor en **`rules`/`reducer`/`types`/`defaults`/`config`**, estilos, build Vite y artefactos `dist/` incluidos en el commit inicial.
