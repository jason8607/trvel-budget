import { useState, useEffect, useCallback } from 'react';

const API_URL = 'https://open.er-api.com/v6/latest/TWD';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_TTL = 1000 * 60 * 60;

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

const FALLBACK_RATES: Record<string, number> = {
  TWD: 1,
  JPY: 0.215,
  USD: 32.5,
  KRW: 0.024,
};

function loadCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached;
  } catch { /* ignore */ }
  return null;
}

function saveCachedRates(rates: Record<string, number>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
}

/**
 * API returns "1 TWD = X other currency",
 * so to convert foreign amount -> TWD we do: amount / rate
 */
function buildToTWDRates(apiRates: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { TWD: 1 };
  for (const code of Object.keys(FALLBACK_RATES)) {
    if (code === 'TWD') continue;
    const r = apiRates[code];
    if (r && r > 0) {
      result[code] = 1 / r;
    }
  }
  return result;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const cached = loadCachedRates();
    return cached ? cached.rates : FALLBACK_RATES;
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    const cached = loadCachedRates();
    return cached ? new Date(cached.fetchedAt).toLocaleString('zh-TW') : null;
  });

  useEffect(() => {
    const cached = loadCachedRates();
    if (cached) return;

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
          const converted = buildToTWDRates(data.rates);
          setRates(converted);
          saveCachedRates(converted);
          setLastUpdated(new Date().toLocaleString('zh-TW'));
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const toTWD = useCallback(
    (amount: number, currency: string): number => {
      const rate = rates[currency] ?? 1;
      return Math.round(amount * rate);
    },
    [rates],
  );

  return { rates, toTWD, lastUpdated };
}
