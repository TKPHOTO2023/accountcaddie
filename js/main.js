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
  // International package prices are fixed, real monthly rates per currency
  // (set via data-usd/data-gbp/data-cad in pricing.html) — not a currency
  // conversion from the ZAR price. Add-ons have no international rate and
  // stay in ZAR regardless of the selected currency.
  const FX_SYMBOLS = { ZAR: 'R', USD: '$', GBP: '£', CAD: 'CA$' };
  const currencySwitch = document.getElementById('currencySwitch');
  const amountEls = document.querySelectorAll('.amount[data-zar]');
  const periodEls = document.querySelectorAll('.period[data-zar-label]');

  function applyCurrency(currency) {
    const key = currency.toLowerCase();
    amountEls.forEach(el => {
      const raw = currency === 'ZAR' ? el.dataset.zar : el.dataset[key];
      if (!raw) return;
      el.textContent = FX_SYMBOLS[currency] + Number(raw).toLocaleString('en-US');
    });
    periodEls.forEach(el => {
      el.textContent = currency === 'ZAR' ? el.dataset.zarLabel : el.dataset.intlLabel;
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

  // "Start here" get-started modal (pricing page)
  const startModal = document.getElementById('startModal');
  const startTriggers = document.querySelectorAll('.tier-start[data-package]');
  if (startModal && startTriggers.length) {
    const startForm = document.getElementById('startForm');
    const packageField = document.getElementById('startPackageField');
    const packageLabel = document.getElementById('startModalPackage');
    const closeBtn = document.getElementById('startModalClose');
    let lastFocused = null;

    function openStartModal(pkg) {
      packageField.value = pkg;
      packageLabel.textContent = pkg;
      lastFocused = document.activeElement;
      startModal.classList.add('is-open');
      startModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const firstInput = startForm.querySelector('input:not([type="hidden"])');
      if (firstInput) firstInput.focus();
    }
    function closeStartModal() {
      startModal.classList.remove('is-open');
      startModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    startTriggers.forEach(btn => {
      btn.addEventListener('click', () => openStartModal(btn.dataset.package));
    });
    closeBtn.addEventListener('click', closeStartModal);
    startModal.addEventListener('click', (e) => {
      if (e.target === startModal) closeStartModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && startModal.classList.contains('is-open')) closeStartModal();
    });

    startForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pkg = packageField.value;
      const name = document.getElementById('startName').value.trim();
      const company = document.getElementById('startCompany').value.trim();
      const email = document.getElementById('startEmail').value.trim();
      const phone = document.getElementById('startPhone').value.trim();
      const needs = document.getElementById('startNeeds').value.trim();

      const subject = `New enquiry — ${pkg} package`;
      const bodyLines = [
        `Package: ${pkg}`,
        `Name: ${name}`,
        company && `Company: ${company}`,
        `Email: ${email}`,
        phone && `Phone: ${phone}`,
        needs && `\nSpecific requirements:\n${needs}`
      ].filter(Boolean);

      window.location.href = `mailto:info@accountcaddie.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal, .service-card, .step, .tier-stack, .faq-item');
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
