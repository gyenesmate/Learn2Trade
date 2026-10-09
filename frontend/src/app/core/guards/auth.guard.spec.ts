import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';

describe('authGuard', () => {
  let currentUser: ReturnType<typeof signal<unknown>>;
  let createUrlTree: ReturnType<typeof vi.fn>;

  const routeSnapshot = (path: string, data: Record<string, unknown> = {}): ActivatedRouteSnapshot =>
    ({ routeConfig: { path }, data, firstChild: null } as unknown as ActivatedRouteSnapshot);

  const stateSnapshot = (url: string): RouterStateSnapshot =>
    ({ url } as RouterStateSnapshot);

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
            clearClientSession: vi.fn(),
          },
        },
      ],
    });
  });

  const runGuard = (path: string, url: string, data: Record<string, unknown> = {}) =>
    TestBed.runInInjectionContext(() =>
      authGuard(routeSnapshot(path, data), stateSnapshot(url))
    );

  it('allows guests on /auth/login', async () => {
    const result = runGuard('login', '/auth/login') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    expect(await resultPromise).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('allows guests on /app/markets when data.guest is true', async () => {
    const result = runGuard('markets', '/app/markets', { guest: true }) as Observable<
      boolean | UrlTree
    >;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    expect(await resultPromise).toBe(true);
  });

  it('redirects guests from /app/dashboard to /auth/login', async () => {
    const result = runGuard('dashboard', '/app/dashboard') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    expect(await resultPromise).toEqual({ commands: ['/auth/login'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });

  it('redirects guests from /learn to /auth/login', async () => {
    const result = runGuard('', '/learn') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set(null);

    expect(await resultPromise).toEqual({ commands: ['/auth/login'] });
  });

  it('redirects authenticated users away from /auth/login to /app/markets', async () => {
    const result = runGuard('login', '/auth/login') as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    currentUser.set({ id: 'u1', username: 'tester' });

    expect(await resultPromise).toEqual({ commands: ['/app/markets'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/app/markets']);
  });
});
