/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        primary: {
          50: "#f2f1ff",
          100: "#e6e3ff",
          500: "#7167f6",
          600: "#5b50e6",
          700: "#493fbd"
        },
        success: "#16825d",
        warning: "#d97706"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans Khmer",
          "Khmer OS Battambang",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        card: "0 18px 45px rgba(23, 32, 51, 0.09)"
      }
    }
  },
  plugins: []
};
