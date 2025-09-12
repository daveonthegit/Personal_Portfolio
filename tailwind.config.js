/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./src/**/*.{js,ts}",
    "./static/**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CTOS Neon Cyan/Blue
        primary: {
          50: '#e6ffff',
          100: '#b3ffff',
          200: '#80ffff',
          300: '#4dffff',
          400: '#1affff',
          500: '#00e6e6',
          600: '#00b3b3',
          700: '#008080',
          800: '#004d4d',
          900: '#001a1a',
        },
        // CTOS Orange/Amber Accent
        secondary: {
          50: '#fff7e6',
          100: '#ffecb3',
          200: '#ffe080',
          300: '#ffd54d',
          400: '#ffca1a',
          500: '#ff9900',
          600: '#e68600',
          700: '#cc7300',
          800: '#b36000',
          900: '#994d00',
        },
        // CTOS Dark Theme
        ctos: {
          'black': '#000000',
          'dark': '#0a0a0a',
          'darker': '#111111',
          'panel': '#1a1a1a',
          'border': '#333333',
          'text': '#ffffff',
          'text-dim': '#cccccc',
          'text-muted': '#999999',
          'green': '#00ff00',
          'red': '#ff0000',
          'cyan': '#00ffff',
          'orange': '#ff6600',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'flicker': 'flicker 0.15s infinite linear alternate',
        'terminal-cursor': 'terminalCursor 1s infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        flicker: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.8' },
        },
        terminalCursor: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'tech': ['Orbitron', 'monospace'],
        'cyber': ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px currentColor',
        'glow-lg': '0 0 40px currentColor',
        'neon': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        'neon-orange': '0 0 10px #ff6600, 0 0 20px #ff6600, 0 0 30px #ff6600',
      },
    },
  },
  plugins: [],
}
