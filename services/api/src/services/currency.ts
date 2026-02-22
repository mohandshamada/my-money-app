import axios from 'axios';

// 50+ most used currencies with symbols and names
export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  // Americas
  USD: { symbol: '$', name: 'US Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  ARS: { symbol: 'AR$', name: 'Argentine Peso' },
  CLP: { symbol: 'CLP$', name: 'Chilean Peso' },
  COP: { symbol: 'COL$', name: 'Colombian Peso' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol' },
  
  // Europe
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint' },
  RON: { symbol: 'lei', name: 'Romanian Leu' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  UAH: { symbol: '₴', name: 'Ukrainian Hryvnia' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  
  // Asia
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  PHP: { symbol: '₱', name: 'Philippine Peso' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka' },
  LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee' },
  NPR: { symbol: 'रू', name: 'Nepalese Rupee' },
  
  // Middle East
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' },
  QAR: { symbol: 'QR', name: 'Qatari Riyal' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  BHD: { symbol: '.د.ب', name: 'Bahraini Dinar' },
  OMR: { symbol: 'ر.ع.', name: 'Omani Rial' },
  ILS: { symbol: '₪', name: 'Israeli Shekel' },
  JOD: { symbol: 'د.ا', name: 'Jordanian Dinar' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
  
  // Africa
  ZAR: { symbol: 'R', name: 'South African Rand' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
  ETD: { symbol: 'Br', name: 'Ethiopian Birr' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham' },
  TND: { symbol: 'د.ت', name: 'Tunisian Dinar' },
  
  // Oceania
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  FJD: { symbol: 'FJ$', name: 'Fijian Dollar' },
  
  // Others
  XOF: { symbol: 'CFA', name: 'West African CFA' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA' },
};

let cachedRates: any = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(base: string = 'USD'): Promise<Record<string, number>> {
  if (cachedRates && cachedRates.base === base && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates;
  }

  try {
    const res = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
    cachedRates = {
      base,
      rates: res.data.rates,
      timestamp: Date.now(),
    };
    return cachedRates.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return getFallbackRates(base);
  }
}

function getFallbackRates(base: string): Record<string, number> {
  const usdRates: Record<string, number> = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.24,
    INR: 83.12, AUD: 1.53, CAD: 1.36, CHF: 0.88, HKD: 7.82,
    SGD: 1.34, SEK: 10.42, KRW: 1325, MXN: 17.15, NZD: 1.64,
    BRL: 4.97, ZAR: 18.65, RUB: 92.5, TRY: 32.15, AED: 3.67,
    SAR: 3.75, NGN: 1550, KES: 153.5, GHS: 12.45, EGP: 30.9,
    THB: 35.8, IDR: 15650, MYR: 4.72, PHP: 56.2, VND: 24500,
    PLN: 4.02, NOK: 10.65, DKK: 6.88, CZK: 23.15, HUF: 358.5,
    ILS: 3.67, CLP: 925, COP: 3950, PEN: 3.72, PKR: 278.5,
    BDT: 110.25, UAH: 37.45, TWD: 31.8, QAR: 3.64, KWD: 0.31,
    BHD: 0.38, OMR: 0.39, JOD: 0.71, MAD: 10.0, TND: 3.15,
  };

  if (base === 'USD') return usdRates;
  
  const baseRate = usdRates[base] || 1;
  const converted: Record<string, number> = {};
  
  for (const [currency, rate] of Object.entries(usdRates)) {
    converted[currency] = rate / baseRate;
  }
  
  return converted;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  const currencyInfo = CURRENCIES[currency] || { symbol: currency, name: currency };
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol || currency;
}

export function getCurrencyList(): Array<{ code: string; symbol: string; name: string }> {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    name: info.name,
  }));
}