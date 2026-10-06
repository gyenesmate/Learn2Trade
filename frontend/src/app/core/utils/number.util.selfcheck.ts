import {
  formatDecimal,
  formatMoney,
  formatPct,
  formatPrice,
  formatSignedMoney,
  toNumber,
} from './number.util';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(toNumber('12.5') === 12.5, 'toNumber string');
assert(formatDecimal(12.5) === '12.50', 'formatDecimal');
assert(formatMoney(12.5) === '$12.50', 'formatMoney');
assert(formatPrice(0.001234).includes('0.001234'), 'formatPrice small');
assert(formatPct(1.2) === '+1.20%', 'formatPct positive');
assert(formatPct(0) === '0.00%', 'formatPct zero');
assert(formatSignedMoney(-3) === '-$3.00', 'formatSignedMoney negative');

console.log('number.util self-check ok');
