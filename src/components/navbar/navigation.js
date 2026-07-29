/**
 * navigation.js
 * Navbar scroll effects, mobile menu toggle, smooth scrolling,
 * and past-council accordion.
 */

// ─── Navbar Scroll Effect ────────────────────────────────────────

export function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial check (in case page loads scrolled)
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}

// ─── Mobile Menu Toggle ──────────────────────────────────────────

export function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  // Close menu when a link is clicked
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ─── Scroll Spy for Floating Pill Navbar ─────────────────────────

export function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  function updateActiveLink() {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href')?.replace('#', '');
      if (href === currentSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}

// ─── Smooth Scroll for Anchor Links ──────────────────────────────

export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = document.getElementById('navbar')?.offsetHeight || 60;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });
}

// ─── Past Council Accordion ──────────────────────────────────────

export function initAccordion() {
  const headers = document.querySelectorAll('.council-year-header');

  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const parent = header.closest('.council-year');
      if (!parent) return;

      // Toggle the clicked item
      const isActive = parent.classList.contains('active');

      // Close all (optional - remove this loop for multi-open accordion)
      document.querySelectorAll('.council-year').forEach((item) => {
        item.classList.remove('active');
      });

      // Open clicked if it was closed
      if (!isActive) {
        parent.classList.add('active');
      }
    });
  });
}

// ─── Team Domain Tabs Filter ─────────────────────────────────────

export function initTeamFilter() {
  const tabs = document.querySelectorAll('.team-tab');
  const groups = document.querySelectorAll('.team-group');
  if (!tabs.length || !groups.length) return;

  function applyFilter(filter) {
    groups.forEach((group) => {
      const category = group.getAttribute('data-category') || '';
      if (category === filter) {
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter') || 'all';
      applyFilter(filter);
    });
  });

  // Apply initial active tab filter on load
  const initialActiveTab = document.querySelector('.team-tab.active');
  const initialFilter = initialActiveTab ? initialActiveTab.getAttribute('data-filter') : 'all';
  applyFilter(initialFilter);
}

// ─── Past Council 3D Card Flip ─────────────────────────────────

export function initCouncilFlip() {
  document.querySelectorAll('.council-member-mini').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.social-link')) return;
      card.classList.toggle('flipped');
    });
  });
}
