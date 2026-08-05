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

    return this.authService.getCurrentUserObservable().pipe(
      filter(user => user !== undefined),
      take(1),
      map(user => {
        const isLoggedIn = !!user;

        if (isLoggedIn && this.authService.isSessionExpired()) {
          this.router.navigate(['/login']);
          return false;
        }

        if (!isLoggedIn) {
          if (!publicRoutes.includes(currentPath)) {
            this.router.navigate(['/login']);
            return false;
          }
          return true;
        }

        if (publicRoutes.includes(currentPath)) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }
}
