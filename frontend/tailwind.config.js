/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand-primary': 'var(--brand-primary)',
        'brand-primary-dark': 'var(--brand-primary-dark)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-secondary-dark': 'var(--brand-secondary-dark)',
        'brand-accent': 'var(--brand-accent)',
        
        // Semantic colors
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'info': 'var(--info)',
        
        // Gray scale
        'gray': {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'elevated': 'var(--shadow-elevated)',
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
