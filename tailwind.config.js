module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
        },
        neutral: {
          DEFAULT: 'hsl(var(--neutral))',
          foreground: 'hsl(var(--neutral-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        gray: {
          50: 'hsl(240, 20%, 97%)',
          100: 'hsl(240, 14%, 93%)',
          200: 'hsl(240, 11%, 85%)',
          300: 'hsl(240, 10%, 75%)',
          400: 'hsl(240, 8%, 62%)',
          500: 'hsl(240, 6%, 50%)',
          600: 'hsl(240, 8%, 38%)',
          700: 'hsl(240, 8%, 28%)',
          800: 'hsl(240, 7%, 20%)',
          900: 'hsl(240, 8%, 12%)',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        base: ['1rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        lg: ['1.125rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        xl: ['1.25rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        '2xl': ['1.414rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '4xl': ['2.827rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '5xl': ['4rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        4: '1rem',
        8: '2rem',
        12: '3rem',
        16: '4rem',
        24: '6rem',
        32: '8rem',
        48: '12rem',
        64: '16rem',
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(135deg, hsl(221, 85%, 52%) 0%, hsl(191, 77%, 45%) 100%)',
        'gradient-2': 'linear-gradient(135deg, hsl(221, 75%, 36%) 0%, hsl(219, 85%, 52%) 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
