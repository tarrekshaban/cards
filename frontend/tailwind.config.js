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
          DEFAULT: "#0f1115",
          muted: "#151821",
          raised: "#1d2230",
        },
        border: {
          DEFAULT: "#1f2633",
          subtle: "#2b3345",
        },
        text: {
          DEFAULT: "#e5e7eb",
          muted: "#a0a8b8",
          faint: "#6b7380",
        },
        primary: {
          DEFAULT: "#8b9df6",
          hover: "#7b8fe8",
          subtle: "rgba(139, 157, 246, 0.12)",
        },
        accent: {
          subtle: "#2a3347",
        },
      },
      boxShadow: {
        card: "0 12px 32px rgba(0,0,0,0.24)",
      },
      borderRadius: {
        subtle: "6px",
      },
    },
  },
  plugins: [],
}
