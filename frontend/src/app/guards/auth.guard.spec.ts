import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { Mock } from 'vitest';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let navigate: Mock;
  let currentUser: ReturnType<typeof signal<unknown>>;

  const routeWithPath = (path: string): ActivatedRouteSnapshot =>
    ({ routeConfig: { path } } as ActivatedRouteSnapshot);

  beforeEach(() => {
    navigate = vi.fn();
    currentUser = signal<unknown>(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: AuthService,
          useValue: {
            currentUser,
            isSessionExpired: () => false,
          },
        },
      ],
    });
  });

  const runGuard = (path: string) =>
    TestBed.runInInjectionContext(() => authGuard(routeWithPath(path), {} as never));

  it('allows unauthenticated users on public routes (/login)', async () => {
    const result = runGuard('login') as Observable<boolean>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    const allowed = await resultPromise;
    expect(allowed).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from protected routes to /login', async () => {
    const result = runGuard('dashboard') as Observable<boolean>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    const allowed = await resultPromise;
    expect(allowed).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects authenticated users away from /login to /dashboard', async () => {
    const result = runGuard('login') as Observable<boolean>;
    const resultPromise = firstValueFrom(result);
    currentUser.set({ id: 'u1', username: 'tester' });

    const allowed = await resultPromise;
    expect(allowed).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
