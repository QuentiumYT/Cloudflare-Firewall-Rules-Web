/** @type {import('tailwindcss').Config} */
export default {
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
      screens: {
        // Base responsive
        'xs': { min: '360px' },
        'sm': { min: '640px' },
        'md': { min: '768px' },
        'lg': { min: '1024px' },
        'xl': { min: '1280px' },
        '2xl': { min: '1536px' },
        // Reverse responsive
        '-2xl': { max: '1535px' },
        '-xl': { max: '1279px' },
        '-lg': { max: '1023px' },
        '-md': { max: '767px' },
        '-sm': { max: '639px' },
        '-xs': { max: '359px' },
        // Between responsive
        'b-xs': { min: '360px', max: '639px' },
        'b-sm': { min: '640px', max: '767px' },
        'b-md': { min: '768px', max: '1023px' },
        'b-lg': { min: '1024px', max: '1279px' },
        'b-xl': { min: '1280px', max: '1535px' },
        'b-2xl': { min: '1536px' },
      },
    },
  },
};
