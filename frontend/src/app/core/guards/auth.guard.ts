import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserMe } from '@core/models/models';

const LOGIN = ['/auth/login'] as const;
const APP_HOME = ['/app/markets'] as const;

function waitForUser(): Observable<UserMe | null> {
  const auth = inject(AuthService);
  return toObservable(auth.currentUser).pipe(
    filter((user): user is UserMe | null => user !== undefined),
    take(1)
  );
}

function isGuestAllowed(route: ActivatedRouteSnapshot, url: string): boolean {
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    if (current.data?.['guest'] === true) return true;
    current = current.firstChild;
  }
  // Fallback when parent canActivate runs before child data is visible on the snapshot.
  const path = (url.split('?')[0] ?? '').replace(/\/+$/, '');
  return path === '/app/markets';
}

function shellOf(url: string): 'auth' | 'app' | 'learn' | 'other' {
  if (url === '/auth' || url.startsWith('/auth/')) return 'auth';
  if (url === '/app' || url.startsWith('/app/')) return 'app';
  if (url === '/learn' || url.startsWith('/learn/')) return 'learn';
  return 'other';
}

function decide(
  user: UserMe | null,
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  router: Router,
  auth: AuthService
): boolean | UrlTree {
  const shell = shellOf(state.url.split('?')[0] ?? state.url);

  if (user != null && auth.isSessionExpired()) {
    auth.clearClientSession();
    return router.createUrlTree([...LOGIN]);
  }

  const loggedIn = user != null;

  if (shell === 'auth') {
    if (loggedIn) return router.createUrlTree([...APP_HOME]);
    return true;
  }

  if (shell === 'learn') {
    return loggedIn ? true : router.createUrlTree([...LOGIN]);
  }

  if (shell === 'app') {
    if (loggedIn) return true;
    return isGuestAllowed(route, state.url) ? true : router.createUrlTree([...LOGIN]);
  }

  return true;
}

/** Shell / child activation — waits for auth bootstrap, then applies guest/login rules. */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return waitForUser().pipe(map((user) => decide(user, route, state, router, auth)));
};

export const authChildGuard: CanActivateChildFn = (childRoute, state) =>
  authGuard(childRoute, state);
