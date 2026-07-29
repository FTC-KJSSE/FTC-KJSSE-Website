/**
 * effects.js
 * Scroll reveal and stat counter animations.
 */

// ─── Scroll Reveal (IntersectionObserver) ────────────────────────

export function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing once revealed (one-shot animation)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// ─── Event Photo Gallery Slider ──────────────────────────────────

export function initEventGallery() {
  const gallery = document.getElementById('finnovatex-gallery');
  if (!gallery) return;

  const slides = gallery.querySelectorAll('.event-gallery-slide');
  const btns = gallery.querySelectorAll('.event-thumb-btn');
  if (!slides.length || !btns.length) return;

  let currentIndex = 0;
  let autoTimer = null;

  function showSlide(index) {
    currentIndex = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    btns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
  }

  btns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showSlide(index);
      resetAutoSlide();
    });
  });

  function startAutoSlide() {
    autoTimer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      showSlide(nextIndex);
    }, 3500);
  }

  function resetAutoSlide() {
    if (autoTimer) clearInterval(autoTimer);
    startAutoSlide();
  }

  startAutoSlide();
}

// ─── Stat Counter Animation ──────────────────────────────────────

export function initCounterAnimation() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  if (!statNumbers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    el.textContent = current + (el.dataset.suffix || '');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target + (el.dataset.suffix || '');
    }
  }

  requestAnimationFrame(update);
}



