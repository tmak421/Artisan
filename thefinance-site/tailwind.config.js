/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary':  '#0A0A0A',
        'bg-surface':  '#141414',
        'bg-elevated': '#1E1E1E',
        'txt-primary': '#E8E8E8',
        'txt-heading': '#FFFFFF',
        'accent-green':'#00CC66',
        'accent-amber':'#FFB800',
        'accent-red':  '#FF3B3B',
        'accent-gold': '#C8A000',
        'border-sub':  '#2A2A2A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
