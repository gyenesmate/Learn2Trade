/**
 * True when `url` is a sidebar-reachable top-level path (exact match on pathname).
 * Admin links without a `route` are ignored by callers that pass only defined routes.
 */
export function isSidebarReachablePath(
  url: string,
  routes: readonly string[]
): boolean {
  const path = url.split('?')[0].split('#')[0];
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return routes.some((route) => normalized === route);
}
