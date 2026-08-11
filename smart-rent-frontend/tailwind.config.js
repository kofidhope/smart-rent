/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {

      // ── Brand colors ─────────────────────────────
      colors: {
        brand: {
          green:  '#1D9E75',
          dark:   '#0F6E56',
          light:  '#E8F5F0',
          lighter: '#F4FAF8',
        },

        // ── Semantic tokens ───────────────────────
        // Use these instead of raw color values
        // so changing a color updates everywhere
        success: {
          bg:     '#F0FDF4',
          border: '#BBF7D0',
          text:   '#166534',
          icon:   '#22C55E',
        },
        warning: {
          bg:     '#FFFBEB',
          border: '#FDE68A',
          text:   '#92400E',
          icon:   '#F59E0B',
        },
        danger: {
          bg:     '#FEF2F2',
          border: '#FECACA',
          text:   '#991B1B',
          icon:   '#EF4444',
        },
        info: {
          bg:     '#EFF6FF',
          border: '#BFDBFE',
          text:   '#1E40AF',
          icon:   '#3B82F6',
        },
      },

      // ── Box shadows — three elevation levels ─────
      // card-rest:   static content, no interaction
      // card-hover:  interactive cards on hover
      // card-active: modals, dropdowns, active state
      boxShadow: {
        'card-rest':
            '0 1px 3px 0 rgb(0 0 0 / 0.08), ' +
            '0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover':
            '0 4px 12px 0 rgb(0 0 0 / 0.10), ' +
            '0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'card-active':
            '0 10px 25px -3px rgb(0 0 0 / 0.12), ' +
            '0 4px 6px -2px rgb(0 0 0 / 0.05)',
        'nav':
            '0 1px 0 0 rgb(0 0 0 / 0.08)',
      },

      // ── Font family ───────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // ── Font sizes — explicit type scale ─────────
      // Every text size used in the app is named here
      fontSize: {
        'display':  ['2.25rem', { lineHeight: '2.5rem',  fontWeight: '700' }],
        'page':     ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'section':  ['1.25rem',  { lineHeight: '1.75rem', fontWeight: '600' }],
        'card-title':['1rem',   { lineHeight: '1.5rem',  fontWeight: '600' }],
        'body':     ['0.875rem', { lineHeight: '1.5rem',  fontWeight: '400' }],
        'meta':     ['0.75rem',  { lineHeight: '1rem',   fontWeight: '400' }],
      },

      // ── Border radius ─────────────────────────────
      borderRadius: {
        'card': '0.75rem',
        'btn':  '0.5rem',
        'badge': '9999px',
      },

      // ── Transitions ───────────────────────────────
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out':    'cubic-bezier(0.0, 0, 0.2, 1)',
        'in':     'cubic-bezier(0.4, 0, 1, 1)',
      },

      // ── Spacing scale ────────────────────────────
      // Tokenized spacing stops so pages don't reach
      // for arbitrary `mt-[13px]` values mid-flight.
      spacing: {
        '1':  '0.25rem',
        '2':  '0.5rem',
        '3':  '0.75rem',
        '4':  '1rem',
        '5':  '1.25rem',
        '6':  '1.5rem',
        '8':  '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },

      // ── Z-index scale ────────────────────────────
      // Centralised so nothing reaches for z-[9999].
      zIndex: {
        'base':    '0',
        'raised':  '10',
        'sticky':  '20',
        'overlay': '40',
        'modal':   '50',
        'toast':   '60',
      },
    },
  },
  plugins: [],
}