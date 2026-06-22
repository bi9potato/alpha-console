export const CURRENCY_META = {
  USD: { name: '美元', region: '美国', symbol: '$' },
  CNY: { name: '人民币', region: '中国', symbol: '¥' },
  EUR: { name: '欧元', region: '欧元区', symbol: '€' },
  JPY: { name: '日元', region: '日本', symbol: '¥' },
  GBP: { name: '英镑', region: '英国', symbol: '£' },
  HKD: { name: '港币', region: '中国香港', symbol: 'HK$' },
  CHF: { name: '瑞郎', region: '瑞士', symbol: 'CHF' },
  AUD: { name: '澳元', region: '澳大利亚', symbol: 'A$' },
  CAD: { name: '加元', region: '加拿大', symbol: 'C$' },
  SGD: { name: '新加坡元', region: '新加坡', symbol: 'S$' }
};

export const DEFAULT_PAIRS = [
  { base: 'USD', quote: 'CNY', alertAbove: 7.35, alertBelow: 7.05 },
  { base: 'EUR', quote: 'USD', alertAbove: 1.12, alertBelow: 1.06 },
  { base: 'USD', quote: 'JPY', alertAbove: 165, alertBelow: 150 },
  { base: 'GBP', quote: 'USD', alertAbove: 1.33, alertBelow: 1.24 },
  { base: 'USD', quote: 'HKD', alertAbove: 7.86, alertBelow: 7.75 },
  { base: 'AUD', quote: 'USD', alertAbove: 0.69, alertBelow: 0.63 }
];

const FALLBACK_RATES = {
  USD: { CNY: 7.2519, JPY: 159.82, HKD: 7.8114, CHF: 0.8931, CAD: 1.3682, SGD: 1.3526 },
  EUR: { USD: 1.0837, CNY: 7.8589, JPY: 173.21, GBP: 0.8462 },
  GBP: { USD: 1.2808, CNY: 9.2874, EUR: 1.1818 },
  AUD: { USD: 0.6644, CNY: 4.8178, JPY: 106.18 }
};

export function formatPair(pair) {
  return `${pair.base}/${pair.quote}`;
}

export function getFallbackRate(base, quote) {
  if (base === quote) return 1;
  const direct = FALLBACK_RATES[base]?.[quote];
  if (direct) return direct;
  const inverse = FALLBACK_RATES[quote]?.[base];
  if (inverse) return 1 / inverse;
  return null;
}

export function calcChange(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function getAlertState(rate, pair) {
  if (typeof rate !== 'number') return { level: 'unknown', label: '等待数据' };
  if (pair.alertAbove && rate >= pair.alertAbove) return { level: 'danger', label: `突破上限 ${pair.alertAbove}` };
  if (pair.alertBelow && rate <= pair.alertBelow) return { level: 'warning', label: `跌破下限 ${pair.alertBelow}` };
  return { level: 'normal', label: '区间内' };
}

export async function fetchRate(base, quote, fetchImpl = fetch) {
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`;
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`汇率接口返回 ${response.status}`);
  const data = await response.json();
  const rate = data?.rates?.[quote];
  if (typeof rate !== 'number') throw new Error(`未找到 ${base}/${quote} 汇率`);
  return { rate, date: data.date, source: 'Frankfurter' };
}
