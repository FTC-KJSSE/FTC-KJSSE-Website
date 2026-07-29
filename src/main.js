/**
 * app.js
 * Main entry point - imports all modules and initializes the application.
 */

import { initCounterAnimation, initEventGallery, initScrollReveal } from './components/hero/effects.js';
import { initTickerTape } from './components/ticker/ticker-tape.js';
import { initAccordion, initMobileMenu, initNavbar, initScrollSpy, initSmoothScroll, initTeamFilter } from './components/navbar/navigation.js';

// ─── Initialize Everything ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Navigation
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initScrollSpy();
  initAccordion();
  initTeamFilter();

  // Animations & Gallery
  initScrollReveal();
  initCounterAnimation();
  initEventGallery();

  // Live ticker (async - doesn't block the rest)
  initTickerTape();

  console.log(
    '%c FTC KJSSE %c Finance & Tech Council ',
    'background: #00c853; color: #0a0f1a; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
    'background: #1a2332; color: #e8eaed; padding: 4px 8px; border-radius: 0 4px 4px 0;'
  );
});
