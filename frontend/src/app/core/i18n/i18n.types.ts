/** Supported UI language codes. */
export type LanguageCode = 'en' | 'hu' | 'de';

export interface AppLanguage {
  readonly code: LanguageCode;
  /** Native endonym shown in the language menu (English, Magyar, Deutsch). */
  readonly nativeName: string;
  /** BCP 47 tag for `Intl` / Angular locale pipes. */
  readonly intlLocale: string;
}
