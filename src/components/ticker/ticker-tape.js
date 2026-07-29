/**
 * ticker-tape.js
 * Renders and refreshes the market ticker tape.
 */

import { fetchTickerData, getDefaultTickerData } from './finance-api.js';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export async function initTickerTape() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  updateTickerDOM(track, getDefaultTickerData());

  try {
    const tickerData = await fetchTickerData();
    if (tickerData?.length) updateTickerDOM(track, tickerData);
  } catch (err) {
    console.warn('Ticker tape live fetch failed, using defaults:', err.message);
  }

  setInterval(() => refreshTicker(track), REFRESH_INTERVAL_MS);
}

async function refreshTicker(track) {
  try {
    const tickerData = await fetchTickerData();
    if (tickerData?.length) updateTickerDOM(track, tickerData);
  } catch (err) {
    console.warn('Ticker refresh failed:', err.message);
  }
}

function updateTickerDOM(track, data) {
  // Two identical sets create the seamless scroll loop.
  track.replaceChildren(createTickerSet(data), createTickerSet(data));
}

function createTickerSet(data) {
  const fragment = document.createDocumentFragment();

  data.forEach((item) => {
    fragment.appendChild(createTickerItem(item));
    fragment.appendChild(createSeparator());
  });

  return fragment;
}

function createTickerItem(item) {
  const wrapper = document.createElement('div');
  const direction = item.direction === 'down' ? 'down' : 'up';
  wrapper.className = 'ticker-item';

  const name = document.createElement('span');
  name.className = 'ticker-name';
  name.textContent = item.name;

  const price = document.createElement('span');
  price.className = 'ticker-price';
  price.textContent = item.price;

  const change = document.createElement('span');
  change.className = `ticker-change ${direction}`;
  change.textContent = item.change;

  wrapper.append(name, price, change);
  return wrapper;
}

function createSeparator() {
  const separator = document.createElement('span');
  separator.className = 'ticker-separator';
  separator.textContent = '│';
  return separator;
}
