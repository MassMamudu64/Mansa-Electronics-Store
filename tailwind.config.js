/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        gold: {
          50: '#FBF7EA',
          100: '#F6EFC9',
          200: '#ECDF93',
          300: '#E0CB5D',
          400: '#D6BA3B',
          500: '#C9A227', // primary gold
          600: '#A8851C',
          700: '#826816',
          800: '#5E4B11',
          900: '#3D310B',
          DEFAULT: '#C9A227',
        },
        ink: {
          50: '#F4F5F7',
          100: '#E4E7EC',
          200: '#C9CDD6',
          300: '#9BA2B0',
          400: '#6B7280',
          500: '#4B5563',
          600: '#2D3340',
          700: '#1A1E27',
          800: '#12151C',
          900: '#0A0E17', // near-black navy
          DEFAULT: '#0A0E17',
        },
        cream: '#FBFAF6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-lg': '0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 20px -8px rgb(15 23 42 / 0.18)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
};
