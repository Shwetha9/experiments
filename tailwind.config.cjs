/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./apps/{studio,growing-human}/src/**/*.{html,ts}', './libs/**/*.{html,ts}'],
  // Preserve the existing editorial typography and native element defaults.
  corePlugins: { preflight: false },
  theme: { extend: { fontFamily: { sans: ['Open Sans', 'sans-serif'], serif: ['Georgia', 'serif'] } } },
};
