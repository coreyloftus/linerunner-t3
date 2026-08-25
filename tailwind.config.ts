import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Mobile-specific breakpoints
      screens: {
        'xs': '375px',      // iPhone SE
        'iphone': '393px',  // iPhone 16
        'ipad': '834px',    // iPad 11"
      },
      
      colors: {
        // "Prompt Book" theme tokens — defined in globals.css
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          raised: "hsl(var(--surface-raised) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        curtain: "hsl(var(--curtain) / <alpha-value>)",
        "newStyle-accent-color": "hsl(var(--accent) / <alpha-value>)",
        // Mobile-optimized colors for better contrast
        'mobile-contrast': {
          50: '#f8fafc',
          900: '#0f172a',
        }
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        script: ["var(--font-courier-prime)", "Courier New", "monospace"],
      },
      
      // Mobile touch targets
      spacing: {
        'touch': '44px',    // Minimum touch target
        'touch-lg': '56px', // Large touch target
      },
      
      // Mobile typography scale
      fontSize: {
        'mobile-xs': ['12px', { lineHeight: '1.6' }],
        'mobile-sm': ['14px', { lineHeight: '1.6' }],
        'mobile-base': ['16px', { lineHeight: '1.6' }],
        'mobile-lg': ['18px', { lineHeight: '1.6' }],
      },
      
      // Mobile spacing system
      gap: {
        'mobile': '0.5rem',
        'mobile-lg': '1rem',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
