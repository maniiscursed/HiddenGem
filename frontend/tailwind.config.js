/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
           50: '#fcf3f8',
          100: '#fae4f0',
          200: '#f6cae2',
          300: '#f0a2cc',
          400: '#e66baf',
          500: '#da4293',
          600: '#c52473',
          700: '#a7195b',
          800: '#8b164c',
          900: '#741742',
        }
      }
    },
  },
  plugins: [],
}
