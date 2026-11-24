(function () {
  'use strict';

  /* ============================ Shared sidebar ==============================
     One source of truth for the admin side panel. Every shell page places:

         <aside class="sidebar" data-sidebar-active="dashboard"></aside>
         <script src="./admin-sidebar.js"></script>   (before admin-demo.js)
         <script src="./admin-demo.js"></script>

     `data-sidebar-active` = the NAV id of the page (e.g. "employee-list").
     A page inside an expandable group auto-highlights its group.

     Groups: Main · Configs (Theme config) · Theme (expandable Samples ▸
     List / Create / Edit and Elements ▸ Forms / Graphs modules).
     The minimize button collapses the panel to an icon rail — the rail shows
     titles as tooltips on hover and persists in localStorage under
     `koklass-nav-collapsed`. Open/closed groups persist under
     `koklass-nav-state`. Unwired pages show a toast on click.       */

  var NAV = [
    {
      group: 'Main',
      items: [
        {
          id: 'dashboard', label: 'Dashboard', href: './dashboard.html',
          icon: 'M3 3h7v9H3ZM14 3h7v5h-7ZM14 12h7v9h-7ZM3 16h7v5H3Z'
        },
        {
          id: 'employees', label: 'Employees', href: './employee-list.html',
          icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM23 21v-2a4 4 0 0 0-3-3.87'
        },
        {
          id: 'orders', label: 'Orders', href: './orders.html',
          icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'
        },
        {
          id: 'menu', label: 'Menu', href: './menu.html',
          icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        },
      ],
    },
    {
      group: 'Configs',
      items: [
        {
          id: 'configs-theme', label: 'Theme config', href: './config-theme.html',
          icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z'
        },
      ],
    },
    {
      group: 'Theme',
      items: [
        {
          id: 'theme-samples', label: 'Samples', href: null,
          icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
          children: [
            { id: 'configs-list', label: 'List', href: './config-list.html' },
            { id: 'configs-create', label: 'Create', href: './config-create.html' },
            { id: 'configs-edit', label: 'Edit', href: './config-edit.html' },
          ],
        },
        {
          id: 'theme-elements', label: 'Elements', href: null,
          icon: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5',
          children: [
            { id: 'ui-forms', label: 'Forms', href: './forms-sample.html' },
            { id: 'ui-graphs', label: 'Graphs', href: './graphs-sample.html' },
          ],
        },
      ],
    },
  ];

  var STATE_KEY = 'koklass-nav-state';
  var COLLAPSE_KEY = 'koklass-nav-collapsed';

  function getOpenState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function setOpenState(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { }
  }

  function icon(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="' + d + '"/></svg>';
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  function render() {
    /* The shell slot: <aside class="sidebar" data-sidebar-active="...">. */
    var aside = document.querySelector('aside.sidebar[data-sidebar-active]');
    if (!aside) return;

    // Early theme check: ensure --primary is assigned before generating sidebar markup
    try {
      var rawCfg = localStorage.getItem('koklass-theme-config');
      if (rawCfg) {
        var parsed = JSON.parse(rawCfg);
        if (parsed && parsed.primary) {
          var root = document.documentElement;
          var curPrimary = root.style.getPropertyValue('--primary');
          if (!curPrimary || curPrimary.trim() !== parsed.primary) {
            root.style.setProperty('--primary', parsed.primary);
            root.style.setProperty('--ring', parsed.primary);
            root.style.setProperty('--sidebar-hover', 'color-mix(in srgb, ' + parsed.primary + ' 8%, transparent)');
            root.style.setProperty('--primary-soft', 'color-mix(in srgb, ' + parsed.primary + ' 10%, #FFFFFF)');
          }
        }
      }
    } catch (e) { }

    var activeId = (aside.getAttribute('data-sidebar-active') || '').trim();

    // Canonical alias normalization
    var ALIAS_MAP = {
      'employee-list': 'employees',
      'employee-create': 'employees',
      'employee-edit': 'employees',
      'employee': 'employees',
      'theme-config': 'configs-theme',
      'config-theme': 'configs-theme'
    };
    if (ALIAS_MAP[activeId]) {
      activeId = ALIAS_MAP[activeId];
    }

    // Current page filename for fallback URL matching
    var curFile = '';
    try {
      var pathname = window.location.pathname.toLowerCase();
      curFile = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
      if (!curFile || curFile === 'index.html') curFile = 'dashboard.html';
    } catch (e) {
      curFile = '';
    }

    function isHrefMatch(href) {
      if (!href || !curFile) return false;
      var target = href.substring(href.lastIndexOf('/') + 1).toLowerCase();
      return target && target === curFile;
    }

    var open = getOpenState();
    var collapsed = false;
    try { collapsed = localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch (e) { }
    var parts = [];

    parts.push(
      '<div class="sidebar-brand">'
      + '<a href="./dashboard.html" class="sidebar-brand-link" title="Koklass Dashboard">'
      + '<div class="brand-mark">'
      + '<svg data-brand-logo viewBox="0 0 47.068 41.637" style="width:22px;height:auto;display:block;" fill="currentColor" aria-hidden="true">'
      + '<path d="M5891.241,47.992a2.175,2.175,0,0,1,0-2.607l2.909-3.819L5912.71,16.1h-14.216a5.3,5.3,0,0,0-4.241,2.111l-14.834,19.333-3.183,4.155a.836.836,0,0,1-1.189.134.868.868,0,0,1-.316-.663v-18.7a3.3,3.3,0,0,0-1.162-2.522,3.523,3.523,0,0,0-.4-.294L5872,18.924h6.427a3.044,3.044,0,0,1,3.016,3.062V29.98l2.787-3.644V19.156l4.017-3.057h-18.124l-4.479,5.641h.125l5.725.246a.459.459,0,0,1,.357.18.479.479,0,0,1,.1.289V45.772a2.069,2.069,0,0,0,1.394,1.988,2.146,2.146,0,0,0,.688.118,2.022,2.022,0,0,0,1.608-.814l19.741-25.75a5.994,5.994,0,0,1,4.8-2.366h6.864L5892.394,39.3l-2.589,3.374a1.633,1.633,0,0,1-1.176.672,1.551,1.551,0,0,1-1.346-.63l-2.058-3.015-1.762,2.31,3.718,5.177a1.964,1.964,0,0,0,.167.18h0l7.63,10.369.055-.081a3.921,3.921,0,0,0-.041-4.6Z" transform="translate(-5865.643 -16.099)"/>'
      + '</svg>'
      + '</div>'
      + '<div class="brand-text"><div class="brand-name" data-brand-name>Koklass</div><div class="brand-sub">Admin panel</div></div>'
      + '</a>'
      + '<button type="button" class="sidebar-close-btn" aria-label="Close navigation">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '</div>'
      + '<nav class="sidebar-scroll" aria-label="Sidebar">'
    );

    NAV.forEach(function (section) {
      parts.push('<div class="nav-group"><span>' + section.group + '</span></div>');
      section.items.forEach(function (item) {
        var hasChildren = !!(item.children && item.children.length);
        var selfActive = item.id === activeId || isHrefMatch(item.href) || (item.id === 'employees' && curFile.indexOf('employee') === 0);
        var child = hasChildren
          ? item.children.filter(function (c) { return c.id === activeId || isHrefMatch(c.href); })[0]
          : null;
        var childActive = !!child;
        var idForState = childActive ? item.id + ':' + child.id : item.id;

        if (!hasChildren) {
          var href = item.href ? ' href="' + item.href + '"' : '';
          var toast = item.href ? '' : ' data-toast="Demo: ' + esc(item.label) + ' is not wired yet"';
          parts.push(
            '<a class="nav-link' + (selfActive ? ' active' : '') + '"'
            + href + toast + ' data-tip="' + esc(item.label) + '">'
            + icon(item.icon) + '<span class="nav-label">' + item.label + '</span></a>'
          );
          return;
        }

        /* Expandable group: if a child is active, the group is always open so the user sees the highlighted page */
        var isOpen = childActive || (open[item.id] !== undefined ? !!open[item.id] : false);
        var subItems = item.children.map(function (c) {
          var isThisChildActive = c.id === activeId || isHrefMatch(c.href);
          var subCls = isThisChildActive ? 'nav-sub-link active' : 'nav-sub-link';
          var subHref = c.href ? ' href="' + c.href + '"' : '';
          var subToast = c.href ? '' : ' data-toast="Demo: ' + esc(c.label) + ' is not wired yet"';
          return '<a class="' + subCls + '"' + subHref + subToast + '><span>' + c.label + '</span></a>';
        }).join('');

        parts.push(
          '<div class="nav-item' + (isOpen ? ' open' : '') + (selfActive || childActive ? ' has-active' : '') + '" data-id="' + item.id + '">'
          + '<button type="button" class="nav-link nav-toggle" aria-expanded="' + (isOpen ? 'true' : 'false') + '" '
          + 'aria-controls="nav-sub-' + item.id + '" data-tip="' + esc(item.label) + '">'
          + icon(item.icon) + '<span class="nav-label">' + item.label + '</span>'
          + '<svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
          + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
          + '</button>'
          + '<div class="nav-sub" id="nav-sub-' + item.id + '"' + (isOpen ? '' : ' hidden') + '>' + subItems + '</div>'
          + '</div>'
        );
      });
    });

    parts.push(
      '</nav>'
      + '<div class="sidebar-bottom">'
      + '<button type="button" class="sidebar-toggle" aria-label="' + (collapsed ? 'Expand sidebar' : 'Collapse sidebar') + '" data-tip="' + (collapsed ? 'Expand' : 'Collapse') + '">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (collapsed ? 'm13 17 5-5-5-5M6 17l5-5-5-5' : 'm11 17-5-5 5-5M18 17l-5-5 5-5') + '"/></svg>'
      + '<span class="nav-label">' + (collapsed ? 'Expand' : 'Collapse') + '</span>'
      + '</button>'
      + '<div class="sidebar-foot">v1.2.0 · Ember theme</div>'
      + '</div>'
    );
    aside.innerHTML = parts.join('');
    aside.classList.toggle('collapsed', collapsed);

    /* Mobile drawer setup: backdrop overlay + hamburger in topbar */
    var backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    function closeMobileSidebar() {
      aside.classList.remove('mobile-open');
      backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-drawer-open');
    }

    backdrop.addEventListener('click', closeMobileSidebar);

    /* Interactions: close button + expand/collapse + minimize + unwired-toast, delegated. */
    aside.addEventListener('click', function (e) {
      /* Mobile drawer close button */
      var closeBtn = e.target.closest('.sidebar-close-btn');
      if (closeBtn) {
        closeMobileSidebar();
        e.preventDefault();
        return;
      }

      /* Minimize / restore */
      var sbToggle = e.target.closest('.sidebar-toggle');
      if (sbToggle) {
        aside.classList.toggle('collapsed');
        var nowCollapsed = aside.classList.contains('collapsed');
        sbToggle.setAttribute('data-tip', nowCollapsed ? 'Expand' : 'Collapse');
        sbToggle.setAttribute('aria-label', nowCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
        var lbl = sbToggle.querySelector('.nav-label');
        if (lbl) lbl.textContent = nowCollapsed ? 'Expand' : 'Collapse';
        var ic = sbToggle.querySelector('svg path');
        if (ic) ic.setAttribute('d', nowCollapsed ? 'm13 17 5-5-5-5M6 17l5-5-5-5' : 'm11 17-5-5 5-5M18 17l-5-5 5-5');
        try { localStorage.setItem(COLLAPSE_KEY, String(nowCollapsed)); } catch (err) { }
        var resizeEvt = new Event('ember:sidebar-toggle');
        window.dispatchEvent(resizeEvt);
        e.preventDefault();
        return;
      }

      var toggle = e.target.closest('.nav-toggle');
      if (toggle) {
        var itemEl = toggle.closest('.nav-item');
        /* Icon-rail mode: clicking a group expands the panel and opens it. */
        if (aside.classList.contains('collapsed')) {
          aside.classList.remove('collapsed');
          try { localStorage.setItem(COLLAPSE_KEY, 'false'); } catch (err) { }
          itemEl.classList.add('open');
          var subNow = itemEl.querySelector('.nav-sub');
          if (subNow) subNow.hidden = false;
          var gid = itemEl.getAttribute('data-id');
          if (gid) { open[gid] = true; setOpenState(open); }
          e.preventDefault();
          return;
        }
        var isOpenNow = itemEl.classList.toggle('open');
        var sub = itemEl.querySelector('.nav-sub');
        if (sub) sub.hidden = !isOpenNow;
        toggle.setAttribute('aria-expanded', String(isOpenNow));
        var id = itemEl.getAttribute('data-id');
        if (id) { open[id] = isOpenNow; setOpenState(open); }
        e.preventDefault();
        return;
      }
      var dead = e.target.closest('[data-toast]');
      if (dead && typeof window.showToast === 'function') {
        e.preventDefault();
        window.showToast(dead.getAttribute('data-toast'));
      }
    });

    var topbar = document.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.mobile-menu-btn')) {
      var mobileBtn = document.createElement('button');
      mobileBtn.type = 'button';
      mobileBtn.className = 'icon-btn mobile-menu-btn';
      mobileBtn.setAttribute('aria-label', 'Toggle navigation menu');
      mobileBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      mobileBtn.addEventListener('click', function () {
        var isOpen = aside.classList.toggle('mobile-open');
        backdrop.classList.toggle('active', isOpen);
        document.body.classList.toggle('sidebar-drawer-open', isOpen);
      });
      topbar.prepend(mobileBtn);
    }

    // Auto-close mobile drawer when any navigational link is clicked
    aside.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        var link = e.target.closest('a.nav-link, a.nav-sub-link');
        if (link && link.getAttribute('href')) {
          closeMobileSidebar();
        }
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && aside.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    });
  }

  /* The script tag sits at the end of <body>, so the <aside> already exists.
     Render immediately, BEFORE admin-demo.js runs, so brand/logo hooks
     (data-brand-name, data-brand-logo) are in place when the theme applies. */
  render();

  window.EMBER_SIDEBAR = { NAV: NAV, render: render };
})();
