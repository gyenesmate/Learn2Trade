import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AppLanguageService } from '@core/i18n/app-language.service';
import { APP_LANGUAGE_CODES } from '@core/i18n/i18n.config';

/**
 * ngx-translate bootstrap: register langs and load the saved/default catalog
 * before first paint (returns the Promise Angular awaits).
 */
export function initializeI18n(): Promise<unknown> {
  const translate = inject(TranslateService);
  const appLang = inject(AppLanguageService);
  const initial = appLang.readStoredLang();
  translate.addLangs([...APP_LANGUAGE_CODES]);
  return firstValueFrom(translate.use(initial)).then(() => {
    appLang.syncFromTranslate(initial);
  });
}
