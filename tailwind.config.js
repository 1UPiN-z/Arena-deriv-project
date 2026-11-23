/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        deriv: {
          red: '#FF444F',
          'red-hover': '#E8323E',
          'red-active': '#CC2E39',
          ink: '#18262B',
          body: '#333333',
          muted: '#6B7280',
          band: '#F2F3F4',
          teal: '#4BB4B3',
          'teal-dark': '#389392',
          green: '#22A45D',
          'green-dark': '#1B8449',
          amber: '#F5A623',
          dark: '#0E0E0E',
          'dark-2': '#1A1A1A',
          'dark-3': '#242A2E',
          'dark-line': '#2E363B',
          line: '#E5E7EB',
          'line-dark': '#33393D',
        },
        profit: '#22A45D',
        loss: '#FF444F',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,38,43,0.04), 0 4px 16px rgba(24,38,43,0.06)',
        'card-hover': '0 2px 4px rgba(24,38,43,0.06), 0 12px 32px rgba(24,38,43,0.12)',
        dropdown: '0 8px 32px rgba(24,38,43,0.16)',
        dialog: '0 16px 64px rgba(24,38,43,0.24)',
        'inner-soft': 'inset 0 1px 2px rgba(24,38,43,0.05)',
      },
      borderRadius: {
        card: '14px',
        btn: '6px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        shimmer: {
          from: { backgroundPosition: '-400px 0' },
          to: { backgroundPosition: '400px 0' },
        },
        ticker: {
          '0%': { transform: 'translateY(2px)', opacity: '0.6' },
          '30%': { transform: 'translateY(-1px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-down': 'fade-down 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-left': 'slide-in-left 0.35s cubic-bezier(0.22,1,0.36,1) both',
        marquee: 'marquee 40s linear infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        ticker: 'ticker 0.3s ease both',
      },
    },
  },
  plugins: [],
};
