/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./src/**/*.{js,ts}",
    "./static/**/*.html"
  ],
  safelist: [
    // Background colors
    'bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-black/95',
    'bg-white', 'bg-cyan-400', 'bg-orange-500', 'bg-green-400', 'bg-red-900', 'bg-green-900',
    // Text colors
    'text-white', 'text-black', 'text-gray-300', 'text-gray-400', 'text-gray-500',
    'text-cyan-400', 'text-green-400', 'text-orange-400', 'text-red-400',
    'text-green-300', 'text-red-300',
    // Border colors
    'border-cyan-400', 'border-gray-600', 'border-gray-700', 'border-cyan-400/30',
    'border-green-400', 'border-red-400', 'border-black', 'border-2', 'border-b', 'border-t',
    'border-b-2', 'border-l-2', 'border-r-2', 'border-t-2',
    // Hover states
    'hover:bg-cyan-400', 'hover:bg-cyan-300', 'hover:bg-orange-400',
    'hover:text-black', 'hover:text-cyan-400', 'hover:text-cyan-300', 'hover:text-white',
    'hover:text-orange-300', 'hover:border-cyan-300', 'hover:border-cyan-400', 'hover:border-l-2',
    // Animations
    'animate-pulse', 'animate-scan-line',
    // Layout & spacing
    'fixed', 'absolute', 'relative', 'top-0', 'left-0', 'right-0', 'z-40', 'z-50', 'z-20', 'z-10',
    'container', 'mx-auto', 'px-6', 'py-4', 'p-6', 'p-8', 'px-3', 'py-1', 'px-2', 'py-2',
    'flex', 'hidden', 'md:flex', 'md:hidden', 'grid', 'grid-cols-2', 'md:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'items-center', 'justify-between', 'space-x-8', 'space-y-3', 'gap-4', 'gap-6', 'gap-8',
    // Typography
    'font-bold', 'text-xl', 'text-sm', 'text-lg', 'text-xs', 'uppercase', 'tracking-wider',
    'leading-relaxed', 'line-clamp-3',
    // Sizing
    'w-full', 'w-32', 'w-48', 'w-4', 'w-6', 'w-2', 'h-full', 'h-40', 'h-64', 'h-4', 'h-6', 'h-2',
    'min-h-screen', 'max-w-2xl', 'max-w-4xl', 'aspect-video',
    // Effects
    'backdrop-blur-md', 'transition-colors', 'transition-all', 'duration-300',
    'overflow-hidden', 'grayscale', 'object-cover', 'opacity-10', 'opacity-30', 'opacity-5',
    // Positioning
    'inset-0', '-top-1', '-left-1', '-right-1', '-bottom-1', 'pointer-events-none'
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
        // Standard colors that we're using
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
        orange: {
          400: '#fb923c',
          500: '#f97316',
        },
        green: {
          400: '#4ade80',
          500: '#22c55e',
        },
        red: {
          400: '#f87171',
          500: '#ef4444',
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
        'ctos': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
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
