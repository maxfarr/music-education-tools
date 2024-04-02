/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      serif: ["stylish", "ui-serif"],
      sans: ["codenext-extrabold", "arial"],
    },
    // colors: {
    //   'red': {
    //     600: '#973532'
    //   },
    //   'green': {
    //     600: '#607A51'
    //   },
    //   'blue': {
    //     600: '#6E65C5'
    //   }
    // },
    extend: {},
  },
  plugins: [],
};
