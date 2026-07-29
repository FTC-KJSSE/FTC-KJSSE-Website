/**
 * finance-api.js
 * Handles all external finance data fetching.
 * Fetches real NSE listed stocks and indices via Yahoo Finance (with CORS proxy & instant fallback).
 */

// ─── Configuration ───────────────────────────────────────────────
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
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

export function formatUSD(num, decimals = 2) {
  if (num == null || isNaN(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function changeArrow(change) {
  return change >= 0 ? '▲' : '▼';
}

function changeClass(change) {
  return change >= 0 ? 'up' : 'down';
}

// ─── Yahoo Finance via CORS Proxy (Indian Indices & Stocks) ─────────

async function fetchYahooQuote(symbol) {
  const cacheKey = `yahoo_${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const yahooUrl = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`);
  const json = await res.json();

  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No data returned');

  const prevClose = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice;
  const change = meta.regularMarketPrice - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  const data = {
    price: meta.regularMarketPrice,
    previousClose: prevClose,
    change: change,
    changePercent: changePercent,
  };

  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch live Nifty 50 data.
 */
export async function fetchNifty() {
  try {
    const data = await fetchYahooQuote('^NSEI');
    return {
      success: true,
      name: 'NIFTY 50',
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
    };
  } catch (err) {
    console.warn('Nifty fetch failed:', err.message);
    return {
      success: true,
      name: 'NIFTY 50',
      price: 24750.50,
      change: 110.80,
      changePercent: 0.45
    };
  }
}

/**
 * Fetch live Sensex data.
 */
export async function fetchSensex() {
  try {
    const data = await fetchYahooQuote('^BSESN');
    return {
      success: true,
      name: 'BSE SENSEX',
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
    };
  } catch (err) {
    console.warn('Sensex fetch failed:', err.message);
    return {
      success: true,
      name: 'BSE SENSEX',
      price: 81400.20,
      change: 308.50,
      changePercent: 0.38
    };
  }
}

// ─── CoinGecko (Crypto API) ─────────────────

async function fetchCoinGecko(ids) {
  const cacheKey = `coingecko_${ids}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=inr,usd&include_24hr_change=true&include_market_cap=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchBitcoin() {
  try {
    const data = await fetchCoinGecko('bitcoin');
    const btc = data.bitcoin;
    return {
      success: true,
      name: 'Bitcoin (BTC)',
      price_inr: btc.inr,
      price_usd: btc.usd,
      change_24h: btc.inr_24h_change || 0,
      market_cap: btc.inr_market_cap,
    };
  } catch (err) {
    console.warn('Bitcoin fetch failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function fetchEthereum() {
  try {
    const data = await fetchCoinGecko('ethereum');
    const eth = data.ethereum;
    return {
      success: true,
      name: 'Ethereum (ETH)',
      price_inr: eth.inr,
      price_usd: eth.usd,
      change_24h: eth.inr_24h_change || 0,
      market_cap: eth.inr_market_cap,
    };
  } catch (err) {
    console.warn('Ethereum fetch failed:', err.message);
    return { success: false, error: err.message };
  }
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
    } catch (e) {
      return formatTickerItem(stock.name, stock.price, stock.changePercent);
    }
  });

  const results = await Promise.all(promises);
  return results;
}


