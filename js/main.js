// Account Caddie — interactions: nav scroll state, mobile menu, scroll reveal

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // nav scrolled state
  const nav = document.getElementById('siteNav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // dark/light mode toggle (theme is pre-set before paint by the inline
  // head script — this just wires up the button and persists the choice)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ac-theme', next);
    });
  }

  // currency switcher (pricing page)
  // Rates are ZAR per 1 unit of currency — indicative, updated 2026.
  const FX_RATES = { ZAR: 1, USD: 18.5, GBP: 23.5, CAD: 13.5 };
  const FX_SYMBOLS = { ZAR: 'R', USD: '$', GBP: '£', CAD: 'CA$' };
  const currencySwitch = document.getElementById('currencySwitch');
  const amountEls = document.querySelectorAll('.amount[data-zar]');

  function formatAmount(zarValue, currency) {
    const rate = FX_RATES[currency] || 1;
    const converted = zarValue / rate;
    const rounded = currency === 'ZAR'
      ? Math.round(converted / 5) * 5   // keep ZAR figures on clean R5 increments
      : Math.round(converted);
    return FX_SYMBOLS[currency] + rounded.toLocaleString('en-US');
  }

  function applyCurrency(currency) {
    amountEls.forEach(el => {
      const zar = parseFloat(el.getAttribute('data-zar'));
      if (!isNaN(zar)) el.textContent = formatAmount(zar, currency);
    });
  }

  if (currencySwitch && amountEls.length) {
    currencySwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('.currency-btn');
      if (!btn) return;
      currencySwitch.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyCurrency(btn.dataset.currency);
    });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal, .service-card, .step, .tier-card, .faq-item, .leader-row');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => io.observe(el));
  }

  // parallax media — translates each [data-parallax] layer against scroll
  // position, gated behind an IntersectionObserver so only sections
  // actually on screen do any work.
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !prefersReduced) {
    const active = new Set();
    let ticking = false;

    function updateParallax() {
      active.forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const offset = (rect.top - (window.innerHeight - rect.height) / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    }
    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    const parallaxIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) active.add(entry.target);
        else active.delete(entry.target);
      });
      requestTick();
    }, { rootMargin: '20% 0px' });

    parallaxEls.forEach(el => parallaxIo.observe(el));
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
  }
});
