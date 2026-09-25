import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  AppSnackbarAction,
  AppSnackbarRequest,
  AppSnackbarVariant,
} from '@shared/components/app-snackbar/app-snackbar.model';

const AUTO_DISMISS_MS = 3500;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly requestsSubject = new Subject<AppSnackbarRequest>();

  /** Stream of snackbar requests for the notification stack host. */
  readonly requests$: Observable<AppSnackbarRequest> = this.requestsSubject.asObservable();

  success(message: string, title = 'Success'): void {
    this.emit('success', message, title, AUTO_DISMISS_MS);
  }

  info(message: string, title = 'Info'): void {
    this.emit('info', message, title, AUTO_DISMISS_MS);
  }

  warning(message: string, title = 'Warning'): void {
    this.emit('warning', message, title, AUTO_DISMISS_MS);
  }

  /** Persists until the user dismisses via the close control. */
  error(message: string, title = 'Error'): void {
    this.emit('error', message, title, 0);
  }

  /**
   * Price / crypto alert — persists until dismissed.
   * Optional actions (e.g. View / Stop) replace the old fired-alerts widget controls.
   */
  alert(
    message: string,
    title = 'Crypto Alert',
    actions?: readonly AppSnackbarAction[]
  ): void {
    this.emit('alert', message, title, 0, actions);
  }

  private emit(
    variant: AppSnackbarVariant,
    message: string,
    title: string,
    duration: number,
    actions?: readonly AppSnackbarAction[]
  ): void {
    this.requestsSubject.next({ message, title, variant, duration, actions });
  }
}
