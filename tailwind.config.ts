import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // UNRAM Brand Blue Scale (from DESIGN.md)
        unram: {
          50: '#F0F4FA',
          100: '#DCE6F4',
          200: '#B9CDE9',
          300: '#8DAAD6',
          400: '#5C82BE',
          500: '#3A63A5',
          600: '#2A4E8C', // main brand blue, links, secondary buttons
          700: '#213F73',
          800: '#1B335D',
          900: '#142547',
          950: '#0C1830', // footer, stats band, darkest surface
        },
        // Editorial Neutrals & Surfaces (DESIGN.md)
        paper: '#FAF9F6',   // page background
        surface: '#FFFFFF', // card / input surface
        ink: {
          DEFAULT: '#0F1A2E', // primary text
          soft: '#4B5669',    // secondary text
        },
        hairline: '#E4E2DB',  // 1px borders, dividers
        // Single Accent Color (DESIGN.md)
        accent: {
          DEFAULT: '#E0A82E', // warm amber/gold for primary CTAs
          hover: '#D29B24',
        },
      },
      fontFamily: {
        sans: ['var(--font-instrument-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        display: ['var(--font-newsreader)', 'Georgia', 'serif'],
        body: ['var(--font-instrument-sans)', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 6vw + 1rem, 5.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        h1: ['clamp(2.25rem, 3.5vw + 1rem, 3.75rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.5rem, 1.5vw + 1rem, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        h3: ['1.25rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65' }],
        body: ['1rem', { lineHeight: '1.65' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '6px',
        lg: '6px',
        xl: '6px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

