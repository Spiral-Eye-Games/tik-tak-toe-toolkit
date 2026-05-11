# Ta-Te-Ti Toolkit - React/Vite migration 

Migración del prototipo HTML a **Vite + React + TypeScript**.

## Correr en local

```bash
npm install
npm run dev
```

## Build para publicar

```bash
npm run build
```

El resultado queda en `dist/`.

## Publicar en itch.io

1. Ejecutá `npm run build`.
2. Zipeá el contenido de `dist/`.
3. Subilo a itch.io como proyecto HTML5.

La config de Vite usa `base: "./"`, así que los assets quedan con rutas relativas y funcionan mejor en hosts tipo itch.io.

## Estructura

```txt
src/
  game/
    config.ts       # sanitización y opciones de configuración
    defaults.ts     # valores iniciales y textos de ayuda
    formatters.ts   # textos de estado, reglas y coordenadas
    reducer.ts      # flujo de acciones: jugar, mover, undo, redo, nuevo juego
    rules.ts        # lógica pura del juego
    types.ts        # tipos compartidos
  components/
    Board.tsx
    Cell.tsx
    HelpModal.tsx
    SettingsSection.tsx
    Sidebar.tsx
    TopBar.tsx
  App.tsx
  main.tsx
  styles.css
```

## Idea principal de la migración

La UI ahora solo renderiza y dispara acciones. La lógica vive en `src/game`, especialmente en `rules.ts` y `reducer.ts`.

Esto deja más fácil agregar reglas nuevas, presets, animaciones, guardado de configuraciones o tests sin seguir agrandando un único archivo HTML.
