/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#08090a',
        surface: '#0f1013',
        'surface-raised': '#15171c',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-hover': 'rgba(255, 255, 255, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
