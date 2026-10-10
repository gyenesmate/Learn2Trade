import { describe, expect, it } from 'vitest';
import {
  APP_LANGUAGE_CODES,
  APP_LANGUAGES,
  I18N_DEFAULT_LANG,
  isLanguageCode,
  languageMeta,
} from './i18n.config';

describe('i18n.config', () => {
  it('exposes en/hu/de with native names and intl locales', () => {
    expect([...APP_LANGUAGE_CODES]).toEqual(['en', 'hu', 'de']);
    expect(I18N_DEFAULT_LANG).toBe('en');
    expect(APP_LANGUAGES.map((l) => l.nativeName)).toEqual(['English', 'Magyar', 'Deutsch']);
    expect(languageMeta('hu').intlLocale).toBe('hu-HU');
    expect(isLanguageCode('de')).toBe(true);
    expect(isLanguageCode('fr')).toBe(false);
  });
});
