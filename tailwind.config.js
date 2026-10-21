/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#243B2E',
        'brand-olive': '#4A5D23',
        'brand-cream': '#F9F8F4',
        'brand-gold': '#D4AF37',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(36, 59, 46, 0.12)',
      },
    },
  },
  plugins: [],
};
