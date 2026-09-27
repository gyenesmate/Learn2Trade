import { SidebarLink } from './sidebar-link.types';

export function isSidebarLinkVisible(
  link: SidebarLink,
  loggedIn: boolean,
  admin: boolean
): boolean {
  switch (link.visibility) {
    case 'always':
      return true;
    case 'authenticated':
      return loggedIn;
    case 'anonymous':
      return !loggedIn;
    case 'admin':
      return admin;
    default:
      return true;
  }
}
