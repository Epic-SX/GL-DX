import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf5",
          100: "#dcf5e8",
          200: "#baebd4",
          300: "#87d9b5",
          400: "#4fbe8e",
          500: "#2da370",
          600: "#1e8459",
          700: "#196848",
          800: "#17533a",
          900: "#144530",
          950: "#0a2a1d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
