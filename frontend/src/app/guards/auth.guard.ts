import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, filter, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const currentPath = '/' + (route.routeConfig?.path || '');
    const publicRoutes = ['/login', '/register'];
    console.log('[AuthGuard] evaluating route', currentPath);

    return this.authService.getCurrentUserObservable().pipe(
      filter(user => user !== undefined), // wait until auth state known
      take(1),
      map(user => {
        const isLoggedIn = !!user;
        console.log('[AuthGuard] user', user, 'isLoggedIn', isLoggedIn);

        if (isLoggedIn && this.authService.isSessionExpired()) {
          console.log('[AuthGuard] session expired, redirect to login');
          this.router.navigate(['/login']);
          return false;
        }

        if (!isLoggedIn) {
          if (!publicRoutes.includes(currentPath)) {
            console.log('[AuthGuard] not logged in, redirect to login');
            this.router.navigate(['/login']);
            return false;
          }
          console.log('[AuthGuard] not logged in, accessing public route');
          return true;
        } else {
          if (publicRoutes.includes(currentPath)) {
            console.log('[AuthGuard] logged in, redirect from public to dashboard');
            this.router.navigate(['/dashboard']);
            return false;
          }
          console.log('[AuthGuard] logged in, accessing protected route');
          return true;
        }
      })
    );
  }
}