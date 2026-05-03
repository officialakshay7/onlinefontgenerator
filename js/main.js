/* main.js — OnlineFontGenerator.org v5
   Hamburger: completely new <aside> drawer approach
   Dark theme: all via CSS variables, no hardcoded colors
   Toast: opacity-based, always hides correctly            */
(function () {
  'use strict';

  var DEFAULT_TEXT = 'Font Generator';

  /* ── DOM ──────────────────────────────────────── */
  var mainInput    = document.getElementById('mainInput');
  var toolInput    = document.getElementById('toolInput');
  var mainGrid     = document.getElementById('cardsGrid');
  var toolGrid     = document.getElementById('toolCardsGrid');
  var charNum      = document.getElementById('charNum');
  var resultCount  = document.getElementById('resultCount');
  var clearBtn     = document.getElementById('clearBtn');
  var toastEl      = document.getElementById('toast');
  var themeBtn     = document.getElementById('themeBtn');
  var themeIcon    = document.querySelector('.theme-icon');
  var burgerBtn    = document.getElementById('burgerBtn');
  var drawer       = document.getElementById('mobileDrawer');
  var drawerOverlay= document.getElementById('drawerOverlay');
  var drawerClose  = document.getElementById('drawerClose');
  var showFavsCb   = document.getElementById('showFavs');
  var stickyEl     = document.getElementById('stickyInput');
  var goTopBtn     = document.getElementById('goTop');
  var siteHeader   = document.getElementById('siteHeader');
  var chips        = document.querySelectorAll('.chip');

  /* ── State ────────────────────────────────────── */
  var activeCat  = 'all';
  var favsOnly   = false;
  var favorites  = new Set(JSON.parse(localStorage.getItem('fg_fav') || '[]'));
  var isDark     = false;
  var debTimer   = null;
  var toastTimer = null;

  /* ════════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════════ */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
    localStorage.setItem('fg_theme', isDark ? 'dark' : 'light');
  }

  var saved = localStorage.getItem('fg_theme');
  isDark = saved ? (saved === 'dark') : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      isDark = !isDark;
      applyTheme();
    });
  }

  /* ════════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════════ */
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth; /* force reflow */
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1800);
  }

  /* ════════════════════════════════════════════════
     COPY
  ════════════════════════════════════════════════ */
  function copyText(text, card) {
    if (!text) return;
    var promise = navigator.clipboard
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('no clipboard'));

    promise.catch(function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    });

    card.classList.add('copied');
    setTimeout(function () { card.classList.remove('copied'); }, 1500);
    showToast('✓ Copied to clipboard!');
  }

  /* ════════════════════════════════════════════════
     HTML ESCAPE
  ════════════════════════════════════════════════ */
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ════════════════════════════════════════════════
     BUILD CARD
  ════════════════════════════════════════════════ */
  function buildCard(style, text) {
    var out = text;
    try { out = style.fn(text); } catch (e) {}

    var isFav = favorites.has(style.id);
    var card  = document.createElement('div');
    card.className = 'font-card';
    card.innerHTML =
      '<div class="card-top">' +
        '<span class="card-label">' + esc(style.label) + '</span>' +
        '<button class="fav-btn ' + (isFav ? 'on' : '') + '" aria-label="Favourite">' +
          (isFav ? '★' : '☆') +
        '</button>' +
      '</div>' +
      '<div class="card-text">' + esc(out) + '</div>' +
      '<div class="card-bottom">' +
        '<span class="copy-hint">Click to copy</span>' +
        '<span class="copied-badge">✓ Copied!</span>' +
      '</div>';

    card.addEventListener('click', function (e) {
      if (e.target.closest('.fav-btn')) return;
      copyText(out, card);
    });

    card.querySelector('.fav-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = e.currentTarget;
      if (favorites.has(style.id)) {
        favorites.delete(style.id);
        btn.textContent = '☆'; btn.classList.remove('on');
      } else {
        favorites.add(style.id);
        btn.textContent = '★'; btn.classList.add('on');
      }
      localStorage.setItem('fg_fav', JSON.stringify(Array.from(favorites)));
      if (favsOnly) render();
    });

    return card;
  }

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  function render() {
    var grid = mainGrid || toolGrid;
    if (!grid) return;

    var inp = mainInput || toolInput;
    var text = (inp ? inp.value.trim() : '') || DEFAULT_TEXT;
    var cat  = window.TOOL_CATEGORY || activeCat;

    var subset = FONT_STYLES.filter(function (s) {
      if (cat !== 'all' && s.cat !== cat) return false;
      if (favsOnly && !favorites.has(s.id)) return false;
      return true;
    });

    if (!subset.length) {
      grid.innerHTML = '<div class="empty-msg">No styles match your filters.</div>';
      if (resultCount) resultCount.textContent = '';
      return;
    }

    var frag = document.createDocumentFragment();
    subset.forEach(function (style, i) {
      var card = buildCard(style, text);
      card.style.animationDelay = Math.min(i * 0.016, 0.3) + 's';
      frag.appendChild(card);
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
    if (resultCount) resultCount.textContent = subset.length + ' styles';
  }

  /* ════════════════════════════════════════════════
     INPUT WIRING
  ════════════════════════════════════════════════ */
  var activeInput = mainInput || toolInput;
  if (activeInput) {
    activeInput.value = DEFAULT_TEXT;
    if (charNum) charNum.textContent = DEFAULT_TEXT.length;
    activeInput.addEventListener('input', function () {
      if (charNum) charNum.textContent = activeInput.value.length;
      clearTimeout(debTimer);
      debTimer = setTimeout(render, 80);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (activeInput) { activeInput.value = ''; activeInput.focus(); }
      if (charNum) charNum.textContent = '0';
      render();
    });
  }

  var toolClearBtn = document.getElementById('toolClearBtn');
  if (toolClearBtn && toolInput) {
    toolClearBtn.addEventListener('click', function () {
      toolInput.value = ''; toolInput.focus(); render();
    });
  }

  render();

  /* ════════════════════════════════════════════════
     FILTER CHIPS
  ════════════════════════════════════════════════ */
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeCat = chip.dataset.cat;
      render();
    });
  });

  if (showFavsCb) {
    showFavsCb.addEventListener('change', function () {
      favsOnly = showFavsCb.checked;
      render();
    });
  }

  /* ════════════════════════════════════════════════
     DESKTOP DROPDOWN MENUS
     Click-to-toggle. Close on outside click or Escape.
  ════════════════════════════════════════════════ */
  function closeAllDropdowns() {
    document.querySelectorAll('.drop-menu').forEach(function (m) {
      m.classList.remove('open');
    });
    document.querySelectorAll('.drop-trigger').forEach(function (t) {
      t.classList.remove('active');
    });
  }

  document.querySelectorAll('.drop-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var menu   = trigger.parentElement.querySelector('.drop-menu');
      var isOpen = menu.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        menu.classList.add('open');
        trigger.classList.add('active');
      }
    });
  });

  document.addEventListener('click', function () { closeAllDropdowns(); });

  document.querySelectorAll('.drop-menu').forEach(function (m) {
    m.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  /* ════════════════════════════════════════════════
     MOBILE DRAWER
     Completely separate <aside> element.
     Uses transform + visibility (never display:none).
     The desktop .nav-links is hidden via media query
     and does NOT share state with the drawer.
  ════════════════════════════════════════════════ */
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (drawerOverlay) drawerOverlay.classList.add('open');
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /* Burger button — opens/closes drawer */
  if (burgerBtn) {
    burgerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (drawer && drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  /* Close button inside drawer */
  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }

  /* Overlay click closes drawer */
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  /* Escape key closes drawer and dropdowns */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeAllDropdowns();
    }
  });

  /* Close drawer when a link inside it is clicked */
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        /* Small delay so navigation feels intentional */
        setTimeout(closeDrawer, 150);
      });
    });
  }

  /* ════════════════════════════════════════════════
     STICKY INPUT SHADOW
  ════════════════════════════════════════════════ */
  if (stickyEl && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;pointer-events:none;margin-bottom:-1px';
    stickyEl.parentNode.insertBefore(sentinel, stickyEl);
    new IntersectionObserver(function (entries) {
      stickyEl.classList.toggle('stuck', !entries[0].isIntersecting);
    }, {
      rootMargin: '-' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 60) + 'px 0px 0px 0px',
      threshold: 0
    }).observe(sentinel);
  }

  /* ════════════════════════════════════════════════
     GO TO TOP
  ════════════════════════════════════════════════ */
  if (goTopBtn) {
    window.addEventListener('scroll', function () {
      goTopBtn.classList.toggle('visible', window.scrollY > 380);
    }, { passive: true });
    goTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ════════════════════════════════════════════════
     HEADER SHADOW ON SCROLL
  ════════════════════════════════════════════════ */
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 6);
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════
     BREADCRUMB (auto-build on tool pages)
  ════════════════════════════════════════════════ */
  var bc = document.getElementById('breadcrumb');
  if (bc && bc.children.length === 0) {
    var slug = window.location.pathname
      .replace(/\//g, ' ').trim()
      .replace(/-/g, ' ')
      .split(' ')
      .map(function (w) { return w ? w[0].toUpperCase() + w.slice(1) : ''; })
      .join(' ');
    if (slug) {
      bc.innerHTML =
        '<a href="/">Home</a>' +
        '<span class="bc-sep">›</span>' +
        '<span class="bc-cur">' + esc(slug) + '</span>';
    }
  }

  /* ════════════════════════════════════════════════
     SMOOTH ANCHOR SCROLL
  ════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        var hh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 60;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - hh - 8, behavior: 'smooth' });
        closeDrawer();
      }
    });
  });

})();
