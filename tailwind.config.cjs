/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#001233",
        "on-primary": "#ffffff",

        secondary: "#C5B358",
        "on-secondary": "#001233",

        surface: "#000a1a",
        "on-surface": "#ffffff",

        "surface-variant": "#001b4d",
        "on-surface-variant": "#cbd5e1",

        outline: "#C5B358",

        "primary-container": "#071a3b",
        "on-primary-container": "#b6c6f0",

        "secondary-container": "#f3eee1",
        "on-secondary-container": "#5d4201",
      },

      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
        label: ["Manrope", "sans-serif"],
      },

      fontSize: {
        "headline-xl": ["48px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
        "body-md": ["16px", { lineHeight: "1.6" }],
        "label-caps": ["12px", { letterSpacing: "0.15em", fontWeight: "700" }],
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "1rem",
        full: "9999px",
      },

      spacing: {
        gutter: "24px",
        unit: "8px",
        margin: "64px",
        "section-gap": "128px",
      },
    },
  },
  plugins: [],
}