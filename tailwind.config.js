/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        western: {
          dark: '#120f0d',
          sand: '#d2b48c',
          wood: '#4a2e18',
          leather: '#8b4513',
          sepia: '#704214',
          gold: '#c5a059',
          amber: '#d97706',
          brass: '#b5a642',
          ink: '#1c1917',
          parchment: '#fdf6e2'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}

