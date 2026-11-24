/**
 * Koklass-CMS — Immediate Theme Initializer (Head Script)
 * Executes synchronously in <head> to prevent Flash of Unstyled Content (FOUC)
 * or pink color flashes during page load/transitions.
 */
(function () {
  'use strict';
  try {
    var THEME_KEY = 'koklass-theme-config';
    var MODE_KEY = 'ember-mode';
    var root = document.documentElement;

    var raw = localStorage.getItem(THEME_KEY);
    var cfg = null;
    if (raw) {
      try { cfg = JSON.parse(raw); } catch (e) { cfg = null; }
    }

    var primary = (cfg && cfg.primary) ? cfg.primary.trim() : null;
    var mode = localStorage.getItem(MODE_KEY);
    if (!mode && cfg && cfg.defaultMode) {
      if (cfg.defaultMode === 'dark' || cfg.defaultMode === 'light') mode = cfg.defaultMode;
    }
    var isDark = mode === 'dark' || (!mode && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (primary) {
      function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
      var hClean = String(primary).replace('#', '').trim();
      if (hClean.length === 3) hClean = hClean.split('').map(function (c) { return c + c; }).join('');
      var num = parseInt(hClean || 'EC3876', 16);
      var r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
      var rf = r / 255, gf = g / 255, bf = b / 255;
      var max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
      var l = (max + min) / 2, h = 0, s = 0;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
          case gf: h = (bf - rf) / d + 2; break;
          default: h = (rf - gf) / d + 4;
        }
        h *= 60;
      }
      function hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = l - c / 2;
        var ro = 0, go = 0, bo = 0;
        if (h < 60) { ro = c; go = x; }
        else if (h < 120) { ro = x; go = c; }
        else if (h < 180) { ro = c; go = x; }
        else if (h < 240) { ro = x; go = c; }
        else if (h < 300) { ro = x; go = c; }
        else { ro = c; go = x; }
        var f = function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); };
        return ('#' + f((ro + m) * 255) + f((go + m) * 255) + f((bo + m) * 255)).toUpperCase();
      }

      var brandDark = hslToHex(h, Math.min(1, s * 0.98), clamp(l + 0.06, 0, 0.92));
      var activePrimary = isDark ? brandDark : primary;

      root.style.setProperty('--primary', activePrimary);
      root.style.setProperty('--ring', activePrimary);
      root.style.setProperty('--sidebar-hover', 'color-mix(in srgb, ' + activePrimary + ' ' + (isDark ? '14%' : '8%') + ', transparent)');
      root.style.setProperty('--focus-ring', 'color-mix(in srgb, ' + activePrimary + ' ' + (isDark ? '40%' : '35%') + ', transparent)');
      root.style.setProperty('--primary-soft', 'color-mix(in srgb, ' + activePrimary + ' ' + (isDark ? '18%' : '10%') + ', ' + (isDark ? '#14181F' : '#FFFFFF') + ')');

      var custom = primary.toUpperCase() !== '#EC3876';
      root.classList.toggle('tinted', custom);
    }
  } catch (err) { }
})();
