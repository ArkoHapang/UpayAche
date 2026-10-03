/**
 * UpayAche Fintech Design System — Centralized Design Tokens
 *
 * Canonical Upay Brand Colors:
 * - Primary: #007BFF (Electric Blue)
 * - Secondary: #6C757D (Slate Gray)
 * - Text Primary: #000000 (Pure Black)
 * - Text Dark: #4E4E50 (Dark Gray)
 * - Blue Dark: #0054A6 (Deep Blue)
 * - Accent: #FFD602 (Upay Yellow)
 * - Border: #CED4DA (Light Gray)
 * - Text Light: #EDF0F3 (Soft Slate)
 * - Surface Light: #F6F6F6 (Soft White)
 * - White: #FFFFFF
 *
 * Risk Semantics:
 * - LOW: #10B981
 * - MEDIUM: #F59E0B
 * - HIGH: #EA580C
 * - CRITICAL: #DC2626
 */

export const tokens = {
  colors: {
    // Canonical Upay Palette
    upay: {
      primary: "#007BFF",
      secondary: "#6C757D",
      textPrimary: "#000000",
      textDark: "#4E4E50",
      blueDark: "#0054A6",
      accent: "#FFD602",
      border: "#CED4DA",
      textLight: "#EDF0F3",
      surfaceLight: "#F6F6F6",
      white: "#FFFFFF",
    },
    // Primary Brand - Electric Blue (#007BFF) with shades
    primary: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#007BFF", // Canonical Upay Primary
      600: "#0054A6", // Upay Blue Dark
      700: "#003D7A",
      800: "#002A54",
      900: "#001B36",
      DEFAULT: "#007BFF",
      foreground: "#FFFFFF",
    },
    // Secondary Brand - Slate Gray (#6C757D)
    secondary: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CED4DA", // Upay Border
      400: "#94A3B8",
      500: "#6C757D", // Canonical Upay Secondary
      600: "#4E4E50", // Upay Text Dark
      700: "#343A40",
      800: "#212529",
      900: "#000000", // Upay Text Primary
      DEFAULT: "#6C757D",
      foreground: "#FFFFFF",
    },
    // Upay Accent - Yellow (#FFD602)
    accent: {
      50: "#FFFDF0",
      100: "#FFFAC2",
      200: "#FFF585",
      300: "#FFEE47",
      400: "#FFE61A",
      500: "#FFD602", // Canonical Upay Accent
      600: "#D9B400",
      700: "#A88B00",
      DEFAULT: "#FFD602",
      foreground: "#000000",
    },
    // Content Surfaces
    surfaces: {
      background: "#F6F6F6", // Upay Surface Light
      card: "#FFFFFF",       // Upay Pure White
      cardHover: "#EDF0F3",  // Upay Text Light Tint
      subtle: "#F6F6F6",
      border: "#CED4DA",     // Upay Border
      borderSubtle: "#EDF0F3",
      divider: "#CED4DA",
    },
    // Typography Colors
    text: {
      primary: "#000000",   // Upay Text Primary
      secondary: "#4E4E50", // Upay Text Dark
      muted: "#6C757D",     // Upay Secondary
      inverse: "#FFFFFF",
      accent: "#FFD602",
      blue: "#0054A6",
    },
    // Risk Status Colors
    risk: {
      low: {
        bg: "#ECFDF5",
        border: "#A7F3D0",
        text: "#065F46",
        badge: "#10B981",
        dot: "#059669",
        label: "LOW",
      },
      medium: {
        bg: "#FFFBEB",
        border: "#FDE68A",
        text: "#92400E",
        badge: "#F59E0B",
        dot: "#D97706",
        label: "MEDIUM",
      },
      high: {
        bg: "#FFF7ED",
        border: "#FED7AA",
        text: "#9A3412",
        badge: "#EA580C",
        dot: "#C2410C",
        label: "HIGH",
      },
      critical: {
        bg: "#FEF2F2",
        border: "#FECACA",
        text: "#7F1D1D",
        badge: "#DC2626",
        dot: "#991B1B",
        label: "CRITICAL",
      },
    },
    // Feedback Colors
    feedback: {
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#DC2626",
      info: "#007BFF",
    },
    // Investigation State Machine Colors
    state: {
      open: {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        text: "#0054A6",
        label: "OPEN",
      },
      investigating: {
        bg: "#F5F3FF",
        border: "#DDD6FE",
        text: "#5B21B6",
        label: "INVESTIGATING",
      },
      reviewed: {
        bg: "#F0FDFA",
        border: "#99F6E4",
        text: "#115E59",
        label: "REVIEWED",
      },
      closed: {
        bg: "#F1F5F9",
        border: "#CBD5E1",
        text: "#4E4E50",
        label: "CLOSED",
      },
    },
    // Anomaly & Network Indicator Colors
    intelligence: {
      anomaly: {
        bg: "#FAF5FF",
        border: "#E9D5FF",
        text: "#6B21A8",
      },
      network: {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        text: "#0054A6",
      },
    },
  },
  typography: {
    fontSans: '"Acephimere", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontBold: '"Acephimere Bold", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontNumeric: "tabular-nums",
    scale: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "24px",
      "2xl": "36px",
      "3xl": "48px",
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  borderRadius: {
    xs: "0.25rem",
    sm: "0px 6px 6px 0px", // Canonical radius-sm
    md: "6px 0px 0px 6px", // Canonical radius-md
    lg: "20px",            // Canonical radius-lg
    xl: "30px",            // Canonical radius-xl
    full: "50%",           // Canonical radius-full
    rounded: "9999px",
  },
  shadows: {
    sm: "rgba(0, 0, 0, 0.25) 0px 2px 4px 0px", // Canonical shadow-sm
    md: "rgba(0, 0, 0, 0.25) 0px 4px 10px 0px", // Canonical shadow-md
    card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
    elevated: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  },
  spacing: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    cardPadding: "1.25rem",
    compactPadding: "0.875rem",
    pageGutter: "1.5rem",
  },
  motion: {
    fast: "180ms",
    base: "260ms",
    slow: "500ms",
  },
} as const;

export type RiskLevelToken = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CaseStatusToken = "OPEN" | "INVESTIGATING" | "REVIEWED" | "CLOSED";
