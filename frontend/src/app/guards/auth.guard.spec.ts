import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let routerSpy: jasmine.SpyObj<Router>;

  let authState$: BehaviorSubject<any | null | undefined>;
  let authServiceStub: { getCurrentUserObservable: () => any; isSessionExpired: () => boolean };

  const routeWithPath = (path: string): ActivatedRouteSnapshot =>
    ({ routeConfig: { path } as any } as ActivatedRouteSnapshot);

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authState$ = new BehaviorSubject<any | null | undefined>(undefined);
    authServiceStub = {
      getCurrentUserObservable: () => authState$.asObservable(),
      isSessionExpired: () => false
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceStub }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('allows unauthenticated users on public routes (/login)', async () => {
    const resultPromise = firstValueFrom(guard.canActivate(routeWithPath('login')));
    authState$.next(null);

    const allowed = await resultPromise;
    expect(allowed).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from protected routes to /login', async () => {
    const resultPromise = firstValueFrom(guard.canActivate(routeWithPath('dashboard')));
    authState$.next(null);

    const allowed = await resultPromise;
    expect(allowed).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects authenticated users away from /login to /dashboard', async () => {
    const resultPromise = firstValueFrom(guard.canActivate(routeWithPath('login')));
    authState$.next({ id: 'u1', username: 'tester' });

    const allowed = await resultPromise;
    expect(allowed).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
