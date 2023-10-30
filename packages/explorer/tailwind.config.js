/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "colors-background": "var(--colors-background)",
        "colors-body-primary": "var(--colors-body-primary)",
        "colors-body-secondary": "var(--colors-body-secondary)",
        "colors-dividers": "var(--colors-dividers)",
        "colors-foreground": "var(--colors-foreground)",
        "colors-primary": "var(--colors-primary)",
        "colors-primary-hover": "var(--colors-primary-hover)",
      },
      fontFamily: {
        body: "var(--body-font-family)",
        "body-highlight": "var(--body-highlight-font-family)",
        header: "var(--header-font-family)",
        "section-title": "var(--section-title-font-family)",
        subtitle: "var(--subtitle-font-family)",
        title: "var(--title-font-family)",
        underline: "var(--underline-font-family)",
        quicksand: ["var(--font-quicksand)"],
        nunito: ["var(--font-nunito)", "Helvetica"],
        sourcecode: ["var(--font-sourcecode)", "Helvetica"],
      },
      fontSize: {
        size14: "14px",
        size10: "10px",
      },
    },
  },
  plugins: [],
};
