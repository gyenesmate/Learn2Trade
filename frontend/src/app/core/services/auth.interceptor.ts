import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@core/env/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

function isAppApiRequest(url: string): boolean {
  const base = environment.apiUrl.replace(/\/$/, '');
  return url === base || url.startsWith(`${base}/`);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = tokenStorage.getAccessToken();

  // Never attach Bearer tokens to third-party URLs (e.g. Binance) — that forces a
  // CORS preflight those APIs reject, which surfaces as HttpErrorResponse "Unknown Error".
  const authReq =
    token && isAppApiRequest(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (!isAppApiRequest(req.url)) {
        return throwError(() => err);
      }
      if (err?.status === 401) {
        auth.clearClientSession();
        void router.navigate(['/login']);
      } else if (err?.status === 403) {
        const detail = String(err?.error?.detail ?? '').toLowerCase();
        if (detail.includes('banned')) {
          auth.clearClientSession();
          void router.navigate(['/banned']);
        }
      }
      return throwError(() => err);
    })
  );
};
