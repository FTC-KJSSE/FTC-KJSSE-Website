/**
 * pdf-modal.js
 * Fullscreen PDF viewer popup used by the Research & Readings tiles.
 *
 * Anything carrying a `data-pdf` attribute opens its file in here instead of
 * navigating away: a dark scrim, a panel with the document's title and a
 * download button, and the file embedded in an <object> that falls back to a
 * plain link on browsers (mostly mobile) that can't render PDFs inline.
 *
 * The panel is a wide reading pane rather than a whole-page thumbnail. The
 * file is opened with `#view=FitH` so the page fills the panel's width and
 * scrolls, which keeps body text at a readable size.
 */

/** How long the close animation runs before the panel is torn down. */
const CLOSE_MS = 200;

/**
 * Viewer open parameter asking for a page scaled to the width it is given.
 * Ignored by viewers that don't support it, which fall back to their own
 * default zoom.
 */
const FIT_WIDTH = '#view=FitH';

/** Below this width an embedded page is too small to read anyway. */
const EMBED_MIN_WIDTH = 700;

/**
 * Whether this browser will actually *render* a PDF inside an <object>.
 *
 * The <object> fallback can't be relied on here: phone browsers hand the file
 * to a native handler and report the element as loaded, so the fallback never
 * runs and the panel just sits there empty. These have to be ruled out before
 * the element is created rather than after it fails.
 */
function canEmbedPdf() {
  // Spec'd property; false on iOS Safari and Android Chrome.
  if (navigator.pdfViewerEnabled === false) return false;
  // Touch-primary devices that claim support still render a single unscrollable
  // page, so the OS viewer is the better destination.
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return window.innerWidth >= EMBED_MIN_WIDTH;
}

let modal = null;
let panel = null;
let titleEl = null;
let downloadEl = null;
let closeBtn = null;
let viewerSlot = null;

let lastFocused = null;
let closeTimer = null;

// ─── URL helper ──────────────────────────────────────────────────

/**
 * Encode the path segments of a site-relative URL. The research files live
 * under folders with spaces and an ampersand in their names, which <object>
 * and <a href> each handle differently unless they are escaped.
 */
function encodePdfUrl(raw) {
  const [path, ...rest] = raw.split('?');
  const encoded = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return rest.length ? `${encoded}?${rest.join('?')}` : encoded;
}

// ─── Modal construction ──────────────────────────────────────────

const DOWNLOAD_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

const CLOSE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function buildModal() {
  modal = document.createElement('div');
  modal.className = 'pdf-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'pdf-modal-title');
  modal.hidden = true;

  modal.innerHTML = `
    <div class="pdf-modal-panel">
      <div class="pdf-modal-header">
        <span class="pdf-modal-title" id="pdf-modal-title"></span>
        <div class="pdf-modal-actions">
          <a class="pdf-modal-download" href="#" download>${DOWNLOAD_ICON}<span>Download</span></a>
          <button class="pdf-modal-close" type="button" aria-label="Close document">${CLOSE_ICON}</button>
        </div>
      </div>
      <div class="pdf-modal-viewer"></div>
    </div>
  `;

  panel = modal.querySelector('.pdf-modal-panel');
  titleEl = modal.querySelector('.pdf-modal-title');
  downloadEl = modal.querySelector('.pdf-modal-download');
  closeBtn = modal.querySelector('.pdf-modal-close');
  viewerSlot = modal.querySelector('.pdf-modal-viewer');

  // Clicking the scrim itself (not the panel) dismisses.
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closePdf();
  });
  closeBtn.addEventListener('click', closePdf);
  modal.addEventListener('keydown', onKeydown);

  document.body.appendChild(modal);
}

const FILE_ICON = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

/**
 * Swap in a fresh viewer for each file. Reusing one <object> and reassigning
 * `data` leaves some browsers showing the previously loaded document.
 *
 * Where the page can't be embedded the panel shrinks to a small card offering
 * the file, instead of stretching an empty grey box down the whole screen.
 */
function mountViewer(safeUrl, title) {
  if (canEmbedPdf()) {
    panel.classList.remove('is-handoff');
    viewerSlot.innerHTML = `
      <object data="${safeUrl}${FIT_WIDTH}" type="application/pdf" title="${title}"></object>
    `;
    return;
  }

  panel.classList.add('is-handoff');
  viewerSlot.innerHTML = `
    <div class="pdf-modal-handoff">
      <span class="pdf-modal-handoff-icon">${FILE_ICON}</span>
      <p class="pdf-modal-handoff-title">${title}</p>
      <p class="pdf-modal-handoff-note">Your browser opens PDFs in its own reader rather than inside the page.</p>
      <a class="pdf-modal-handoff-action" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open document</a>
    </div>
  `;
}

// ─── Scroll lock ─────────────────────────────────────────────────

function lockScroll() {
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-gap', `${gap}px`);
  document.body.classList.add('pdf-modal-open');
}

function unlockScroll() {
  document.body.classList.remove('pdf-modal-open');
  document.documentElement.style.removeProperty('--scrollbar-gap');
}

// ─── Keyboard ────────────────────────────────────────────────────

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closePdf();
    return;
  }

  if (event.key !== 'Tab') return;

  // Only the header controls are reachable, so keep Tab cycling between them
  // rather than letting focus wander back into the page behind the scrim.
  const first = downloadEl;
  const last = closeBtn;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// ─── Open / close ────────────────────────────────────────────────

export function openPdf({ url, title, fileName }) {
  if (!modal) buildModal();
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  const safeUrl = encodePdfUrl(url);
  const displayTitle = title || 'Document';
  const download =
    fileName || decodeURIComponent(url.split('?')[0].split('/').pop() || 'document.pdf');

  titleEl.textContent = displayTitle;
  downloadEl.href = safeUrl;
  downloadEl.setAttribute('download', download);
  mountViewer(safeUrl, displayTitle);

  lastFocused = document.activeElement;
  lockScroll();

  modal.hidden = false;
  // Let the browser paint the hidden-to-shown swap before the transition class
  // lands, otherwise the fade and scale are skipped.
  requestAnimationFrame(() => modal.classList.add('is-open'));

  closeBtn.focus();
}

export function closePdf() {
  if (!modal || modal.hidden) return;

  modal.classList.remove('is-open');

  closeTimer = setTimeout(() => {
    modal.hidden = true;
    // Drop the embed so the file stops occupying memory while closed.
    viewerSlot.innerHTML = '';
    panel.classList.remove('is-handoff');
    unlockScroll();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
    closeTimer = null;
  }, CLOSE_MS);
}

// ─── Wiring ──────────────────────────────────────────────────────

export function initPdfModal() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-pdf]');
    if (!trigger) return;

    event.preventDefault();
    openPdf({
      url: trigger.dataset.pdf,
      title: trigger.dataset.pdfTitle,
      fileName: trigger.dataset.pdfFile,
    });
  });
}
