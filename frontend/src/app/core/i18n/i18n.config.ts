import { AppLanguage, LanguageCode } from './i18n.types';

export const I18N_STORAGE_KEY = 'l2t.language';
export const I18N_DEFAULT_LANG: LanguageCode = 'en';
export const I18N_FALLBACK_LANG: LanguageCode = 'en';
export const I18N_HTTP_PREFIX = '/i18n/';
export const I18N_HTTP_SUFFIX = '.json';

export const APP_LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', nativeName: 'English', intlLocale: 'en-US' },
  { code: 'hu', nativeName: 'Magyar', intlLocale: 'hu-HU' },
  { code: 'de', nativeName: 'Deutsch', intlLocale: 'de-DE' },
] as const;

export const APP_LANGUAGE_CODES: readonly LanguageCode[] = APP_LANGUAGES.map((l) => l.code);

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return value === 'en' || value === 'hu' || value === 'de';
}

export function languageMeta(code: LanguageCode): AppLanguage {
  return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES[0];
}
