/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/preline/preline.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        'ninuto': ['Ninuto', 'sans-serif']
      },
      fontSize: {
        'xxs': '10px',
      },
      backgroundColor: {
        primary: "#EC4525",
        primaryHover: "#EC4525"
      }
    },
    textColor: {
      DEFAULT: "#192431",
      white: "#FCFEFF",
      grey: "#ABAFC7",
    },
    borderWidth: {
      DEFAULT: '1.5px',
    },
    borderColor: {
      DEFAULT: "#F1F1F1",
    }
  },
  plugins: [
    require('preline/plugin'),
  ],
}