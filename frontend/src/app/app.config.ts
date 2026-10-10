import { ApplicationConfig, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideTranslateService, provideMissingTranslationHandler } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { initializeApp } from '@core/initializers/app.initializer';
import { initializeI18n } from '@core/initializers/i18n.initializer';
import { authInterceptor } from '@core/services/auth.interceptor';
import { GLOBAL_SEARCH_PROVIDERS } from '@core/search/search.types';
import { NavigationSearchProvider } from '@core/search/providers/navigation-search.provider';
import { MarketSearchProvider } from '@features/markets/search/market-search.provider';
import {
  I18N_DEFAULT_LANG,
  I18N_FALLBACK_LANG,
  I18N_HTTP_PREFIX,
  I18N_HTTP_SUFFIX,
} from '@core/i18n/i18n.config';
import { AppMissingTranslationHandler } from '@core/i18n/missing-translation.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideTranslateService({
      lang: I18N_DEFAULT_LANG,
      fallbackLang: I18N_FALLBACK_LANG,
      loader: provideTranslateHttpLoader({
        prefix: I18N_HTTP_PREFIX,
        suffix: I18N_HTTP_SUFFIX,
      }),
      missingTranslationHandler: provideMissingTranslationHandler(AppMissingTranslationHandler),
    }),
    provideAppInitializer(() => Promise.all([initializeI18n(), initializeApp()])),
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
