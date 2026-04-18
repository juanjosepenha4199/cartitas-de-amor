import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        garden: {
          50: "#fbf7f2",
          100: "#f3e9df",
          200: "#e6d4c4",
          300: "#d4b8a8",
          400: "#c49a86",
          500: "#b07f6c",
          600: "#956558",
          700: "#7a5349",
          800: "#66453f",
          900: "#553b38",
        },
      },
      backgroundImage: {
        "garden-soft":
          "radial-gradient(ellipse at top, rgba(192,132,168,0.12), transparent 55%), radial-gradient(ellipse at bottom, rgba(125,155,132,0.15), transparent 50%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
