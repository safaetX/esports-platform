/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Exo 2"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'neon-cyan':   '#00f5ff',
        'neon-green':  '#39ff14',
        'neon-purple': '#bf5af2',
        'neon-pink':   '#ff375f',
        'slate-950':   '#0a0f1e',
        'slate-900':   '#0d1424',
        'slate-800':   '#111827',
        'slate-700':   '#1a2235',
        'slate-600':   '#243047',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 5px #00f5ff44, 0 0 10px #00f5ff22' },
          to:   { boxShadow: '0 0 20px #00f5ff88, 0 0 40px #00f5ff44' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}