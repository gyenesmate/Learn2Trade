export type AppSnackbarVariant = 'success' | 'info' | 'warning' | 'error' | 'alert';

export interface AppSnackbarAction {
  label: string;
  run: () => void;
}

export interface AppSnackbarData {
  id: string;
  message: string;
  title?: string;
  variant: AppSnackbarVariant;
  actions?: readonly AppSnackbarAction[];
}

/** Payload emitted by NotificationService before the stack assigns an id. */
export type AppSnackbarRequest = Omit<AppSnackbarData, 'id'> & { duration: number };
