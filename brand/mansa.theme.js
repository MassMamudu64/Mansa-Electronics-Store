// Mansa Electronics — brand tokens extracted from the logo.
// Merge into tailwind.config.js -> theme.extend (replaces the neutral `charcoal`-only palette).
//
//   const mansa = require('./brand/mansa.theme');
//   module.exports = { ...rest, theme: { extend: { ...mansa } } };

module.exports = {
  colors: {
    // Primary — "MANSA" wordmark espresso (pixel-sampled from the logo)
    brown: {
      900: '#200A04',
      800: '#351608', // primary brand color (most frequent wordmark brown)
      700: '#3B190A',
      600: '#4A2310',
    },
    // Secondary — "ELECTRONICS" / Africa gold (pixel-sampled from the logo)
    gold: {
      700: '#B27D21',
      600: '#BB842E', // secondary brand color (most frequent gold)
      500: '#C8923A',
      400: '#D0A24D',
      200: '#EFCD80', // device-gradient highlight
    },
    // Neutrals — white field + tagline ink
    paper: '#FFFFFF',
    'paper-warm': '#FAF7F2',
    sand: { 100: '#F2EBE1', 300: '#D8CCBC' },
    ink: { 900: '#1A1512', 700: '#3D3833', 500: '#6B6258' },
    // Functional
    success: '#3E7C5A',
    warning: '#BB842E',
    error: '#A33A2A',
    info: '#3A5A7A',
  },
  backgroundImage: {
    'gold-gradient': 'linear-gradient(180deg,#EFCD80 0%,#C08A33 55%,#B27D21 100%)',
  },
  fontFamily: {
    serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
    sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
  },
  borderRadius: { sm: '8px', md: '14px', lg: '22px', pill: '999px' },
  boxShadow: {
    sm: '0 1px 2px rgba(46,26,12,.06), 0 1px 3px rgba(46,26,12,.04)',
    md: '0 6px 18px rgba(46,26,12,.08)',
    lg: '0 18px 48px rgba(46,26,12,.12)',
    gold: '0 8px 24px rgba(194,134,42,.28)',
  },
  letterSpacing: { eyebrow: '0.18em' },
};
