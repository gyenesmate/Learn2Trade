/** Active `Intl` locale; updated by `AppLanguageService` on language change. */
let activeNumberLocale = 'en-US';

export function setNumberLocale(locale: string): void {
  activeNumberLocale = locale || 'en-US';
}

export function getNumberLocale(): string {
  return activeNumberLocale;
}

/** Coerce API decimal values to number (never leave as string). */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toNumber(value);
}

/** USD money for balances / P&L (always 2 fraction digits). Locale from active language. */
export function formatMoney(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(activeNumberLocale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Plain decimal (table `number` columns). Locale from active language. */
export function formatDecimal(value: number, minDigits = 2, maxDigits = 6): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(activeNumberLocale, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

/**
 * Spot price: more digits for sub-$1 alts (trading digit tiers stay fixed).
 * Separators follow the active language locale.
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat(activeNumberLocale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Signed percent, e.g. `+1.25%` / `-0.40%` / `0.00%`. */
export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

/** Signed money for P&L cells. */
export function formatSignedMoney(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value, digits)}`;
}
