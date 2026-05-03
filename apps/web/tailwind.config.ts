import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18211f",
        paper: "#f8faf8",
        line: "#d9e1dc",
        moss: "#3f6f5a",
        teal: "#0f766e",
        amber: "#b7791f",
        rose: "#be5b67"
      },
      boxShadow: {
        panel: "0 12px 36px rgba(24, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
