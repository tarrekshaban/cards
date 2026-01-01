/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#000000",
          muted: "#0a0a0a",
          raised: "#121212",
        },
        border: {
          DEFAULT: "#262626",
          subtle: "#333333",
        },
        text: {
          DEFAULT: "#ffffff",
          muted: "#a3a3a3",
          faint: "#525252",
        },
        primary: {
          DEFAULT: "#e5e5e5",
          hover: "#d4d4d4",
          subtle: "rgba(229, 229, 229, 0.1)",
        },
      },
      boxShadow: {
        card: "none",
      },
      borderRadius: {
        subtle: "0px",
      },
    },
  },
  plugins: [],
}
