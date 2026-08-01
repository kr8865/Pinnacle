/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F1EFFE',
          100: '#E4E0FD',
          200: '#C9C1FB',
          300: '#ADA1F9',
          400: '#8A7AF3',
          500: '#4F46E5',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B1873',
          start: '#4F46E5',
          end: '#7C3AED',
        },
        accent: {
          peach: '#FFB37C',
          coral: '#FF7E7E',
        },
        surface: {
          light: '#F7F7FB',
          card: '#FFFFFF',
          border: '#ECECF3',
          dark: '#0F1117',
          darkCard: '#171923',
          darkBorder: '#252836',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          muted: '#6B7280',
          light: '#F3F4F6',
          lightMuted: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      borderRadius: {
        '4xl': '2rem',
        '3xl': '1.5rem',
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.06)',
        softLg: '0 20px 50px rgba(0,0,0,0.08)',
        glow: '0 0 0 1px rgba(124,58,237,0.12)',
        darkGlow: '0 0 0 1px rgba(124,58,237,0.25), 0 0 24px rgba(124,58,237,0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'warm-glow': 'radial-gradient(60% 60% at 50% 40%, #FFB37C 0%, #FF7E7E 45%, transparent 75%)',
      },
      animation: {
        blob: 'blob 12s infinite ease-in-out',
        'fade-up': 'fadeUp 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
