/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f6ff",
          100: "#e6edff",
          200: "#c2d2ff",
          300: "#9db6ff",
          400: "#5f81ff",
          500: "#3b5bfd",
          600: "#2c44d6",
          700: "#2236ab",
          800: "#1b2c86",
          900: "#16235f",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
