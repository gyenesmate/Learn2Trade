export interface PageHeaderAction {
  label: string;
  icon?: string;
  /** Visual style from global `.btn` primitives. Defaults to `'primary'`. */
  variant?: 'primary' | 'secondary';
  callback: () => void;
  disabled?: boolean;
}

/** Static action descriptor (callbacks wired in the component). */
export type PageHeaderActionDef = Omit<PageHeaderAction, 'callback' | 'disabled'>;
