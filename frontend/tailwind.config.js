/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        lc: {
          bg: '#1a1a1a',
          card: '#282828',
          cardHover: '#323232',
          border: '#3e3e3e',
          orange: '#ffa116',
          orangeDark: '#ff8c00',
          easy: '#00b8a3',
          medium: '#ffc01e',
          hard: '#ff375f',
          textMuted: '#9e9e9e',
        }
      }
    },
  },
  plugins: [],
}
