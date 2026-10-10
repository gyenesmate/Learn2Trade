import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import {
  AppSnackbarAction,
  AppSnackbarRequest,
  AppSnackbarVariant,
} from '@shared/components/app-snackbar/app-snackbar.types';

const AUTO_DISMISS_MS = 3500;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly translate = inject(TranslateService);
  private readonly requestsSubject = new Subject<AppSnackbarRequest>();

  /** Stream of snackbar requests for the notification stack host. */
  readonly requests$: Observable<AppSnackbarRequest> = this.requestsSubject.asObservable();

  success(message: string, title?: string): void {
    this.emit('success', message, title ?? this.translate.instant('NOTIFY.SUCCESS'), AUTO_DISMISS_MS);
  }

  info(message: string, title?: string): void {
    this.emit('info', message, title ?? this.translate.instant('NOTIFY.INFO'), AUTO_DISMISS_MS);
  }

  warning(message: string, title?: string): void {
    this.emit('warning', message, title ?? this.translate.instant('NOTIFY.WARNING'), AUTO_DISMISS_MS);
  }

  /** Persists until the user dismisses via the close control. */
  error(message: string, title?: string): void {
    this.emit('error', message, title ?? this.translate.instant('NOTIFY.ERROR'), 0);
  }

  /**
   * Price / crypto alert — persists until dismissed.
   * Optional actions (e.g. View / Stop) replace the old fired-alerts widget controls.
   */
  alert(
    message: string,
    title?: string,
    actions?: readonly AppSnackbarAction[]
  ): void {
    this.emit(
      'alert',
      message,
      title ?? this.translate.instant('NOTIFY.CRYPTO_ALERT'),
      0,
      actions
    );
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
