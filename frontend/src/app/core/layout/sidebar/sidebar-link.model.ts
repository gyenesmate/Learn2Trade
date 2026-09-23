/**
 * Declarative sidebar navigation entry.
 * Visibility is evaluated against auth state when rendering.
 */
export type SidebarLinkVisibility =
  | 'always'
  | 'authenticated'
  | 'anonymous'
  | 'admin';

export type SidebarLinkSection = 'main' | 'admin' | 'footer';

export interface SidebarLink {
  /** Stable id for tracking */
  id: string;
  /**
   * Router path, e.g. `/dashboard`.
   * Omit (or leave empty) for placeholder entries that do not navigate yet.
   */
  route?: string;
  /** Visible label when expanded */
  label: string;
  /** Material Icons ligature name */
  icon: string;
  /** When the link should appear */
  visibility: SidebarLinkVisibility;
  /** Future access control — non-interactive when true */
  disabled?: boolean;
  /** Placement group in the sidebar */
  section?: SidebarLinkSection;
}
