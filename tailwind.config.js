/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#f83c89',     // Pink
        'secondary': '#7cc0e4',   // Light Blue
        'accent': '#ffd541',      // Yellow
        'neutral': '#e1e4ea',     // Light Gray
        'base-100': '#fef4f8',    // Very Light Pink
        'base-content': '#464655' // Dark Gray/Blue
      },
      fontFamily: {
        'playful': ['Nunito', 'Comic Sans MS', 'sans-serif']
      },
      animation: {
        'bounce-slow': 'bounce 2s ease-in-out infinite',
      },
      backgroundImage: {
        'dots-pattern': 'radial-gradient(#f83c89 2px, transparent 2px)',
        'stripes-pattern': 'repeating-linear-gradient(45deg, #ffd541, #ffd541 10px, #fff 10px, #fff 20px)',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dontdie: {
          "primary": "#f83c89",
          "secondary": "#7cc0e4",
          "accent": "#ffd541",
          "neutral": "#e1e4ea",
          "base-100": "#fef4f8",
          "base-content": "#464655",
          "info": "#3abff8",
          "success": "#56c271",
          "warning": "#fbbd23",
          "error": "#e05263",
        },
      },
      "light",
      "dark",
    ],
  },
} 