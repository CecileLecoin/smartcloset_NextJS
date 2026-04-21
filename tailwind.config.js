/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        card: '#FFFFFF',
        primary: { DEFAULT: '#FF6B8A', soft: 'rgba(255,107,138,0.1)' },
        secondary: { DEFAULT: '#7C5CFC', soft: 'rgba(124,92,252,0.08)' },
        accent: { DEFAULT: '#00D4AA', soft: 'rgba(0,212,170,0.1)' },
        affiliate: { DEFAULT: '#FFE566', soft: 'rgba(255,229,102,0.2)' },
        dim: '#8E8EA0',
        border: '#F0F0F5',
        dark: '#1A1A2E',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        lg: '12px',
        md: '8px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        elevated: '0 4px 20px rgba(0,0,0,0.08)',
        glow: '0 6px 24px rgba(255,107,138,0.35)',
      },
    },
  },
  plugins: [],
};
