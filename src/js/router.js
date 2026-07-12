// js/router.js
// Definición de rutas de la SPA y función pura de matching, separada de
// app.js para poder testearla sin necesidad de un DOM real.

export const routes = [
  { path: /^\/(home)?$/, view: 'home' },
  { path: /^\/characters$/, view: 'characters' },
  { path: /^\/chat\/(?<id>[\w-]+)$/, view: 'chat' },
  { path: /^\/about$/, view: 'about' },
];

/**
 * Dado un pathname, devuelve { view, params } o null si ninguna ruta matchea.
 * @param {string} pathname
 */
export function matchRoute(pathname) {
  for (const route of routes) {
    const match = pathname.match(route.path);
    if (match) return { view: route.view, params: match.groups || {} };
  }
  return null;
}
