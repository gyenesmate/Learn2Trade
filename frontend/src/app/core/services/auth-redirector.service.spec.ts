import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthRedirectorService } from './auth-redirector.service';
import { AuthService } from './auth.service';

describe('AuthRedirectorService', () => {
  it('classifies public URLs', () => {
    TestBed.configureTestingModule({
      providers: [
        AuthRedirectorService,
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        { provide: Router, useValue: { url: '/', navigateByUrl: vi.fn() } },
      ],
    });
    const svc = TestBed.inject(AuthRedirectorService);
    expect(svc.isPublicUrl('/')).toBe(true);
    expect(svc.isPublicUrl('/auth/login')).toBe(true);
    expect(svc.isPublicUrl('/app/markets')).toBe(true);
    expect(svc.isPublicUrl('/app/dashboard')).toBe(false);
    expect(svc.isPublicUrl('/learn')).toBe(false);
  });

  it('navigates to login after logged-in → logged-out on a protected URL', async () => {
    const currentUser = signal<unknown>({ id: 'u1' });
    const navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthRedirectorService,
        { provide: AuthService, useValue: { currentUser } },
        { provide: Router, useValue: { url: '/app/dashboard', navigateByUrl } },
      ],
    });

    const svc = TestBed.inject(AuthRedirectorService);
    svc.start();
    TestBed.tick();

    currentUser.set(null);
    TestBed.tick();

    expect(navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('does not navigate when logging out on guest markets', async () => {
    const currentUser = signal<unknown>({ id: 'u1' });
    const navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthRedirectorService,
        { provide: AuthService, useValue: { currentUser } },
        { provide: Router, useValue: { url: '/app/markets', navigateByUrl } },
      ],
    });

    const svc = TestBed.inject(AuthRedirectorService);
    svc.start();
    TestBed.tick();

    currentUser.set(null);
    TestBed.tick();

    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
