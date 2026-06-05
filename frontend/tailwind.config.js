/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        relvntBlack: "#0F0F0F",
        relvntPanel: "#1A1A1A",
        relvntGreen: "#1D9E75",
        relvntYellow: "#EF9F27",
        relvntRed: "#E24B4A"
      }
    }
  },
  plugins: []
};
