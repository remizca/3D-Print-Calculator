import { CURRENCIES, EXCHANGE_RATE_API_URL } from '../constants';
import { Currencies } from '../types';

const CACHE_KEY = 'exchangeRatesCache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface RateCache {
  rates: Currencies;
  lastUpdated: string;
  nextUpdate: number;
}

const buildCurrenciesFromApi = (conversionRates: Record<string, number>): Currencies => {
  const curated: Record<string, { name: string; symbol: string }> = {
    USD: { name: 'US Dollar', symbol: '$' },
    PHP: { name: 'Philippine Peso', symbol: '₱' },
    EUR: { name: 'Euro', symbol: '€' },
    GBP: { name: 'British Pound', symbol: '£' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$' },
    AUD: { name: 'Australian Dollar', symbol: 'A$' },
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    CNY: { name: 'Chinese Yuan', symbol: '¥' },
    INR: { name: 'Indian Rupee', symbol: '₹' },
    KRW: { name: 'South Korean Won', symbol: '₩' },
    BRL: { name: 'Brazilian Real', symbol: 'R$' },
    MXN: { name: 'Mexican Peso', symbol: 'Mex$' },
    CHF: { name: 'Swiss Franc', symbol: 'Fr' },
    SEK: { name: 'Swedish Krona', symbol: 'kr' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
    THB: { name: 'Thai Baht', symbol: '฿' },
    AED: { name: 'UAE Dirham', symbol: 'د.إ' },
    ZAR: { name: 'South African Rand', symbol: 'R' },
    NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  };

  const result: Currencies = {};
  for (const [code, info] of Object.entries(curated)) {
    if (conversionRates[code] !== undefined) {
      result[code] = { name: info.name, symbol: info.symbol, rate: conversionRates[code] };
    }
  }
  return result;
};

export const fetchRates = async (): Promise<{ rates: Currencies; lastUpdated: string | null; isStale: boolean }> => {
  const now = Date.now();
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    try {
      const cache: RateCache = JSON.parse(cached);
      if (cache.nextUpdate > now) {
        return { rates: cache.rates, lastUpdated: cache.lastUpdated, isStale: false };
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const response = await fetch(EXCHANGE_RATE_API_URL);
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    if (data.result !== 'success') throw new Error('API returned error');

    const rates = buildCurrenciesFromApi(data.conversion_rates);
    const lastUpdated = data.time_last_update_utc;
    const nextUpdate = data.time_next_update_unix * 1000;

    const newCache: RateCache = { rates, lastUpdated, nextUpdate };
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));

    return { rates, lastUpdated, isStale: false };
  } catch (error) {
    console.warn('Failed to fetch live exchange rates, using cached or fallback:', error);

    if (cached) {
      try {
        const cache: RateCache = JSON.parse(cached);
        return { rates: cache.rates, lastUpdated: cache.lastUpdated, isStale: true };
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    return { rates: CURRENCIES, lastUpdated: null, isStale: true };
  }
};
