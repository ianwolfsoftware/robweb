import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a251d',
        moss: '#2f5945',
        clay: '#b75732',
        sand: '#f2ecdf',
        chalk: '#fffdf7',
      },
      boxShadow: {
        card: '0 16px 42px rgba(26, 37, 29, 0.13)',
      },
    },
  },
  plugins: [],
} satisfies Config;
