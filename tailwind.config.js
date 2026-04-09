/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          bg: '#0A0E1A',
          card: '#0F1425',
          card2: '#141A2E',
          border: '#1A2040',
          green: '#00FFA3',
          warn: '#FFB800',
          red: '#FF4D4D',
          blue: '#4D9FFF',
          purple: '#B76FFF',
          text: '#C8CCD8',
          dim: '#5A6080',
          white: '#F0F2F8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
