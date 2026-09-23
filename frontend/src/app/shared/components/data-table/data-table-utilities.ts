export interface TableColumn<T> {
  key: string; // The property name in your object
  label: string;         // The text shown in the header
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency';
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: string;
  callback: () => void;
  tooltip?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: string;
  color?: string;
  callback: (row: T) => void;
  tooltip?: string;
}