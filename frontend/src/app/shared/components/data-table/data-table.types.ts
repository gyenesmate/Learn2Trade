/** Rows passed to app-data-table should include a stable id that is not listed in columns. */
export type DataTableRow = { id: string } & Record<string, unknown>;

export interface TableColumn<T> {
  key: string; // The property name in your object
  label: string; // The text shown in the header
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  /**
   * When true, show a per-column filter control under the header.
   * ponytail: only text filters are implemented; date/select/number later.
   */
  filterable?: boolean;
}

export interface TableAction {
  label: string;
  icon?: string;
  /** Visual style from global `.btn` primitives. Defaults to `'primary'`. */
  variant?: 'primary' | 'secondary';
  callback: () => void;
}

export interface RowAction<T> {
  label: string;
  icon?: string;
  color?: string;
  callback: (row: T) => void;
  tooltip?: string;
}
