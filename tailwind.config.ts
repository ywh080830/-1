import type { Config } from 'tailwindcss';

/**
 * Tailwind 配置：所有颜色均引用 design token（src/styles/tokens.css）中的 RGB 三元组，
 * 以便使用 `bg-primary/10` 等透明度语法；主题切换由 `[data-theme="dark"]` 驱动 CSS 变量。
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'primary-deep': 'rgb(var(--color-primary-deep-rgb) / <alpha-value>)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-pressed': 'var(--color-primary-pressed)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        'secondary-hover': 'var(--color-secondary-hover)',
        cta: 'rgb(var(--color-cta-rgb) / <alpha-value>)',
        'cta-hover': 'var(--color-cta-hover)',
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2-rgb) / <alpha-value>)',
        text: 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        'border-strong': 'var(--color-border-strong)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        income: 'rgb(var(--color-income-rgb) / <alpha-value>)',
        expense: 'rgb(var(--color-expense-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        error: 'rgb(var(--color-error-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"HarmonyOS Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        body: ['"HarmonyOS Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['34px', { lineHeight: '1.15', fontWeight: '800' }],
        h1: ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.6' }],
        caption: ['12px', { lineHeight: '1.5' }],
        overline: ['11px', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '22px',
        xl: '30px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(20 22 31 / 0.05), 0 4px 14px rgb(20 22 31 / 0.05)',
        pop: '0 12px 32px rgb(20 22 31 / 0.14), 0 4px 10px rgb(20 22 31 / 0.08)',
        fab: '0 8px 24px rgb(124 92 252 / 0.40), 0 2px 6px rgb(124 92 252 / 0.25)',
        glass: '0 8px 32px rgb(20 22 31 / 0.06)',
        'glass-lg': '0 16px 48px rgb(20 22 31 / 0.10)',
      },
      transitionDuration: {
        fast: '0.14s',
        base: '0.22s',
        slow: '0.34s',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatIn: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.26s var(--ease-out)',
        'pop-in': 'popIn 0.28s var(--ease-spring)',
        'float-in': 'floatIn 0.3s var(--ease-out)',
        scanline: 'scanline 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
