/**
 * Koklass-CMS demo helpers: dark-mode toggle, toast, and RUNTIME THEME CONFIG.
 *
 * Theme config (brand name, logo, primary color, default mode) is persisted in
 * localStorage under `koklass-theme-config` and applied on every page that
 * includes this file:
 *   - [data-brand-name]  → textContent = configured name
 *   - [data-brand-logo]  → img.src     = configured logo (data-URL or path)
 *   - --primary / --ring / --primary-hover / --primary-soft / --on-primary-soft
 *     / --focus-ring    → derived from the configured brand color (mode-aware)
 */
(function () {
  'use strict';

  /* ============================== Theme config ============================== */

  const THEME_KEY = 'koklass-theme-config';
  const THEME_DEFAULTS = {
    name: 'Koklass',
    logo: './logo.svg',
    primary: '#EC3876',
    defaultMode: 'system',
    fontHeading: 'Nunito',
    fontBody: 'Nunito',
    headingWeight: '800',
    bodyWeight: '400',
    baseFontSize: '14.5px',
    borderRadius: '12px'
  };

  const GOOGLE_FONTS = {
    'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap',
    'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&display=swap',
    'Space Mono': 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap',
    'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',
    'Plus Jakarta Sans': 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  };

  function loadFont(fontName) {
    if (!fontName || fontName === 'Nunito' || !GOOGLE_FONTS[fontName]) return;
    const id = 'gfont-' + fontName.toLowerCase().replace(/\s+/g, '-');
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS[fontName];
      document.head.appendChild(link);
    }
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const n = parseInt(h || 'EC3876', 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) {
    const f = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return ('#' + f(r) + f(g) + f(b)).toUpperCase();
  }
  function hexToRgba(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }
  function hexToHsl(hex) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return { h, s, l };
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  /* Mix `a` (0%) with `b` (100%) in RGB space; amount = share of b. */
  function mix(a, b, amt) {
    const x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x.r + (y.r - x.r) * amt, x.g + (y.g - x.g) * amt, x.b + (y.b - x.b) * amt);
  }

  /** Hover/deep/soft/dark variants derived from any brand color. */
  function deriveBrand(primary) {
    const { h, s, l } = hexToHsl(primary);
    return {
      primary,
      hover: hslToHex(h, s, clamp(l - 0.10, 0.08, 1)),
      deep: hslToHex(h, Math.min(1, s * 1.02), clamp(l - 0.22, 0.05, 1)),
      soft: hslToHex(h, s * 0.55, 0.955),
      onSoft: hslToHex(h, Math.min(1, s * 0.95), 0.28),
      dark: hslToHex(h, Math.min(1, s * 0.98), clamp(l + 0.06, 0, 0.92)),
      darkHover: hslToHex(h, Math.min(1, s * 0.98), clamp(l + 0.12, 0, 0.95)),
      darkSoft: hslToHex(h, s * 0.50, 0.16),
      darkOnSoft: hslToHex(h, s * 0.60, 0.80),
    };
  }

  /** 100–900 ramp mirroring the shipped ember ramp, re-anchored on any color. */
  function deriveRamp(primary) {
    const { h, s, l } = hexToHsl(primary);
    const out = {};
    // Light tints above the base (same deltas as the shipped 100–400)
    [['100', 0.377, 0.90], ['200', 0.317, 0.88], ['300', 0.227, 0.87], ['400', 0.107, 0.85]]
      .forEach(([k, dl, sm]) => { out[k] = hslToHex(h, s * sm, clamp(l + dl, 0, 1)); });
    out['500'] = rgbToHex(...Object.values(hexToRgb(primary)));
    // Shades below the base
    [['600', -0.10], ['700', -0.20], ['800', -0.29], ['900', -0.38]]
      .forEach(([k, dl]) => { out[k] = hslToHex(h, Math.min(1, s * 1.04), clamp(l + dl, 0.03, 1)); });
    return out;
  }

  function getThemeConfig() {
    try {
      return Object.assign({}, THEME_DEFAULTS, JSON.parse(localStorage.getItem(THEME_KEY) || '{}'));
    } catch (e) {
      return Object.assign({}, THEME_DEFAULTS);
    }
  }
  function saveThemeConfig(cfg) {
    try { localStorage.setItem(THEME_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  /** Applies one config object to the document (vars + name + logo + surfaces). */
  function applyConfig(cfg, forceDark) {
    cfg = Object.assign({}, THEME_DEFAULTS, cfg);
    const isDark = forceDark !== undefined ? forceDark : document.documentElement.classList.contains('dark');
    const b = deriveBrand(cfg.primary);
    const rs = document.documentElement.style;

    if (isDark) {
      rs.setProperty('--primary', b.dark);
      rs.setProperty('--primary-hover', b.darkHover);
      rs.setProperty('--primary-soft', b.darkSoft);
      rs.setProperty('--on-primary-soft', b.darkOnSoft);
      rs.setProperty('--ring', b.dark);
      rs.setProperty('--focus-ring', hexToRgba(b.dark, 0.45));
      rs.setProperty('--chart-weekend-bg', hexToRgba(b.dark, 0.08));
    } else {
      rs.setProperty('--primary', b.primary);
      rs.setProperty('--primary-hover', b.hover);
      rs.setProperty('--primary-soft', b.soft);
      rs.setProperty('--on-primary-soft', b.onSoft);
      rs.setProperty('--ring', b.primary);
      rs.setProperty('--focus-ring', hexToRgba(b.primary, 0.35));
      rs.setProperty('--chart-weekend-bg', hexToRgba(b.primary, 0.055));
    }

    /* ---- Typography & Geometry tokens ---- */
    const fontHeading = cfg.fontHeading || 'Nunito';
    const fontBody = cfg.fontBody || 'Nunito';
    loadFont(fontHeading);
    loadFont(fontBody);

    rs.setProperty('--font-heading', `'${fontHeading}', ui-sans-serif, system-ui, sans-serif`);
    rs.setProperty('--font-sans', `'${fontBody}', ui-sans-serif, system-ui, sans-serif`);
    if (cfg.headingWeight) rs.setProperty('--font-weight-heading', cfg.headingWeight);
    if (cfg.bodyWeight) rs.setProperty('--font-weight-body', cfg.bodyWeight);
    if (cfg.baseFontSize) rs.setProperty('--font-size-base', cfg.baseFontSize);
    if (cfg.borderRadius) rs.setProperty('--radius', cfg.borderRadius);

    /* ---- Brand-tinted surfaces (background, sidebar, cards follow the brand) ----
       Only when the picked color differs from the Ember default: the shipped
       look stays untouched otherwise. */
    const custom = (cfg.primary || '').toUpperCase() !== THEME_DEFAULTS.primary.toUpperCase();
    const rootEl = document.documentElement;
    rootEl.classList.toggle('tinted', custom);
    if (custom) {
      const dark = isDark;
      const baseBg = dark ? '#14181F' : '#F7F8FA';
      const baseSurface = dark ? '#1C222B' : '#FFFFFF';
      const baseDark = dark ? '#101018' : '#16161E';
      rs.setProperty('--background', mix(baseBg, b.primary, dark ? 0.045 : 0.03));
      rs.setProperty('--card', mix(baseSurface, b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--popover', mix(baseSurface, b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--secondary', mix(baseBg, b.primary, dark ? 0.06 : 0.05));
      rs.setProperty('--muted', mix(baseBg, b.primary, dark ? 0.06 : 0.05));
      rs.setProperty('--surface-raised', mix(dark ? '#242B36' : '#FFFFFF', b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--sidebar-top', mix(dark ? '#161C24' : baseSurface, dark ? b.dark : b.primary, dark ? 0.08 : 0.018));
      rs.setProperty('--sidebar-bottom', mix(dark ? '#0E1218' : baseBg, dark ? b.dark : b.primary, dark ? 0.05 : 0.035));
      rs.setProperty('--sidebar-hover', dark ? hexToRgba(b.dark, 0.16) : hexToRgba(b.primary, 0.08));
      rs.setProperty('--badge-brand-bg', hexToRgba(dark ? b.dark : b.primary, dark ? 0.22 : 0.12));
      rs.setProperty('--login-glow', hexToRgba(dark ? b.dark : b.primary, 0.13));
    } else {
      ['--background', '--card', '--popover', '--secondary', '--muted', '--surface-raised',
        '--sidebar-top', '--sidebar-bottom', '--badge-brand-bg', '--login-glow']
        .forEach(k => rs.removeProperty(k));
      rs.setProperty('--sidebar-hover', isDark ? hexToRgba(b.dark, 0.16) : hexToRgba(b.primary, 0.08));
    }

    const name = (cfg.name || '').trim() || THEME_DEFAULTS.name;
    document.querySelectorAll('[data-brand-name]').forEach(el => { el.textContent = name; });

    const logo = cfg.logo || THEME_DEFAULTS.logo;
    const isDefaultLogo = !logo || logo === './logo.svg' || logo.endsWith('/logo.svg');
    document.querySelectorAll('[data-brand-logo]').forEach(el => {
      if (isDefaultLogo) {
        // If already an inline SVG, keep it so it dynamically inherits var(--primary) via fill="currentColor"
        if (el.tagName.toLowerCase() === 'svg') {
          el.style.display = '';
        } else {
          // If it's an img pointing to logo.svg, replace with inline SVG to inherit active theme color
          el.outerHTML = '<svg data-brand-logo viewBox="0 0 47.068 41.637" style="width:22px;height:auto;display:block;" fill="currentColor" aria-hidden="true"><path d="M5891.241,47.992a2.175,2.175,0,0,1,0-2.607l2.909-3.819L5912.71,16.1h-14.216a5.3,5.3,0,0,0-4.241,2.111l-14.834,19.333-3.183,4.155a.836.836,0,0,1-1.189.134.868.868,0,0,1-.316-.663v-18.7a3.3,3.3,0,0,0-1.162-2.522,3.523,3.523,0,0,0-.4-.294L5872,18.924h6.427a3.044,3.044,0,0,1,3.016,3.062V29.98l2.787-3.644V19.156l4.017-3.057h-18.124l-4.479,5.641h.125l5.725.246a.459.459,0,0,1,.357.18.479.479,0,0,1,.1.289V45.772a2.069,2.069,0,0,0,1.394,1.988,2.146,2.146,0,0,0,.688.118,2.022,2.022,0,0,0,1.608-.814l19.741-25.75a5.994,5.994,0,0,1,4.8-2.366h6.864L5892.394,39.3l-2.589,3.374a1.633,1.633,0,0,1-1.176.672,1.551,1.551,0,0,1-1.346-.63l-2.058-3.015-1.762,2.31,3.718,5.177a1.964,1.964,0,0,0,.167.18h0l7.63,10.369.055-.081a3.921,3.921,0,0,0-.041-4.6Z" transform="translate(-5865.643 -16.099)"/></svg>';
        }
      } else {
        // Custom uploaded logo image
        if (el.tagName.toLowerCase() === 'img') {
          el.style.display = '';
          el.src = logo;
          el.onerror = () => { el.style.display = 'none'; };
        } else {
          el.outerHTML = '<img data-brand-logo src="' + logo + '" alt="" style="width:22px;height:auto;display:block;" />';
        }
      }
    });
  }

  /** Applies theme tokens scoped strictly to a specific container element */
  function applyScopedTheme(el, cfg, isDark) {
    if (!el) return;
    cfg = Object.assign({}, THEME_DEFAULTS, cfg);
    const b = deriveBrand(cfg.primary);
    const rs = el.style;

    el.classList.toggle('dark', isDark);

    if (isDark) {
      rs.setProperty('--primary', b.dark);
      rs.setProperty('--primary-hover', b.darkHover);
      rs.setProperty('--primary-soft', b.darkSoft);
      rs.setProperty('--on-primary-soft', b.darkOnSoft);
      rs.setProperty('--ring', b.dark);
      rs.setProperty('--focus-ring', hexToRgba(b.dark, 0.45));
      rs.setProperty('--chart-weekend-bg', hexToRgba(b.dark, 0.08));
    } else {
      rs.setProperty('--primary', b.primary);
      rs.setProperty('--primary-hover', b.hover);
      rs.setProperty('--primary-soft', b.soft);
      rs.setProperty('--on-primary-soft', b.onSoft);
      rs.setProperty('--ring', b.primary);
      rs.setProperty('--focus-ring', hexToRgba(b.primary, 0.35));
      rs.setProperty('--chart-weekend-bg', hexToRgba(b.primary, 0.055));
    }

    const fontHeading = cfg.fontHeading || 'Nunito';
    const fontBody = cfg.fontBody || 'Nunito';
    loadFont(fontHeading);
    loadFont(fontBody);

    rs.setProperty('--font-heading', `'${fontHeading}', ui-sans-serif, system-ui, sans-serif`);
    rs.setProperty('--font-sans', `'${fontBody}', ui-sans-serif, system-ui, sans-serif`);
    if (cfg.headingWeight) rs.setProperty('--font-weight-heading', cfg.headingWeight);
    if (cfg.bodyWeight) rs.setProperty('--font-weight-body', cfg.bodyWeight);
    if (cfg.baseFontSize) rs.setProperty('--font-size-base', cfg.baseFontSize);
    if (cfg.borderRadius) rs.setProperty('--radius', cfg.borderRadius);

    const custom = (cfg.primary || '').toUpperCase() !== THEME_DEFAULTS.primary.toUpperCase();
    el.classList.toggle('tinted', custom);
    if (custom) {
      const dark = isDark;
      const baseBg = dark ? '#14181F' : '#F7F8FA';
      const baseSurface = dark ? '#1C222B' : '#FFFFFF';
      rs.setProperty('--background', mix(baseBg, b.primary, dark ? 0.045 : 0.03));
      rs.setProperty('--card', mix(baseSurface, b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--popover', mix(baseSurface, b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--secondary', mix(baseBg, b.primary, dark ? 0.06 : 0.05));
      rs.setProperty('--muted', mix(baseBg, b.primary, dark ? 0.06 : 0.05));
      rs.setProperty('--surface-raised', mix(dark ? '#242B36' : '#FFFFFF', b.primary, dark ? 0.03 : 0.015));
      rs.setProperty('--sidebar-top', mix(dark ? '#161C24' : baseSurface, dark ? b.dark : b.primary, dark ? 0.08 : 0.018));
      rs.setProperty('--sidebar-bottom', mix(dark ? '#0E1218' : baseBg, dark ? b.dark : b.primary, dark ? 0.05 : 0.035));
      rs.setProperty('--sidebar-hover', dark ? hexToRgba(b.dark, 0.16) : hexToRgba(b.primary, 0.08));
      rs.setProperty('--badge-brand-bg', hexToRgba(dark ? b.dark : b.primary, dark ? 0.22 : 0.12));
    } else {
      ['--background', '--card', '--popover', '--secondary', '--muted', '--surface-raised', '--badge-brand-bg']
        .forEach(k => rs.removeProperty(k));
    }
  }

  window.THEME_DEFAULTS = THEME_DEFAULTS;
  window.getThemeConfig = getThemeConfig;
  window.saveThemeConfig = saveThemeConfig;
  window.deriveBrand = deriveBrand;
  window.deriveRamp = deriveRamp;
  window.applyScopedTheme = applyScopedTheme;
  window.hexToRgba = hexToRgba;
  window.mix = mix;
  window.applyThemeConfig = () => applyConfig(getThemeConfig());
  /** Live-preview support (Theme config page): apply a draft without saving. */
  window.applyThemeDraft = cfg => applyConfig(cfg);

  /* ============================== Dark mode ================================= */

  const MODE_KEY = 'ember-mode';
  const root = document.documentElement;

  function apply(dark) {
    root.classList.toggle('dark', dark);
    document.querySelectorAll('[data-mode-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      if (btn.dataset.modeIcon) btn.textContent = dark ? '☀️' : '🌙';
    });
    applyConfig(getThemeConfig(), dark);
  }

  (function initMode() {
    let saved = null;
    try { saved = localStorage.getItem(MODE_KEY); } catch (e) {}
    if (!saved) {
      const cfg = getThemeConfig();
      if (cfg.defaultMode === 'dark') saved = 'dark';
      else if (cfg.defaultMode === 'light') saved = 'light';
    }
    apply(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  })();

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-mode-toggle]');
    if (btn) {
      const next = !root.classList.contains('dark');
      apply(next);
      try { localStorage.setItem(MODE_KEY, String(next)); } catch (err) {}
    }
  });

  /* ================================ Toast =================================== */

  window.showToast = function (msg) {
    let host = document.getElementById('ember-toast');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ember-toast';
      host.className = 'toast';
      document.body.appendChild(host);
    }
    host.textContent = msg;
    host.classList.add('show');
    clearTimeout(host._t);
    host._t = setTimeout(() => host.classList.remove('show'), 2600);
  };

  /* ============================ Modal helper ===============================
     window.openModal({ title, body, okText, cancelText, danger, ok }).
     Creates a one-shot confirm/dialog card; returns a close() function. */
  window.openModal = function (opts) {
    opts = opts || {};
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop open';
    bd.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">'
      + '<div class="modal-head">'
      + (opts.danger !== false
        ? '<div class="modal-warn"><svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>'
        : '')
      + '<div><h3>' + (opts.title || 'Are you sure?') + '</h3></div>'
      + '</div>'
      + '<div class="modal-body">' + (opts.body || '') + '</div>'
      + '<div class="modal-foot">'
      + '<button class="btn btn-ghost" data-x>' + (opts.cancelText || 'Cancel') + '</button>'
      + '<button class="btn ' + (opts.danger !== false ? 'btn-danger' : 'btn-primary') + '" data-ok>' + (opts.okText || 'Confirm') + '</button>'
      + '</div></div>';
    document.body.appendChild(bd);
    const close = () => bd.remove();
    bd.querySelector('[data-x]').addEventListener('click', close);
    bd.querySelector('[data-ok]').addEventListener('click', () => { close(); if (opts.ok) opts.ok(); });
    bd.addEventListener('click', e => { if (e.target === bd) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    return close;
  };

  /* ============================ Dropdown engine =============================
     Replaces native <select> popups so menus match the theme (popover card,
     rounded options, check mark, keyboard nav, type-ahead).

     Declarative markup:
       <div class="dd" data-dd data-placeholder="Pick one…">
         <input type="hidden" name="x" value="" />   (optional)
       </div>
     Options come from data-options='[{"v":"a","t":"Label"}, …]' on the same
     element, or are set via JS: window.bindDropdown(el, options, onchange).  */

  function closeAllDD(except) {
    document.querySelectorAll('.dd.open').forEach(dd => {
      if (dd !== except) {
        dd.classList.remove('open');
        const t = dd.querySelector('.dd-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.bindDropdown = function (el, options, onChange) {
    if (!el || el.dataset.ddBound) return;
    el.dataset.ddBound = '1';
    const selected = { v: el.dataset.value || '' };

    // Hidden input passthrough (form submission + read/write API)
    const hidden = el.querySelector('input[type="hidden"]');
    if (hidden) selected.v = hidden.value || selected.v;

    const placeholder = el.dataset.placeholder || 'Select…';
    const opts = options || JSON.parse(el.dataset.options || '[]');

    el.innerHTML =
      '<button type="button" class="dd-trigger" aria-haspopup="listbox">'
      + '<span class="dd-value placeholder">' + placeholder + '</span>'
      + '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
      + '</button>'
      + '<div class="dd-menu" role="listbox">'
      + opts.map(o =>
          '<div class="dd-opt" role="option" data-v="' + String(o.v).replace(/"/g, '&quot;') + '">'
          + '<span>' + o.t + '</span>'
          + '<svg class="tick" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
          + '</div>').join('')
      + '</div>';

    const trigger = el.querySelector('.dd-trigger');
    const valueEl = el.querySelector('.dd-value');
    const menu = el.querySelector('.dd-menu');

    function set(v, silent) {
      selected.v = v;
      const o = opts.find(x => String(x.v) === String(v));
      valueEl.textContent = o ? o.t : placeholder;
      valueEl.classList.toggle('placeholder', !o);
      el.querySelectorAll('.dd-opt').forEach(n => n.classList.toggle('sel', String(n.dataset.v) === String(v)));
      if (hidden) hidden.value = v;
      if (!silent && onChange) onChange(v, o);
    }
    if (selected.v) set(selected.v, true);

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const opening = !el.classList.contains('open');
      closeAllDD(el);
      el.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
      // Flip up when near the viewport bottom
      el.classList.remove('drop-up');
      const r = el.getBoundingClientRect();
      if (opening && r.bottom + 300 > window.innerHeight && r.top > 340) el.classList.add('drop-up');
      if (opening) {
        const sel = menu.querySelector('.dd-opt.sel');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
      }
    });

    menu.addEventListener('click', e => {
      const opt = e.target.closest('.dd-opt');
      if (!opt) return;
      set(opt.dataset.v);
      closeAllDD();
    });

    el.setValue = v => set(v, true);
    el.getValue = () => selected.v;

    return { set, get: () => selected.v, el };
  };

  let ddWired = false;
  function wireDropdowns() {
    document.querySelectorAll('[data-dd]').forEach(el => window.bindDropdown(el));
    if (!ddWired) {
      ddWired = true;
      document.addEventListener('click', () => closeAllDD());
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAllDD();
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireDropdowns);
  } else {
    wireDropdowns();
  }
  window.wireDropdowns = wireDropdowns; // re-call after dynamic renders

})();

