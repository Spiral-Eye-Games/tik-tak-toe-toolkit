/**
 * `true` si la URL incluye la query `?dev` (p. ej. panel experimental sin tocar cache local).
 */
export function isDev(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("dev");
}
