/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
    './src/components/**/*.{js,jsx,ts,tsx,mdx}',
    './packages/**/*.{js,jsx,ts,tsx,mdx}',
    './src/styles/**/*.{css}',
  ],
  safelist: ['text-gray-900', 'bg-white'],
  theme: { extend: {} },
  // No JS plugin/config for daisyUI in v5 — it's handled in CSS.
};
