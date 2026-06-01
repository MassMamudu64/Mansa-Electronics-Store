/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: { 900: '#200A04', 800: '#351608', 700: '#3B190A', 600: '#4A2310' },
        gold: { 700: '#B27D21', 600: '#BB842E', 500: '#C8923A', 400: '#D0A24D', 200: '#EFCD80' },
        paper: '#FFFFFF',
        'paper-warm': '#FAF7F2',
        sand: { 100: '#F2EBE1', 300: '#D8CCBC' },
        ink: { 900: '#1A1512', 700: '#3D3833', 500: '#6B6258' },
        success: '#3E7C5A',
        warning: '#BB842E',
        danger: '#A33A2A',
        info: '#3A5A7A',
        charcoal: {
          950: '#0a0a0a', 900: '#111111', 800: '#1c1c1e', 700: '#2c2c2e',
          600: '#3a3a3c', 500: '#636366', 400: '#8e8e93', 300: '#aeaeb2',
          200: '#c7c7cc', 100: '#e5e5ea', 50: '#f2f2f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(180deg,#EFCD80 0%,#C08A33 55%,#B27D21 100%)',
        'gold-sheen': 'linear-gradient(110deg,transparent 25%,rgba(255,255,255,0.45) 50%,transparent 75%)',
        'hero-warm': 'radial-gradient(1200px 600px at 70% -10%, #FBEFD8 0%, #FAF7F2 55%, #FAF7F2 100%)',
        'espresso-fade': 'linear-gradient(180deg,#351608 0%,#200A04 100%)',
      },
      letterSpacing: { eyebrow: '0.18em' },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        product: '0 1px 2px rgb(32 10 4 / 0.06), 0 1px 3px rgb(32 10 4 / 0.05)',
        'product-hover': '0 18px 40px -12px rgb(32 10 4 / 0.22)',
        card: '0 1px 3px rgb(32 10 4 / 0.06)',
        'card-lg': '0 10px 30px -8px rgb(32 10 4 / 0.14)',
        gold: '0 10px 30px -6px rgb(187 132 46 / 0.40)',
        'gold-sm': '0 4px 14px -2px rgb(187 132 46 / 0.35)',
        'admin-sidebar': '2px 0 8px 0 rgb(0 0 0 / 0.08)',
      },
      transitionTimingFunction: {
        'mansa': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'shimmer': 'shimmer 1.1s linear infinite',
        'shimmer-text': 'shimmerText 5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } },
        shimmerText: { '0%': { backgroundPosition: '0% center' }, '100%': { backgroundPosition: '200% center' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgb(187 132 46 / 0.35)' }, '50%': { boxShadow: '0 0 0 10px rgb(187 132 46 / 0)' } },
      },
    },
  },
  plugins: [],
};
