export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: '#0b0a0a',
        soot: '#161414',
        brass: '#b08a46',
        ember: '#d8a657',
        stone: '#b8b0a3',
      },
      boxShadow: {
        library: '0 20px 60px rgba(0, 0, 0, 0.55)',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
