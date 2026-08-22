/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          muted: '#374151',
        },
        leetcode: {
          easy: '#00B8A3',
          medium: '#FFC01E',
          hard: '#FF375F',
        }
      }
    },
  },
  plugins: [],
}
