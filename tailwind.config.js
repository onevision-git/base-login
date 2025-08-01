/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './src/**/*.{js,jsx,ts,tsx}',
  './src/components/**/*.{js,jsx,ts,tsx}',
  './packages/**/*.{js,jsx,ts,tsx}',
  './src/styles/**/*.{css}',
],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  // (Optional) Customize DaisyUI themes:
  // daisyui: {
  //   themes: ["light","dark","cupcake"],
  // },
};
