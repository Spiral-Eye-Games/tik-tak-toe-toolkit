import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages (sitio de proyecto): la URL puede ser /repo o /repo/; con base "./" los assets fallan sin barra final. */
function viteBase(): string {
  const raw = process.env.VITE_BASE?.trim();
  if (!raw) return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export default defineConfig({
  plugins: [react()],
  base: viteBase()
});
