/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00C2CB",
        ink: "#0A0F1E",
        surface: "#F6F8FB",
        slate: "#556070",
        muted: "#8494A8",
        "ink-2": "#1A2234",
        "ink-3": "#2D3A52",
        "cyan-dim": "#C8D1E0",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

