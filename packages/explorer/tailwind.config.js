/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/preline/preline.js',
  ],
  theme: {
    extend: {
      borderColor: {
        grey: "#F1F1F1"
      }
    },
    textColor: {
      white: "#FCFEFF",
    },
  },
  plugins: [
    require('preline/plugin'),
  ],
}