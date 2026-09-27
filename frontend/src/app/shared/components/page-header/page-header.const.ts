import { SidebarLink } from '@core/layout/sidebar/sidebar-link.types';
import { SIDEBAR_LINKS } from '@core/layout/sidebar/sidebar.const';

/** Sidebar routes that count as top-level destinations (back button hidden). */
export const SIDEBAR_REACHABLE_ROUTES: readonly string[] = SIDEBAR_LINKS.map(
  (link: SidebarLink) => link.route
).filter((route): route is string => typeof route === 'string' && route.length > 0);
