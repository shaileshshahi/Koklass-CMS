# Koklass-CMS — Ember Theme (standalone, portable)

A self-contained design theme meant to be **copied into any project** and adopted
there — no wiring to any repo in this workspace is included, by design.

**Primary color is the Koklass logo pink `#EC3876`** (from `logo.svg`).

## Files

| File | Copy it when the target project uses… |
|---|---|
| `theme.json` | Always (source of truth — palette, type, radius, shadows, light+dark) |
| `tailwind.theme.js` | Tailwind 3 — shadcn variable contract (`--primary`, `--background`, `--card`, `--accent`, `.dark`) **plus** raw `brand.* / ember.* / neutral.*` ramps |
| `ember-variables.css` | Plain CSS variables in hex — light + `.dark` shims |
| `ember-variables-hsl.css` | Same palette as HSL triplets (`220 20% 15%`), for shadcn setups that wrap in `hsl(var(--x))` |
| `ember-admin.scss` | Laravel/Livewire + Bootstrap admin panels |
| `admin-demo.css` | Demo-only component styles for the HTML samples |
| `admin-demo.js` | Runtime theming: loads/saves config in `localStorage`, exposes `getThemeConfig` / `applyThemeDraft`; also dark-mode toggle, toast, `openModal()` confirm dialog, and the **custom dropdown engine** (`bindDropdown(el, options, onChange)` — theme-matched menus with check marks, keyboard/Esc close, auto drop-up, hidden-input binding) that replaces native `<select>` popups on every page |
| `admin-sidebar.js` | Shared side panel: every shell page just places `<aside class="sidebar" data-sidebar-active="<nav id>"></aside>` and includes this script before `admin-demo.js`. The **collapse button** turns it into an icon rail (titles become hover tooltips; state persists in `localStorage` under `koklass-nav-collapsed`; clicking a group icon expands and opens it). Expandable submenus, rotating chevrons, and active-state highlighting included; unwired entries show a toast |
| `config-theme.html` | **Configs ▸ Theme config** — edit name, logo, primary color, default mode with live preview |
| `admin-charts.js` | Dependency-free SVG chart helpers (`window.EmberCharts`): `.area()`, `.bars()` (grouped/stacked), `.donut()`, `.radar()`, `.gauge()`, `.sparkline()` — responsive, theme-token colored, with hover tooltips; auto-re-renders on dark-mode flip |
| `config-list.html` | **Configs ▸ Config list** — search, custom-dropdown filters, sortable columns, bulk actions, pagination, delete modal |
| `config-create.html` | **Configs ▸ Create config** — validated form, type-driven value editor (string/number/boolean/JSON/color), API preview |
| `config-edit.html` | **Configs ▸ Edit config** — prefilled record, type-aware editor, audit log, danger zone |
| `forms-sample.html` | **Configs ▸ Forms** — every form component: inputs, input groups/addons, custom dropdowns, checkboxes/radios, switches, date/time/month/week/color, range, tags, OTP, rating, dropzone, char counter, validation states |
| `graphs-sample.html` | **Configs ▸ Graphs** — KPI sparklines, area/line, grouped & stacked bars, donut, radar, radial gauges, progress bars (SVG, theme-aware, tooltips) |
| `login.html` | Sample: username + password sign-in |
| `dashboard.html` | Sample: stats, chart, activity feed |
| `employee-list.html` | Sample: filterable table, delete modal, pagination |
| `employee-create.html` | Sample: validation + new record appears in list |
| `employee-edit.html` | Sample: prefilled form, password-reset, danger zone |
| `sample.html` | Palette/tokens swatch tour |

## Palette "Ember" (anchored on the logo)

- Primary `#EC3876` (logo pink) · dark mode `#F34F87` · hover `#D31255` · deep `#AF0D45`
- Ember ramp `#FEE6EF → #5B0623` (100–900, all on the logo hue 339°)
- Accent gold `#FFC93C` · Success `#16885C`/`#2FBF71` · Warning `#FFB020`
- Danger `#D0342C`/`#F0564E` · Info `#2270E0`
- Neutrals: cool charcoal ramp `#F7F8FA → #0E1218`
- Radius: `--radius` 0.75rem (8–24px scale) · Font: **Nunito** fallback
  (swap to the target project's font by editing `--font-sans` / `fontFamily.sans`)

## How to adopt in a new project (pick what you need)

### Tailwind 3 project
```js
// tailwind.config.js
const theme = require('./Koklass-CMS/tailwind.theme.js'); // copy folder in first
module.exports = {
  content: [...],
  darkMode: 'class',
  theme: { extend: { ...theme.theme.extend } },
};
```
Then import the matching variable shim once in your global stylesheet:
- hex variables → `ember-variables.css`
- `hsl(var())` variables → `ember-variables-hsl.css`

### Laravel (Livewire/Blade)
```scss
// resources/sass/app.scss
@import '../../Koklass-CMS/ember-admin.scss';
```

### React / plain CSS
```css
@import './Koklass-CMS/ember-variables.css';
```

## Adapting to a project's variable names

The shims use the shadcn convention. If the target project names variables
differently (e.g. `--color-brand`), either rename the keys in the shim file
after copying, or add one aliasing rule:

```css
:root { --color-brand: var(--primary); }
```

## Customizing

### Static (code-level)
Change colors in `theme.json` first (it's the record), then mirror the same
values into whichever shim files you copied. Ramp steps live in
`tailwind.theme.js` (`ember.*`, `neutral.*`) if you want a different ramp shape.

### Runtime (end-user configurable)
`config-theme.html` edits three knobs — **brand name, logo, primary color** —
plus a default appearance mode, persisted in `localStorage` under
`koklass-theme-config`. Any page including `admin-demo.js` applies it before
paint: elements tagged `data-brand-name` / `data-brand-logo` are updated, and
`--primary`, `--primary-hover`, `--primary-soft`, `--on-primary-soft`, `--ring`,
`--focus-ring` are recomputed (separately for light and dark) from the chosen
color via HSL derivation. Tag your own elements with those two data attributes
to make them follow the config.

When the chosen color differs from the default `#EC3876`, the theme goes
**full-surface**: page background, sidebar (brand-tinted gradient), cards,
inputs, badges, and the login-page glow are remixed from the brand color in
both light and dark mode — the whole chrome matches the theme, not just the
accent. Reset the color to Koklass pink and the original fixed look returns.

To port runtime theming into a real app: store the config on your backend
(the Laravel `Config` table's `site color` JSON row already fits), serve it on
every page load, and call `applyThemeDraft(cfg)` from `admin-demo.js`.

### Shared side panel (no more copy-pasted sidebars)
`admin-sidebar.js` is the single source of truth for the navigation. A page
only writes the shell slot and its active nav id:

```html
<aside class="sidebar" data-sidebar-active="employee-list"></aside>
<script src="./admin-sidebar.js"></script>
<script src="./admin-demo.js"></script>
```

Expandable submenus are declared as `children` in the `NAV` array at the top
of `admin-sidebar.js` — Employees ▸ List / Create ships as an example. The
chevron rotates, open/closed state persists per group in `localStorage`
(`koklass-nav-state`), and the active child highlights its parent group.
Unwired entries show a "not wired yet" toast. Add a page there once and
every page in the app gets it.

### Collapsible (icon rail) sidebar
The minimize button at the bottom of the panel toggles a 68px icon rail:
labels hide, the toggle arrow flips, and hovering an icon shows a floating
tooltip with the page name. The choice persists (`koklass-nav-collapsed`),
and clicking a group icon expands the panel and opens that group. The
state logic reads back from the class list (not the toggle return value),
so clicks and page reloads always stay in sync.

### Navigation structure
- **Main** — Dashboard, Employees, Orders, Menu
- **Configs** — Theme config (the real, working settings page)
- **Theme** — one section holding two expandable modules:
  - **Samples ▸** List / Create / Edit — dummy CRUD pages to copy from.
    They carry a "Dummy data" notice; their markup is the starting point
    for real pages in a target project.
  - **Elements ▸** Forms (all form controls) / Graphs (all chart types).
