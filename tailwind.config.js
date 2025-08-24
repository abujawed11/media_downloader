/** @type {import('tailwindcss').Config} */
const nativewind = require("nativewind/preset");

module.exports = {
  // IMPORTANT: include the preset
  presets: [nativewind],

  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { yellow: "#FAD90E", black: "#000000" } },
    },
  },
  plugins: [],
};
