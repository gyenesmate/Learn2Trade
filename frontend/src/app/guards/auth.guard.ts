import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '@services/auth.service';

const PUBLIC_ROUTES = ['/login', '/register'];

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentPath = '/' + (route.routeConfig?.path || '');

  return toObservable(authService.currentUser).pipe(
    filter((user) => user !== undefined),
    take(1),
    map((user) => {
      const isLoggedIn = user != null;

      if (isLoggedIn && authService.isSessionExpired()) {
        return router.createUrlTree(['/login']);
      }

      if (!isLoggedIn) {
        return PUBLIC_ROUTES.includes(currentPath)
          ? true
          : router.createUrlTree(['/login']);
      }

      if (PUBLIC_ROUTES.includes(currentPath)) {
        return router.createUrlTree(['/dashboard']);
      }

      return true;
    })
  );
};
