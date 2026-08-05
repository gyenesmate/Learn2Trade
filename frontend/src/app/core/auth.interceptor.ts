import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from './token.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const token = tokenStorage.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        tokenStorage.clear();
        void router.navigate(['/login']);
      } else if (err?.status === 403) {
        const detail = String(err?.error?.detail ?? '').toLowerCase();
        if (detail.includes('banned')) {
          tokenStorage.clear();
          void router.navigate(['/banned']);
        }
      }
      return throwError(() => err);
    })
  );
};
