/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1c1c1e',
          700: '#2c2c2e',
          600: '#3a3a3c',
          500: '#636366',
          400: '#8e8e93',
          300: '#aeaeb2',
          200: '#c7c7cc',
          100: '#e5e5ea',
          50:  '#f2f2f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        product: '0 2px 8px 0 rgb(0 0 0 / 0.07)',
        'product-hover': '0 12px 32px 0 rgb(0 0 0 / 0.14)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-lg': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'admin-sidebar': '2px 0 8px 0 rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
