/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: 'var(--brand-primary)',
          'primary-dark': 'var(--brand-primary-dark)',
          secondary: 'var(--brand-secondary)',
          'secondary-dark': 'var(--brand-secondary-dark)',
        },
        // Custom dark theme colors
        dark: {
          bg: 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          border: 'var(--border-primary)',
          'border-secondary': 'var(--border-secondary)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          error: 'var(--accent-error)',
        }
      },
      boxShadow: {
        'dark': 'var(--shadow-primary)',
        'dark-lg': 'var(--shadow-secondary)',
        'dark-glow': 'var(--shadow-glow)',
      }
    },
  },
  plugins: [],
}
