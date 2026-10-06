import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { routes } from './app.routes';
import { authInterceptor } from '@core/services/auth.interceptor';
import { AuthService } from '@core/services/auth.service';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { GLOBAL_SEARCH_PROVIDERS } from '@core/search/search.types';
import { NavigationSearchProvider } from '@core/search/providers/navigation-search.provider';
import { MarketSearchProvider } from '@features/markets/search/market-search.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(async () => {
      // inject() must run before any await — the continuation is not an injection context.
      const auth = inject(AuthService);
      const priceAlerts = inject(PriceAlertsService);
      await auth.bootstrap();
      priceAlerts.start();
    }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'always' },
    },
    NavigationSearchProvider,
    MarketSearchProvider,
    { provide: GLOBAL_SEARCH_PROVIDERS, useExisting: NavigationSearchProvider, multi: true },
    { provide: GLOBAL_SEARCH_PROVIDERS, useExisting: MarketSearchProvider, multi: true },
  ],
};
