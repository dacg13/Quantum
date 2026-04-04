/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#050508',
        deep: '#080b12',
        cyan: '#00d4ff',
        violet: '#7b5ea7',
        gold: '#f0c040',
        amber: '#ff9a3c',
        'quantum-green': '#00ffb3',
        'quantum-red': '#ff4e6a',
      },
      fontFamily: {
        'bebas': ['"Bebas Neue"', 'sans-serif'],
        'mono': ['"Space Mono"', 'monospace'],
        'serif': ['"DM Serif Display"', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
