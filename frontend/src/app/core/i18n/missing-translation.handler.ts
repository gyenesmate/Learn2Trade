import { Injectable, isDevMode } from '@angular/core';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';

/** Dev-only warning when a key is missing in selected and fallback catalogs. */
@Injectable()
export class AppMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (isDevMode()) {
      console.warn(`[i18n] Missing translation: ${params.key}`);
    }
    return params.key;
  }
}
