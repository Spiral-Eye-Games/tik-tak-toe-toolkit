/**
 * `true` si la URL incluye la query `?tatau` (nombre alternativo de la app).
 */
export function isTatau(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("tatau");
}
