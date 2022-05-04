module.exports = {
  content: ["./templates/**/*.jinja2"],
  theme: {
    extend: {
      colors: {
        primary: "#f6821f",
        secondary: "#0051c3",
        gray: {
            "inactive": "#595959",
            "common": "#4a4a4a",
            "active": "#3a3a3a",
            "light": "#f2f2f2",
        },
        success: "#a8e9c0",
        warning: "#fbcda5",
        danger: "#feccc8",
      },
      boxShadow: {
        drop: "0 10px 30px 0 rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
