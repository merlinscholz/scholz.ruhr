/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
