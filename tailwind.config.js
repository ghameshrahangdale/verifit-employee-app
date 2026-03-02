/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
       
        rubik: ['Rubik-Regular'],
        'rubik-bold': ['Rubik-Bold'],
        'rubik-extrabold': ['Rubik-ExtraBold'],
        'rubik-medium': ['Rubik-Medium'],
        'rubik-semibold': ['Rubik-SemiBold'],
        'rubik-light': ['Rubik-Light'],
        'rubik-black': ['Rubik-Black'],
      },
    },
  },
  plugins: [],
}