import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentPath = '/' + (route.routeConfig?.path || '');
  const publicRoutes = ['/login', '/register'];

  const user = authService.currentUser();
  if (!user) {
    return false;
  }

  const isLoggedIn = authService.isLoggedIn();

  if (isLoggedIn && authService.isSessionExpired()) {
    void router.navigate(['/login']);
    return false;
  }

  if (!isLoggedIn) {
    if (!publicRoutes.includes(currentPath)) {
      void router.navigate(['/login']);
      return false;
    }
    return true;
  }

  if (publicRoutes.includes(currentPath)) {
    void router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
