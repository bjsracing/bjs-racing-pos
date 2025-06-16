/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#ff9800", // Warna Orange utama
          700: "#f57c00",
        },
      },
    },
  },
  plugins: [],
};
