/**
 * finance-api.js
 * Handles all external finance data fetching.
 * Fetches real NSE listed stocks and indices via Yahoo Finance (with CORS proxy & instant fallback).
 */

// ─── Configuration ───────────────────────────────────────────────
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Real NSE Listed Companies & Indices
export const DEFAULT_NSE_TICKERS = [
  { name: 'NIFTY 50', symbol: '^NSEI', price: 24750.50, changePercent: 0.45 },
  { name: 'SENSEX', symbol: '^BSESN', price: 81400.20, changePercent: 0.38 },
  { name: 'RELIANCE', symbol: 'RELIANCE.NS', price: 3120.40, changePercent: 0.85 },
  { name: 'TCS', symbol: 'TCS.NS', price: 4280.15, changePercent: -0.32 },
  { name: 'HDFCBANK', symbol: 'HDFCBANK.NS', price: 1650.80, changePercent: 0.62 },
  { name: 'INFY', symbol: 'INFY.NS', price: 1845.20, changePercent: 1.15 },
  { name: 'ICICIBANK', symbol: 'ICICIBANK.NS', price: 1210.50, changePercent: 0.40 },
  { name: 'TATAMOTORS', symbol: 'TATAMOTORS.NS', price: 1015.30, changePercent: -0.75 },
  { name: 'SBIN', symbol: 'SBIN.NS', price: 845.60, changePercent: 0.55 },
  { name: 'BHARTIARTL', symbol: 'BHARTIARTL.NS', price: 1480.00, changePercent: 1.05 },
  { name: 'ITC', symbol: 'ITC.NS', price: 495.25, changePercent: -0.15 },
  { name: 'L&T', symbol: 'LT.NS', price: 3620.10, changePercent: 0.90 }
];

// Cache to avoid excessive API calls (5 min TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

/**
 * Format a number as Indian-style currency (e.g., 24,750.50)
 */
export function formatINR(num, decimals = 2) {
  if (num == null || isNaN(num)) return '-';
  const [whole, frac] = num.toFixed(decimals).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (grouped ? grouped + ',' : '') + lastThree + (frac ? '.' + frac : '');
}

// ─── Ticker Tape Data (NSE Listed Companies) ─────────────────────────

/**
 * Get ticker items array formatted for continuous ticker tape.
 */
export function formatTickerItem(name, price, changePercent) {
  const arrow = changeArrow(changePercent);
  const sign = changePercent >= 0 ? '+' : '';
  return {
    name: name,
    price: `₹${formatINR(price)}`,
    change: `${arrow} ${sign}${changePercent.toFixed(2)}%`,
    direction: changeClass(changePercent),
  };
}

/**
 * Returns instant default list of real NSE listed companies.
 */
export function getDefaultTickerData() {
  return DEFAULT_NSE_TICKERS.map(item =>
    formatTickerItem(item.name, item.price, item.changePercent)
  );
}

/**
 * Fetch live data for real NSE listed companies in parallel.
 */
export async function fetchTickerData() {
  const promises = DEFAULT_NSE_TICKERS.map(async (stock) => {
    try {
      const data = await fetchYahooQuote(stock.symbol);
      return formatTickerItem(stock.name, data.price, data.changePercent);
    } catch {
      return formatTickerItem(stock.name, stock.price, stock.changePercent);
    }
  });

  const results = await Promise.all(promises);
  return results;
}


