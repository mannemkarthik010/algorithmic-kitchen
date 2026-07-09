import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kitchen: {
          black: "#0A0806",
          brown: "#2C1A0E",
          gold: "#C9933A",
          orange: "#E8642A",
          cream: "#F5EDD8",
          amber: "#D4A044",
          steam: "#F0EBE0",
          cyber: "#00C4FF",
          charcoal: "#1A1208",
          muted: "#8C7A6B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "steam": "steam 3s ease-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        steam: {
          "0%": { opacity: "0.8", transform: "translateY(0) scaleX(1)" },
          "100%": { opacity: "0", transform: "translateY(-40px) scaleX(1.4)" },
        },
        pulseGold: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
