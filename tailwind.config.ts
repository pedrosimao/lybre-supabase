import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: '#ffffff',
        input: '#ffffff',
        ring: '#14b8a6',
        background: '#0a1520',
        foreground: '#e5e7eb',
        primary: {
          DEFAULT: '#14b8a6',
          foreground: '#fff',
        },
        secondary: {
          DEFAULT: '#ffffff',
          foreground: '#e5e7eb',
        },
        destructive: {
          DEFAULT: '#f87171',
          foreground: '#fff',
        },
        muted: {
          DEFAULT: '#ffffff',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#e5e7eb',
        },
        popover: {
          DEFAULT: '#141e30',
          foreground: '#e5e7eb',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#e5e7eb',
        },
        'green-primary': '#14b8a6',
        'green-light': '#2dd4bf',
        'red-primary': '#f87171',
        'red-light': '#fca5a5',
        chart: {
          '1': '#7c3aed',
          '2': '#2563eb',
          '3': '#0891b2',
          '4': '#ca8a04',
          '5': '#dc2626',
        },
        sidebar: {
          DEFAULT: '#0f1736',
          foreground: '#fafafa',
          primary: '#7c3aed',
          'primary-foreground': '#fafafa',
          accent: '#ffffff',
          'accent-foreground': '#fafafa',
          border: '#ffffff',
          ring: '#52525b',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
