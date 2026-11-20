/**
 * Koklass-CMS "Ember" theme — Tailwind 3 extension.
 * Primary = logo pink #EC3876 (logo.svg).
 *
 * Usage in an app's tailwind.config.js:
 *   const theme = require('./Koklass-CMS/tailwind.theme.js');
 *   module.exports = { content: [...], darkMode: 'class',
 *     theme: { extend: { ...theme.theme.extend } } };
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ---- shadcn semantic contract (variable-driven, flips with .dark) ----
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        tertiary: { DEFAULT: 'var(--tertiary)', foreground: 'var(--tertiary-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        dark: { DEFAULT: 'var(--dark)', foreground: 'var(--dark-foreground)' },
        warning: { DEFAULT: 'var(--warning)', foreground: 'var(--warning-foreground)' },
        success: { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)' },
        info: { DEFAULT: 'var(--info)', foreground: 'var(--info-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },

        // ---- Raw Ember ramps (mode-independent) ----
        brand: {
          DEFAULT: '#EC3876',
          hover: '#D31255',
          dark: '#AF0D45',
          soft: '#FEE6EF',
          'on-soft': '#8D0C39',
          accent: '#FFC93C',
          'accent-hover': '#F5B820',
        },
        ember: {
          100: '#FEE6EF',
          200: '#FCC9DB',
          300: '#FA9EBE',
          400: '#F46697',
          500: '#EC3876',
          600: '#DD1359',
          700: '#AF0D45',
          800: '#840B35',
          900: '#5B0623',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          soft: '#FFF3D6',
          text: '#8A5A00',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          bright: '#2FBF71',
          soft: '#E4F5ED',
        },
        danger: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)', bright: '#F0564E', soft: '#FBE7E5' },
        info: { DEFAULT: 'var(--info)', foreground: 'var(--info-foreground)', soft: '#E4EEFC' },

        // ---- Neutral ramp (cool charcoal) ----
        neutral: {
          0: '#FFFFFF',
          25: '#FBFBFC',
          50: '#F7F8FA',
          100: '#EFF1F4',
          200: '#E3E6EB',
          300: '#CBD0D8',
          400: '#9AA2AE',
          500: '#6B7482',
          600: '#4E5563',
          700: '#3A4150',
          800: '#2A303C',
          850: '#242B36',
          900: '#1C222B',
          950: '#14181F',
          975: '#0E1218',
        },
      },

      borderColor: {
        DEFAULT: 'var(--border)',
      },

      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontWeight: {
        display: 800,
        heading: 700,
      },

      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: '24px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(16, 18, 24, 0.08)',
        DEFAULT: '0 2px 6px rgba(16, 18, 24, 0.08), 0 1px 2px rgba(16, 18, 24, 0.06)',
        lg: '0 12px 32px -8px rgba(16, 18, 24, 0.18)',
        dark: {
          sm: '0 1px 2px rgba(0, 0, 0, 0.45)',
          DEFAULT: '0 2px 6px rgba(0, 0, 0, 0.40), 0 1px 2px rgba(0, 0, 0, 0.35)',
          lg: '0 12px 32px -8px rgba(0, 0, 0, 0.60)',
        },
      },
    },
  },
}
