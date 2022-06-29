/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.jinja2"],
  theme: {
    extend: {
      colors: {
        primary: "#f6821f",
        secondary: {
          DEFAULT: "#0051c3",
          dark: "#003681",
        },
        gray: {
          inactive: "#595959",
          common: "#4a4a4a",
          active: "#3a3a3a",
          light: "#f2f2f2",
        },
        success: {
          DEFAULT: "#a8e9c0",
          light: "#effbf3",
          dark: "#144d28",
        },
        info: {
          DEFAULT: "#82b6ff",
          light: "#ecf4ff",
          dark: "#004099",
        },
        warning: {
          DEFAULT: "#fbcda5",
          light: "#fef4ec",
          dark: "#7a3c05",
        },
        danger: {
          DEFAULT: "#fe9f97",
          light: "#ffeceb",
          dark: "#8d0d01",
        },
      },
      boxShadow: {
        drop: "0 10px 30px 0 rgba(0, 0, 0, 0.1)",
      },
      screens: {
        '-2xl': { max: '1535px' },
        '-xl': { max: '1279px' },
        '-lg': { max: '1023px' },
        '-md': { max: '767px' },
        '-sm': { max: '639px' },
      },
    },
  },
  plugins: [],
};
