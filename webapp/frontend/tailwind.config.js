/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'text-gray': '#A3A3A3',
        'bg-gray': '#D9D9D9',
      },
      fontFamily: {
        'jacquard-12': ['Jacquard 12', 'cursive'],
        'jacquard-24': ['Jacquard 24', 'cursive'],
      },
    },
  },
  plugins: [],
}