import { inject } from '@angular/core';
import { AuthRedirectorService } from '@core/services/auth-redirector.service';
import { AuthService } from '@core/services/auth.service';
import { PriceAlertsService } from '@core/services/price-alerts.service';

/**
 * App bootstrap work that must finish before first navigation.
 * Sync function: `inject()` runs inside `provideAppInitializer`'s injection context;
 * the returned Promise is what Angular awaits before creating the root component.
 */
export function initializeApp(): Promise<void> {
  const auth = inject(AuthService);
  const priceAlerts = inject(PriceAlertsService);
  const authRedirector = inject(AuthRedirectorService);
  return auth.bootstrap().then(() => {
    priceAlerts.start();
    authRedirector.start();
  });
}
