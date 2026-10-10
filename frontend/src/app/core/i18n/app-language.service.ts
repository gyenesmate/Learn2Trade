import { Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';
import {
  APP_LANGUAGES,
  I18N_DEFAULT_LANG,
  I18N_STORAGE_KEY,
  isLanguageCode,
  languageMeta,
} from './i18n.config';
import { LanguageCode } from './i18n.types';
import { setNumberLocale } from '@core/utils/number.util';

@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  private readonly langSignal = signal<LanguageCode>(I18N_DEFAULT_LANG);

  readonly languages = APP_LANGUAGES;
  readonly currentLang = this.langSignal.asReadonly();
  readonly currentCode = computed(() => this.langSignal().toUpperCase());
  readonly intlLocale = computed(() => languageMeta(this.langSignal()).intlLocale);

  /** Read persisted language or default. Does not call `use()`. */
  readStoredLang(): LanguageCode {
    try {
      const raw = localStorage.getItem(I18N_STORAGE_KEY);
      if (isLanguageCode(raw)) return raw;
    } catch {
      // private mode / blocked storage
    }
    return I18N_DEFAULT_LANG;
  }

  /** Apply language, persist, sync `document.lang` and number formatters. */
  use(lang: LanguageCode): Observable<unknown> {
    return this.translate.use(lang).pipe(
      tap(() => {
        this.langSignal.set(lang);
        this.persist(lang);
        this.document.documentElement.lang = lang;
        setNumberLocale(languageMeta(lang).intlLocale);
      })
    );
  }

  /** Sync signal after external `TranslateService.use` (e.g. initializer). */
  syncFromTranslate(lang: LanguageCode): void {
    this.langSignal.set(lang);
    this.document.documentElement.lang = lang;
    setNumberLocale(languageMeta(lang).intlLocale);
  }

  private persist(lang: LanguageCode): void {
    try {
      localStorage.setItem(I18N_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }
}
