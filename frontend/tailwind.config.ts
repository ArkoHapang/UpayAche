import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Canonical Upay Brand Tokens
        upay: {
          primary: "var(--upay-primary)",       // #007BFF
          secondary: "var(--upay-secondary)",   // #6C757D
          "text-primary": "var(--upay-text-primary)", // #000000
          "text-dark": "var(--upay-text-dark)",       // #4E4E50
          "blue-dark": "var(--upay-blue-dark)",       // #0054A6
          accent: "var(--upay-accent)",               // #FFD602
          border: "var(--upay-border)",               // #CED4DA
          "text-light": "var(--upay-text-light)",     // #EDF0F3
          "surface-light": "var(--upay-surface-light)", // #F6F6F6
          white: "var(--upay-white)",                 // #FFFFFF
        },

        // Legacy brand tokens mapped smoothly to avoid regressions
        brand: {
          yellow: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FFD602", // Canonical Upay Accent
            500: "#FFD602",
            600: "#E6C000",
            DEFAULT: "#FFD602",
          },
          navy: {
            700: "#334155",
            800: "#0054A6", // Upay Blue Dark
            900: "#003D7A",
            950: "#002A54",
            DEFAULT: "#0054A6",
          },
          blue: {
            DEFAULT: "#007BFF", // Upay Primary
            dark: "#0054A6",
          },
        },

        // Risk semantics strictly preserved for fraud & scam intelligence
        risk: {
          low: {
            DEFAULT: "#10B981",
            bg: "#ECFDF5",
            border: "#A7F3D0",
            text: "#065F46",
          },
          medium: {
            DEFAULT: "#F59E0B",
            bg: "#FFFBEB",
            border: "#FDE68A",
            text: "#92400E",
          },
          high: {
            DEFAULT: "#EA580C",
            bg: "#FFF7ED",
            border: "#FED7AA",
            text: "#9A3412",
          },
          critical: {
            DEFAULT: "#DC2626",
            bg: "#FEF2F2",
            border: "#FECACA",
            text: "#7F1D1D",
          },
        },
      },

      fontFamily: {
        sans: ["Acephimere", "Inter", "sans-serif"],
        bold: ["Acephimere Bold", "Acephimere", "Inter", "sans-serif"],
      },

      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["36px", { lineHeight: "40px" }],
        "3xl": ["48px", { lineHeight: "56px" }],
      },

      borderRadius: {
        "upay-sm": "0px 6px 6px 0px",
        "upay-md": "6px 0px 0px 6px",
        "upay-lg": "20px",
        "upay-xl": "30px",
        "upay-full": "50%",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },

      boxShadow: {
        "upay-sm": "rgba(0, 0, 0, 0.25) 0px 2px 4px 0px",
        "upay-md": "rgba(0, 0, 0, 0.25) 0px 4px 10px 0px",
      },

      transitionDuration: {
        fast: "180ms",
        base: "260ms",
        slow: "500ms",
      },
    },
  },
  plugins: [],
};

export default config;
