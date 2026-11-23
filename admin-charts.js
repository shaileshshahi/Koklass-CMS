/**
 * Koklass-CMS Ember — tiny dependency-free SVG chart helpers.
 * Renders modern, responsive charts that inherit theme CSS variables, in light & dark.
 *
 * API:
 *   EmberCharts.area(el, {series, labels, yMax, yTicks, formatY, formatTip, areaOpacity})
 *   EmberCharts.bars(el, {series, labels, stacked, grouped, yMax, yTicks, formatY, formatTip})
 *   EmberCharts.donut(el, {data:[{label, value, color}], thickness, center, sub})
 *   EmberCharts.radar(el, {axes, series, max})
 *   EmberCharts.gauge(el, {value, max, label, sub, color})
 *   EmberCharts.sparkline(el, {data, color, fill})
 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in (attrs || {})) {
      if (attrs[k] !== undefined && attrs[k] !== null) {
        n.setAttribute(k, attrs[k]);
      }
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function fmt(v) {
    if (Math.abs(v) >= 1e6) {
      const m = v / 1e6;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (Math.abs(v) >= 1e3) {
      const k = v / 1e3;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
    }
    return String(Math.round(v * 100) / 100);
  }

  /* Compute human-friendly "nice numbers" for graph axis ticks */
  function niceNum(range, round) {
    const exponent = Math.floor(Math.log10(Math.max(range, 1e-9)));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else {
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
  }

  function niceScale(min, max, maxTicks) {
    maxTicks = maxTicks || 5;
    if (max <= min) max = min + 1;
    const range = niceNum(max - min, false);
    const step = niceNum(range / (maxTicks - 1), true);
    const graphMin = Math.floor(min / step) * step;
    const graphMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = graphMin; v <= graphMax + step * 0.001; v += step) {
      ticks.push(Math.round(v * 1000) / 1000);
    }
    return { min: graphMin, max: graphMax, step, ticks };
  }

  function smoothPath(pts) {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return 'M' + pts[0].join(',');
    if (pts.length === 2) return 'M' + pts[0].join(',') + 'L' + pts[1].join(',');
    let d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' +
        c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' +
        p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  /* Responsive SVG scaffold with balanced aspect ratio */
  function scaffold(w, h, cls, preserve) {
    const svg = el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: preserve || 'none',
      class: cls || '',
      style: 'width:100%;height:' + h + 'px;min-height:' + h + 'px;display:block;overflow:visible;'
    });
    return svg;
  }

  /* HTML floating popover tooltip with backdrop-filter & shadows */
  function createHtmlTooltip(container) {
    if (!container) return { show: () => { }, hide: () => { } };
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    let tipEl = container.querySelector('.ember-chart-tip');
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'ember-chart-tip';
      tipEl.style.cssText = [
        'position:absolute',
        'display:none',
        'pointer-events:none',
        'opacity:0',
        'transform:translate(-50%, -100%)',
        'margin-top:-10px',
        'background:var(--popover, #ffffff)',
        'color:var(--popover-foreground, var(--foreground, #1e293b))',
        'border:1px solid var(--border, rgba(0,0,0,0.12))',
        'border-radius:calc(var(--radius, 10px) - 2px)',
        'box-shadow:0 10px 25px -5px rgba(0,0,0,0.22), 0 4px 6px -2px rgba(0,0,0,0.08)',
        'padding:8px 12px',
        'font-family:var(--font-sans, inherit)',
        'font-size:11.5px',
        'line-height:1.4',
        'white-space:nowrap',
        'z-index:60',
        'transition:opacity 100ms ease, transform 100ms ease'
      ].join(';');
      container.appendChild(tipEl);
    }

    function show(x, y, title, rows) {
      let html = '';
      if (title) {
        html += '<div style="font-weight:700;font-size:11px;color:var(--muted-foreground);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em">' + title + '</div>';
      }
      if (Array.isArray(rows)) {
        rows.forEach(r => {
          html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:2px;">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;">' +
            (r.color ? '<i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + r.color + '"></i>' : '') +
            '<span>' + r.label + '</span>' +
            '</span>' +
            '<b style="font-weight:700;color:var(--foreground)">' + r.value + '</b>' +
            '</div>';
        });
      } else if (rows) {
        html += '<div style="font-weight:600;">' + rows + '</div>';
      }
      tipEl.innerHTML = html;

      // Ensure tooltip remains within container boundaries
      const cRect = container.getBoundingClientRect();
      const clampedX = Math.max(70, Math.min(cRect.width - 70, x));
      const clampedY = Math.max(40, y);

      tipEl.style.left = clampedX + 'px';
      tipEl.style.top = clampedY + 'px';
      tipEl.style.display = 'block';
      tipEl.style.opacity = '1';
      tipEl.style.transform = 'translate(-50%, -100%)';
    }

    function hide() {
      if (tipEl) {
        tipEl.style.opacity = '0';
        tipEl.style.display = 'none';
        tipEl.style.transform = 'translate(-50%, -90%)';
      }
    }

    return { show, hide };
  }

  let chartUid = 0;
  const Charts = {};

  /* ---------------- Area / Line Chart ---------------- */
  Charts.area = function (container, o) {
    if (!container) return;
    const cWidth = container.clientWidth || 1000;
    const isMobile = cWidth < 520;
    const W = Math.max(280, cWidth);
    const H = o.height || (isMobile ? 260 : 340);
    const P = {
      l: isMobile ? 46 : 64,
      r: isMobile ? 12 : 24,
      t: isMobile ? 24 : 36,
      b: isMobile ? 32 : 40
    };
    const labels = o.labels || [];
    const series = o.series || [];
    const rawMax = Math.max(...series.flatMap(s => s.data), 1);
    const scale = niceScale(0, o.yMax || rawMax, isMobile ? 4 : (o.yTicks || 5));
    const max = scale.max;
    const uid = 'c-grad-' + (++chartUid);

    const svg = scaffold(W, H, 'area-chart', 'none');
    const stepX = (W - P.l - P.r) / Math.max(1, labels.length - 1);
    const px = i => P.l + i * stepX;
    const py = v => H - P.b - (v / max) * (H - P.t - P.b);

    // Defs for gradients and glow filters
    const defs = el('defs', null, svg);
    series.forEach((s, si) => {
      const grad = el('linearGradient', { id: uid + '-' + si, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
      el('stop', { offset: '0%', 'stop-color': s.color || 'var(--primary)', 'stop-opacity': String(o.areaOpacity || 0.35) }, grad);
      el('stop', { offset: '60%', 'stop-color': s.color || 'var(--primary)', 'stop-opacity': '0.08' }, grad);
      el('stop', { offset: '100%', 'stop-color': s.color || 'var(--primary)', 'stop-opacity': '0.00' }, grad);
    });

    // Drop shadow glow filter for primary series curve
    const s0Color = (series[0] && series[0].color) || '#EC3876';
    const filter = el('filter', { id: uid + '-glow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    el('feDropShadow', { dx: '0', dy: '6', stdDeviation: '5', 'flood-color': s0Color, 'flood-opacity': '0.35' }, filter);

    // Weekend background shading without overlapping text or bleeding out
    const satIdx = labels.findIndex(lb => lb.toLowerCase().includes('sat'));
    const sunIdx = labels.findIndex(lb => lb.toLowerCase().includes('sun'));
    if (satIdx >= 0) {
      const halfStep = stepX / 2;
      const wStart = Math.max(P.l, px(satIdx) - halfStep);
      const wEnd = Math.min(W - P.r, (sunIdx >= 0 ? px(sunIdx) : px(satIdx)) + halfStep);
      if (wEnd > wStart) {
        el('rect', {
          x: wStart, y: P.t,
          width: wEnd - wStart, height: H - P.t - P.b,
          fill: 'var(--chart-weekend-bg, color-mix(in srgb, var(--primary, #EC3876) 5.5%, transparent))',
          rx: '6'
        }, svg);
      }
    }

    // Vertical gridlines across full chart width
    labels.forEach((lb, i) => {
      el('line', {
        class: 'grid-v',
        x1: px(i), x2: px(i), y1: P.t, y2: H - P.b,
        stroke: 'var(--chart-grid)',
        'stroke-width': '1',
        'stroke-dasharray': '2 3',
        opacity: '0.45'
      }, svg);
    });

    // Horizontal gridlines with clear contrast across full chart width
    scale.ticks.forEach((v, t) => {
      const y = py(v);
      el('line', {
        class: 'grid',
        x1: P.l, x2: W - P.r, y1: y, y2: y,
        stroke: 'var(--chart-grid)',
        'stroke-width': '1',
        'stroke-dasharray': t === 0 ? 'none' : '3 3',
        opacity: t === 0 ? '1' : '0.8'
      }, svg);
      const tx = el('text', {
        x: P.l - (isMobile ? 6 : 12), y: y + 4,
        'text-anchor': 'end',
        fill: 'var(--muted-foreground)',
        'font-size': isMobile ? '10' : '11',
        'font-weight': '600',
        'font-family': 'var(--font-sans, inherit)'
      }, svg);
      tx.textContent = o.formatY ? o.formatY(v) : fmt(v);
    });

    // X-axis date/day labels
    labels.forEach((lb, i) => {
      const showLabel = !isMobile || labels.length <= 7 || i % 2 === 0 || i === labels.length - 1;
      if (showLabel) {
        const tx = el('text', {
          x: px(i), y: H - (isMobile ? 8 : 12),
          'text-anchor': 'middle',
          fill: 'var(--muted-foreground)',
          'font-size': isMobile ? '10' : '11',
          'font-weight': '600',
          'font-family': 'var(--font-sans, inherit)'
        }, svg);
        tx.textContent = lb;
      }
    });

    // Render area gradients and series lines across full width
    series.forEach((s, si) => {
      const pts = s.data.map((v, i) => [px(i), py(v)]);
      if (o.fill !== false && s.fill !== false) {
        const areaPath = smoothPath(pts) + 'L' + px(labels.length - 1) + ',' + (H - P.b) + 'L' + px(0) + ',' + (H - P.b) + 'Z';
        el('path', { d: areaPath, fill: 'url(#' + uid + '-' + si + ')', stroke: 'none' }, svg);
      }
      const path = el('path', {
        class: 'line',
        d: smoothPath(pts),
        stroke: s.color || 'var(--primary)',
        'stroke-width': si === 0 ? (isMobile ? '2.5' : '3') : (s.width || (isMobile ? '1.8' : '2.2')),
        'stroke-dasharray': s.dashed ? '6 4' : 'none',
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }, svg);
      path.style.stroke = s.color || 'var(--primary)';
      if (si === 0) {
        path.setAttribute('filter', 'url(#' + uid + '-glow)');
      }

      // Data markers
      if (s.dots !== false && labels.length <= 20) {
        pts.forEach(p => {
          const circle = el('circle', {
            cx: p[0], cy: p[1], r: si === 0 ? (isMobile ? 3.5 : 4.5) : (isMobile ? 2.5 : 3.5),
            fill: s.color || 'var(--primary)',
            stroke: 'var(--card, #fff)',
            'stroke-width': '2'
          }, svg);
          circle.style.fill = s.color || 'var(--primary)';
          circle.style.stroke = 'var(--card, #fff)';
        });
      }
    });

    // Floating Peak Callout Badge on primary series peak
    if (series[0] && series[0].data && series[0].data.length) {
      let maxIdx = 0, maxVal = series[0].data[0];
      series[0].data.forEach((val, i) => {
        if (val > maxVal) { maxVal = val; maxIdx = i; }
      });
      const peakX = px(maxIdx), peakY = py(maxVal);
      const bW = isMobile ? 88 : 104, bH = isMobile ? 20 : 22;
      const badgeX = Math.max(bW / 2 + 6, Math.min(W - bW / 2 - 6, peakX));
      const badgeG = el('g', { class: 'peak-badge', style: 'pointer-events:none;' }, svg);
      el('line', {
        x1: peakX, y1: peakY - 4, x2: badgeX, y2: peakY - 14,
        stroke: series[0].color || 'var(--primary)',
        'stroke-width': '1.5',
        'stroke-dasharray': '2 2'
      }, badgeG);
      el('circle', {
        cx: peakX, cy: peakY, r: '5',
        fill: 'none',
        stroke: series[0].color || 'var(--primary)',
        'stroke-width': '1.5',
        opacity: '0.6'
      }, badgeG);
      el('rect', {
        x: badgeX - bW / 2, y: peakY - 36,
        width: bW, height: bH, rx: '10',
        fill: 'var(--card, #fff)',
        stroke: series[0].color || 'var(--primary)',
        'stroke-width': '1.5',
        style: 'filter:drop-shadow(0 4px 10px rgba(0,0,0,0.15));'
      }, badgeG);
      const t = el('text', {
        x: badgeX, y: peakY - (isMobile ? 23 : 22),
        'text-anchor': 'middle',
        fill: 'var(--foreground, #1e293b)',
        'font-size': isMobile ? '9.5' : '10.5',
        'font-weight': '700',
        'font-family': 'var(--font-sans, inherit)'
      }, badgeG);
      t.textContent = '★ Peak ' + (o.formatY ? o.formatY(maxVal) : fmt(maxVal));
    }

    // Hover vertical crosshair line and active tracker points
    const crosshair = el('line', {
      x1: 0, y1: P.t, x2: 0, y2: H - P.b,
      stroke: 'var(--foreground)',
      'stroke-width': '1',
      'stroke-dasharray': '3 3',
      opacity: '0.45',
      style: 'display:none;pointer-events:none;'
    }, svg);

    const activeDots = series.map(s => {
      const circle = el('circle', {
        r: '5.5',
        fill: s.color || 'var(--primary)',
        stroke: 'var(--card, #fff)',
        'stroke-width': '2.5',
        style: 'display:none;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));'
      }, svg);
      circle.style.fill = s.color || 'var(--primary)';
      return circle;
    });

    // Overlay zone for mouse and touch tracking
    const tip = createHtmlTooltip(container);
    const zone = el('rect', {
      x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b,
      fill: 'transparent', style: 'cursor:crosshair;'
    }, svg);

    function handlePointer(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      const xf = (clientX - rect.left) / rect.width;
      const svgX = xf * W;
      const i = Math.max(0, Math.min(labels.length - 1, Math.round(((svgX - P.l) / (W - P.l - P.r)) * (labels.length - 1))));
      const ptX = px(i);

      crosshair.setAttribute('x1', ptX);
      crosshair.setAttribute('x2', ptX);
      crosshair.style.display = '';

      series.forEach((s, si) => {
        const val = s.data[i] !== undefined ? s.data[i] : 0;
        const ptY = py(val);
        activeDots[si].setAttribute('cx', ptX);
        activeDots[si].setAttribute('cy', ptY);
        activeDots[si].style.display = '';
      });

      // Compute client coordinates inside container
      const cRect = container.getBoundingClientRect();
      const cX = (ptX / W) * rect.width + (rect.left - cRect.left);
      const topY = Math.min(...series.map(s => py(s.data[i] || 0)));
      const cY = (topY / H) * rect.height + (rect.top - cRect.top);

      const rows = series.map(s => ({
        label: s.name,
        color: s.color,
        value: o.formatTip ? o.formatTip(s.data[i] || 0) : fmt(s.data[i] || 0)
      }));

      // Add comparative delta if both Current and Previous exist
      const curr = series.find(s => s.name.toLowerCase().includes('current'));
      const prev = series.find(s => s.name.toLowerCase().includes('prev'));
      if (curr && prev && curr.data[i] !== undefined && prev.data[i] !== undefined) {
        const diff = curr.data[i] - prev.data[i];
        const pct = Math.round((diff / (prev.data[i] || 1)) * 100);
        const sign = pct >= 0 ? '+' : '';
        rows.push({
          label: 'Delta vs Prev',
          color: pct >= 0 ? 'var(--success, #2FBF71)' : 'var(--destructive, #F0564E)',
          value: sign + pct + '%'
        });
      }

      tip.show(cX, cY, labels[i], rows);
    }

    zone.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
    zone.addEventListener('touchstart', e => {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    zone.addEventListener('touchmove', e => {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const hidePointer = () => {
      crosshair.style.display = 'none';
      activeDots.forEach(d => { d.style.display = 'none'; });
      tip.hide();
    };
    zone.addEventListener('mouseleave', hidePointer);
    zone.addEventListener('touchend', hidePointer);

    container.appendChild(svg);
    return svg;
  };

  /* ---------------- Bars (Grouped / Stacked) ---------------- */
  Charts.bars = function (container, o) {
    if (!container) return;
    const cWidth = container.clientWidth || 1000;
    const isMobile = cWidth < 520;
    const W = Math.max(280, cWidth);
    const H = o.height || (isMobile ? 240 : 280);
    const P = {
      l: isMobile ? 46 : 64,
      r: isMobile ? 12 : 24,
      t: isMobile ? 24 : 36,
      b: isMobile ? 32 : 40
    };
    const labels = o.labels || [];
    const series = o.series || [];
    const stacked = !!o.stacked;
    const totals = labels.map((_, i) => stacked ? series.reduce((a, s) => a + (s.data[i] || 0), 0) : Math.max(...series.map(s => s.data[i] || 0)));
    const rawMax = Math.max(...totals, 1);
    const scale = niceScale(0, o.yMax || rawMax, isMobile ? 4 : (o.yTicks || 5));
    const max = scale.max;

    const svg = scaffold(W, H, 'bars-chart', 'none');
    const y = v => H - P.b - (v / max) * (H - P.t - P.b);
    const band = (W - P.l - P.r) / Math.max(1, labels.length);

    // Clean horizontal gridlines with nice ticks
    scale.ticks.forEach((v, t) => {
      el('line', {
        class: 'grid',
        x1: P.l, x2: W - P.r, y1: y(v), y2: y(v),
        stroke: 'var(--border)',
        'stroke-width': '1',
        'stroke-dasharray': t === 0 ? 'none' : '4 4',
        opacity: t === 0 ? '1' : '0.85'
      }, svg);
      const tx = el('text', {
        x: P.l - (isMobile ? 6 : 12), y: y(v) + 4,
        'text-anchor': 'end',
        fill: 'var(--muted-foreground)',
        'font-size': isMobile ? '10' : '11',
        'font-weight': '600',
        'font-family': 'var(--font-sans, inherit)'
      }, svg);
      tx.textContent = o.formatY ? o.formatY(v) : fmt(v);
    });

    labels.forEach((lb, i) => {
      const tx = el('text', {
        x: P.l + band * (i + 0.5), y: H - (isMobile ? 8 : 12),
        'text-anchor': 'middle',
        fill: 'var(--muted-foreground)',
        'font-size': isMobile ? '10' : '11',
        'font-weight': '600',
        'font-family': 'var(--font-sans, inherit)'
      }, svg);
      tx.textContent = lb;
    });

    const tip = createHtmlTooltip(container);
    const gw = stacked ? Math.min(38, band * 0.58) : Math.min(22, (band * 0.74) / series.length);

    labels.forEach((lb, i) => {
      let acc = 0;
      const groupCenterX = P.l + band * (i + 0.5);

      series.forEach((s, si) => {
        const v = s.data[i] || 0;
        const barH = (v / max) * (H - P.t - P.b);
        let bx;
        if (stacked) {
          bx = groupCenterX - gw / 2;
        } else {
          const totalGroupW = series.length * gw;
          bx = groupCenterX - totalGroupW / 2 + si * gw;
        }
        const by = stacked ? y(acc + v) : y(v);

        const r = el('rect', {
          x: bx, y: by,
          width: Math.max(2, gw - (stacked ? 0 : 2)),
          height: Math.max(1, barH),
          fill: s.color || 'var(--primary)',
          rx: Math.min(4, gw / 2.5),
          style: 'cursor:pointer;transition:opacity 0.15s ease;'
        }, svg);
        r.style.fill = s.color || 'var(--primary)';

        const showTip = () => {
          r.style.opacity = '0.85';
          const rect = svg.getBoundingClientRect();
          const cRect = container.getBoundingClientRect();
          const clientX = ((bx + gw / 2) / W) * rect.width + (rect.left - cRect.left);
          const clientY = (by / H) * rect.height + (rect.top - cRect.top);

          const rows = [
            { label: s.name, color: s.color, value: o.formatTip ? o.formatTip(v) : fmt(v) }
          ];
          if (stacked) {
            const dayTotal = series.reduce((sum, item) => sum + (item.data[i] || 0), 0);
            const share = Math.round((v / (dayTotal || 1)) * 100);
            rows.push({ label: 'Share of Day', value: share + '%' });
          }
          tip.show(clientX, clientY, lb + ' · ' + s.name, rows);
        };

        const hideTip = () => {
          r.style.opacity = '1';
          tip.hide();
        };

        r.addEventListener('mouseenter', showTip);
        r.addEventListener('mouseleave', hideTip);
        r.addEventListener('touchstart', showTip, { passive: true });
        r.addEventListener('touchend', hideTip);

        acc += v;
      });
    });

    container.appendChild(svg);
    return svg;
  };

  /* ---------------- Donut / Pie Chart ---------------- */
  Charts.donut = function (container, o) {
    if (!container) return;
    const size = o.size || 240, c = size / 2, R = o.radius || 102;
    const th = o.thickness || 30;
    const svg = scaffold(size, size, 'donut-chart', 'xMidYMid meet');
    const data = o.data || [];
    const total = data.reduce((a, d) => a + (d.value || 0), 0) || 1;
    const tip = createHtmlTooltip(container);

    let a0 = -Math.PI / 2;
    data.forEach((d, idx) => {
      const a1 = a0 + (d.value / total) * Math.PI * 2;
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      const p = [
        'M' + (c + R * Math.cos(a0)).toFixed(1) + ',' + (c + R * Math.sin(a0)).toFixed(1),
        'A' + R + ',' + R + ' 0 ' + large + ' 1 ' + (c + R * Math.cos(a1)).toFixed(1) + ',' + (c + R * Math.sin(a1)).toFixed(1),
        'L' + (c + (R - th) * Math.cos(a1)).toFixed(1) + ',' + (c + (R - th) * Math.sin(a1)).toFixed(1),
        'A' + (R - th) + ',' + (R - th) + ' 0 ' + large + ' 0 ' + (c + (R - th) * Math.cos(a0)).toFixed(1) + ',' + (c + (R - th) * Math.sin(a0)).toFixed(1),
        'Z'
      ].join('');

      const path = el('path', {
        d: p,
        fill: d.color || 'var(--primary)',
        stroke: 'var(--card, #fff)',
        'stroke-width': '2.5',
        class: 'donut-slice',
        'data-index': String(idx),
        'data-label': d.label || '',
        style: 'cursor:pointer;transition:transform 0.18s ease, opacity 0.15s ease;transform-origin:' + c + 'px ' + c + 'px;'
      }, svg);

      path.addEventListener('mouseenter', () => {
        path.style.opacity = '0.9';
        path.style.transform = 'scale(1.035)';
        const catItem = container.parentElement ? container.parentElement.querySelectorAll('.category-item')[idx] : null;
        if (catItem) catItem.classList.add('active');
        const mid = (a0 + a1) / 2;
        const midR = R - th / 2;
        const pX = c + midR * Math.cos(mid);
        const pY = c + midR * Math.sin(mid);

        const rect = svg.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const clientX = (pX / size) * rect.width + (rect.left - cRect.left);
        const clientY = (pY / size) * rect.height + (rect.top - cRect.top);

        const share = Math.round((d.value / total) * 100);
        const rows = [
          { label: 'Revenue Share', color: d.color, value: share + '%' },
          { label: 'Amount', value: o.formatTip ? o.formatTip(d.value) : fmt(d.value) }
        ];
        tip.show(clientX, clientY, d.label, rows);
      });

      path.addEventListener('mouseleave', () => {
        path.style.opacity = '1';
        path.style.transform = '';
        const catItem = container.parentElement ? container.parentElement.querySelectorAll('.category-item')[idx] : null;
        if (catItem) catItem.classList.remove('active');
        tip.hide();
      });

      a0 = a1;
    });

    // Center display
    const t1 = el('text', {
      x: c, y: c - 2,
      'text-anchor': 'middle',
      'font-size': '22',
      'font-weight': '800',
      fill: 'var(--foreground)',
      'font-family': 'var(--font-heading, var(--font-sans, inherit))'
    }, svg);
    t1.textContent = o.center || fmt(total);

    const t2 = el('text', {
      x: c, y: c + 18,
      'text-anchor': 'middle',
      'font-size': '11',
      fill: 'var(--muted-foreground)',
      'font-family': 'var(--font-sans, inherit)'
    }, svg);
    t2.textContent = o.sub || 'total share';

    container.appendChild(svg);
    return svg;
  };

  /* ---------------- Radar / Spider Chart ---------------- */
  Charts.radar = function (container, o) {
    if (!container) return;
    const cWidth = container.clientWidth || 300;
    const isMobile = cWidth < 380;
    const size = o.size || (isMobile ? 260 : 300);
    const c = size / 2;
    const R = isMobile ? 86 : 105;
    const axes = o.axes || [];
    const series = o.series || [];
    const svg = scaffold(size, size, 'radar-chart', 'xMidYMid meet');
    const max = o.max || Math.max(...series.flatMap(s => s.data), 100);
    const ang = i => (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const pt = (ri, i) => [c + ri * Math.cos(ang(i)), c + ri * Math.sin(ang(i))];
    const tip = createHtmlTooltip(container);

    // Concentric polygonal grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const ringR = (R * ring) / 4;
      const pts = axes.map((_, i) => pt(ringR, i).map(n => n.toFixed(1)).join(',')).join(' ');
      el('polygon', {
        points: pts,
        fill: 'none',
        stroke: 'var(--border)',
        'stroke-width': '1',
        'stroke-dasharray': '2 2',
        opacity: '0.7'
      }, svg);
    }

    // Radial spokes and axis labels
    axes.forEach((a, i) => {
      const p = pt(R, i);
      el('line', {
        x1: c, y1: c, x2: p[0], y2: p[1],
        stroke: 'var(--border)',
        'stroke-width': '1',
        opacity: '0.6'
      }, svg);

      const lp = pt(R + (isMobile ? 16 : 20), i);
      const t = el('text', {
        x: lp[0], y: lp[1] + 4,
        'text-anchor': 'middle',
        'font-size': isMobile ? '9.5' : '10.5',
        fill: 'var(--muted-foreground)',
        'font-family': 'var(--font-sans, inherit)',
        'font-weight': '600'
      }, svg);
      t.textContent = a;
    });

    // Radar series polygons & vertex points
    series.forEach(s => {
      const pts = s.data.map((v, i) => pt(R * (v / max), i));
      const ptStr = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');

      el('polygon', {
        points: ptStr,
        fill: s.color || 'var(--primary)',
        opacity: '0.2'
      }, svg);

      el('polygon', {
        points: ptStr,
        fill: 'none',
        stroke: s.color || 'var(--primary)',
        'stroke-width': '2.5'
      }, svg);

      pts.forEach((p, i) => {
        const dot = el('circle', {
          cx: p[0], cy: p[1], r: isMobile ? 3.5 : 4,
          fill: s.color || 'var(--primary)',
          stroke: 'var(--card, #fff)',
          'stroke-width': '1.5',
          style: 'cursor:pointer;transition:transform 0.15s ease;'
        }, svg);

        const showRadarTip = () => {
          dot.setAttribute('r', '6');
          const rect = svg.getBoundingClientRect();
          const cRect = container.getBoundingClientRect();
          const clientX = (p[0] / size) * rect.width + (rect.left - cRect.left);
          const clientY = (p[1] / size) * rect.height + (rect.top - cRect.top);

          const rows = [
            { label: s.name, color: s.color, value: (s.data[i] || 0) + ' / ' + max }
          ];
          tip.show(clientX, clientY, axes[i], rows);
        };

        const hideRadarTip = () => {
          dot.setAttribute('r', isMobile ? '3.5' : '4');
          tip.hide();
        };

        dot.addEventListener('mouseenter', showRadarTip);
        dot.addEventListener('mouseleave', hideRadarTip);
        dot.addEventListener('touchstart', showRadarTip, { passive: true });
        dot.addEventListener('touchend', hideRadarTip);
      });
    });

    container.appendChild(svg);
    return svg;
  };

  /* ---------------- Gauge ---------------- */
  Charts.gauge = function (container, o) {
    if (!container) return;
    const cWidth = container.clientWidth || 180;
    const isMobile = cWidth < 140;
    const size = o.size || (isMobile ? 120 : 180);
    const c = size / 2;
    const R = o.radius || (isMobile ? 46 : 70);
    const th = o.thickness || (isMobile ? 10 : 14);
    const svg = scaffold(size, size, 'gauge-chart', 'xMidYMid meet');
    const value = o.value || 0, max = o.max || 100;
    const frac = Math.min(1, Math.max(0, value / max));
    const start = Math.PI * 0.75, sweep = Math.PI * 1.5;

    const arc = (from, to, color, w) => {
      const p0 = [c + R * Math.cos(from), c + R * Math.sin(from)];
      const p1 = [c + R * Math.cos(to), c + R * Math.sin(to)];
      return el('path', {
        d: 'M' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) +
          ' A' + R + ',' + R + ' 0 ' + ((to - from) > Math.PI ? 1 : 0) + ' 1 ' +
          p1[0].toFixed(1) + ',' + p1[1].toFixed(1),
        fill: 'none',
        stroke: color,
        'stroke-width': w,
        'stroke-linecap': 'round'
      }, svg);
    };

    // Background track
    arc(start, start + sweep, 'var(--muted, #e2e8f0)', th);

    // Active progress arc
    if (frac > 0.01) {
      arc(start, start + sweep * frac, o.color || 'var(--primary)', th);
    }

    const t1 = el('text', {
      x: c, y: c + (isMobile ? 1 : 2),
      'text-anchor': 'middle',
      'font-size': isMobile ? '16' : '24',
      'font-weight': '800',
      fill: 'var(--foreground)',
      'font-family': 'var(--font-heading, var(--font-sans, inherit))'
    }, svg);
    t1.textContent = o.label || Math.round(frac * 100) + '%';

    const t2 = el('text', {
      x: c, y: c + (isMobile ? 14 : 20),
      'text-anchor': 'middle',
      'font-size': isMobile ? '8.5' : '11',
      fill: 'var(--muted-foreground)',
      'font-family': 'var(--font-sans, inherit)'
    }, svg);
    t2.textContent = o.sub || '';

    container.appendChild(svg);
    return svg;
  };

  /* ---------------- Mini Sparkline ---------------- */
  Charts.sparkline = function (container, o) {
    if (!container) return;
    const W = 110, H = 34;
    const data = o.data || [];
    if (!data.length) return;
    const min = Math.min(...data), max = Math.max(...data), span = (max - min) || 1;
    const pts = data.map((v, i) => [
      (i / Math.max(1, data.length - 1)) * W,
      H - 3 - ((v - min) / span) * (H - 8)
    ]);
    const svg = scaffold(W, H, 'sparkline-chart');
    const color = o.color || 'var(--primary)';

    if (o.fill !== false) {
      const areaPath = smoothPath(pts) + 'L' + W + ',' + H + 'L0,' + H + 'Z';
      el('path', {
        d: areaPath,
        fill: color,
        opacity: '0.14'
      }, svg);
    }

    el('path', {
      d: smoothPath(pts),
      fill: 'none',
      stroke: color,
      'stroke-width': '2',
      'stroke-linecap': 'round'
    }, svg);

    // Endpoint dot
    const last = pts[pts.length - 1];
    if (last) {
      el('circle', {
        cx: last[0], cy: last[1], r: 3,
        fill: color,
        stroke: 'var(--card, #fff)',
        'stroke-width': '1.2'
      }, svg);
    }

    container.appendChild(svg);
    return svg;
  };

  window.EmberCharts = Charts;
})();
