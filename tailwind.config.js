/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FFF9FC',
          100: '#FFF4FA',
          200: '#FFE4F2',
          300: '#FFD2E8',
          400: '#FFB5DC',
          500: '#FFA4D4',
          600: '#E890B8',
          700: '#D47A9E',
          800: '#B85F82',
          900: '#9C4568',
        },
        surface: '#FFFFFF',
        background: '#FFF9FC',
        sidebar: '#FFF4FA',
        border: '#F8D3E7',
        'text-primary': '#2F2F35',
        'text-secondary': '#6B7280',
        success: '#A7E8C5',
        warning: '#FAD7A0',
        error: '#F6A6B2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(255, 181, 220, 0.15), 0 4px 6px -4px rgba(255, 181, 220, 0.1)',
        'soft-lg': '0 10px 40px -10px rgba(255, 181, 220, 0.2)',
        'glass': '0 8px 32px 0 rgba(255, 181, 220, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
