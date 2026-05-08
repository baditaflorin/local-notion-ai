/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17231f",
        paper: "#f8f5ef",
        moss: "#246b5c",
        coral: "#c64f4a",
        gold: "#b47d13",
        sky: "#2d6f9f"
      },
      boxShadow: {
        soft: "0 14px 40px rgb(23 35 31 / 0.08)"
      }
    }
  },
  plugins: []
};
