import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AuthRedirectorService } from '@core/services/auth-redirector.service';
import { AuthService } from '@core/services/auth.service';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { initializeApp } from './app.initializer';

describe('initializeApp', () => {
  it('does not resolve until auth.bootstrap settles, then starts alerts and redirector', async () => {
    let resolveBootstrap!: () => void;
    const bootstrapDone = new Promise<void>((resolve) => {
      resolveBootstrap = resolve;
    });
    const bootstrap = vi.fn(() => bootstrapDone);
    const startAlerts = vi.fn();
    const startRedirector = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { bootstrap } },
        { provide: PriceAlertsService, useValue: { start: startAlerts } },
        { provide: AuthRedirectorService, useValue: { start: startRedirector } },
      ],
    });

    const pending = runInInjectionContext(TestBed.inject(Injector), () => initializeApp());

    expect(bootstrap).toHaveBeenCalledOnce();
    expect(startAlerts).not.toHaveBeenCalled();
    expect(startRedirector).not.toHaveBeenCalled();

    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveBootstrap();
    await pending;
    expect(settled).toBe(true);
    expect(startAlerts).toHaveBeenCalledOnce();
    expect(startRedirector).toHaveBeenCalledOnce();
  });
});
