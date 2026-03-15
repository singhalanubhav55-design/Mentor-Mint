/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#030308',
        plasma: '#00f0ff',
        aurora: '#7b2fff',
        nova: '#ff2d78',
        stellar: '#f0e6ff',
        dim: '#4a4a6a',
      },
    },
  },
  plugins: [],
}
