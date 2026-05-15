import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        // surface
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        'bg-overlay': 'rgb(var(--bg-overlay) / <alpha-value>)',
        // text
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',
        'fg-on-accent': 'rgb(var(--fg-on-accent) / <alpha-value>)',
        // line
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        // accent (brand)
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          fg: 'rgb(var(--fg-on-accent) / <alpha-value>)',
          subtle: 'rgb(var(--accent-subtle) / <alpha-value>)',
          ring: 'rgb(var(--accent) / <alpha-value>)',
        },
        // status
        success: {
          bg: 'rgb(var(--success-bg) / <alpha-value>)',
          fg: 'rgb(var(--success-fg) / <alpha-value>)',
          border: 'rgb(var(--success-border) / <alpha-value>)',
        },
        warning: {
          bg: 'rgb(var(--warning-bg) / <alpha-value>)',
          fg: 'rgb(var(--warning-fg) / <alpha-value>)',
          border: 'rgb(var(--warning-border) / <alpha-value>)',
        },
        critical: {
          bg: 'rgb(var(--critical-bg) / <alpha-value>)',
          fg: 'rgb(var(--critical-fg) / <alpha-value>)',
          border: 'rgb(var(--critical-border) / <alpha-value>)',
        },
        info: {
          bg: 'rgb(var(--info-bg) / <alpha-value>)',
          fg: 'rgb(var(--info-fg) / <alpha-value>)',
          border: 'rgb(var(--info-border) / <alpha-value>)',
        },
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        // Fluent 2 elevation 매핑 (key + ambient 합성 근사)
        e2: '0 1px 2px rgb(var(--shadow) / 0.10), 0 0 1px rgb(var(--shadow) / 0.08)',
        e4: '0 2px 4px rgb(var(--shadow) / 0.10), 0 0 2px rgb(var(--shadow) / 0.08)',
        e8: '0 4px 8px rgb(var(--shadow) / 0.12), 0 0 2px rgb(var(--shadow) / 0.10)',
        e16: '0 8px 16px rgb(var(--shadow) / 0.14), 0 0 2px rgb(var(--shadow) / 0.10)',
        e28: '0 14px 28px rgb(var(--shadow) / 0.18), 0 0 4px rgb(var(--shadow) / 0.10)',
        e64: '0 32px 64px rgb(var(--shadow) / 0.22), 0 0 6px rgb(var(--shadow) / 0.12)',
      },
      transitionDuration: {
        100: '100ms',
        150: '150ms',
        200: '200ms',
        250: '250ms',
        300: '300ms',
        400: '400ms',
      },
      transitionTimingFunction: {
        'ease-out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'ease-in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
