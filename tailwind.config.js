/** @type {import('tailwindcss').Config} */
module.exports = {
  // Note: App.js is in the root, components and utils are inside src/
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
    boxShadow: {},
    dropShadow: {},
  },
  plugins: [],
}
