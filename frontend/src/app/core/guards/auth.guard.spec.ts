import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';

describe('authGuard', () => {
  let currentUser: ReturnType<typeof signal<unknown>>;
  let createUrlTree: ReturnType<typeof vi.fn>;

  const routeWithPath = (path: string): ActivatedRouteSnapshot =>
    ({ routeConfig: { path } } as ActivatedRouteSnapshot);

  beforeEach(() => {
    createUrlTree = vi.fn((commands: unknown[]) => ({ commands }) as unknown as UrlTree);
    currentUser = signal<unknown>(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree } },
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
    const result = runGuard('login') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    const allowed = await resultPromise;
    expect(allowed).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from protected routes to /login', async () => {
    const result = runGuard('dashboard') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    const redirected = await resultPromise;
    expect(redirected).toEqual({ commands: ['/login'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirects authenticated users away from /login to /dashboard', async () => {
    const result = runGuard('login') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set({ id: 'u1', username: 'tester' });

    const redirected = await resultPromise;
    expect(redirected).toEqual({ commands: ['/dashboard'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
