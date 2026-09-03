import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ['"Playfair Display"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        // Legacy aliases kept so landing page keeps rendering until its own rebrand PR
        geist: ["Geist", "system-ui", "sans-serif"],
        jakarta: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "40px" }],
        "3xl": ["40px", { lineHeight: "48px" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          border: "hsl(var(--surface-border))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        midnight: "var(--midnight)",
        charcoal: "var(--charcoal)",
        violet: {
          DEFAULT: "var(--violet)",
          hover: "var(--violet-hover)",
          wash: "var(--violet-wash)",
          glow: "var(--violet-glow)",
        },
        snow: "var(--snow)",
        cream: "var(--cream)",
        onyx: "var(--onyx)",
        graphite: "var(--graphite)",
        "lp-zinc": "var(--lp-zinc)",
        silver: "var(--silver)",
        fog: "var(--fog)",
        "slate-border": "var(--slate-border)",
        ink: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
        },
        "accent-indigo": "var(--accent)",
        "accent-wash": "var(--accent-wash)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "9999px",
        // Landing shape scale (only meaningful under .lp-theme)
        "lp-xs": "var(--lp-r-xs)",
        "lp-sm": "var(--lp-r-sm)",
        "lp-md": "var(--lp-r-md)",
        "lp-lg": "var(--lp-r-lg)",
        "lp-xl": "var(--lp-r-xl)",
      },

      boxShadow: {
        "depth-2": "var(--shadow-2)",
        "depth-4": "var(--shadow-4)",
        "depth-8": "var(--shadow-8)",
        "depth-16": "var(--shadow-16)",
        "depth-28": "var(--shadow-28)",
      },
      transitionTimingFunction: {
        fluent: "cubic-bezier(0.33, 0, 0.67, 1)",
        "fluent-decel": "cubic-bezier(0.1, 0.9, 0.2, 1)",
        "fluent-accel": "cubic-bezier(0.7, 0, 1, 0.5)",
      },
      transitionDuration: {
        fast: "100ms",
        normal: "200ms",
        slow: "300ms",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
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
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "stagger-fade": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        ambientGlow: {
          "0%": { opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { opacity: "0.5" },
        },
        "ledge-breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.95" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        "ledge-halo": {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.95)" },
          "50%": { opacity: "0.6", transform: "scale(1.1)" },
        },
        "ledge-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "ledge-line-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "count-up": "count-up 0.4s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "stagger-fade": "stagger-fade 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
