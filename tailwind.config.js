/** @type {import('tailwindcss').Config} */
const themeConfig = require('./tailwind.theme.js');

module.exports = {
  content: ['./*.html', './*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      ...(themeConfig.theme && themeConfig.theme.extend ? themeConfig.theme.extend : {}),
    },
  },
  plugins: [],
};
