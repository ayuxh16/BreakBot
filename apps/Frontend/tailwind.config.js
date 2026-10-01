/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        panel: "#11161d",
        line: "#1e2530",
        accent: "#22d3ee",
      },
    },
  },
  plugins: [],
};