/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1B33",
        inkSoft: "#132A4D",
        bg: "#F5F7FA",
        cyan: "#2B6CF6",
        cyanDeep: "#1745B3",
        cyanTint: "#E6F1FB",
        cyanBorder: "#85B7EB",
        amber: "#FFC93C",
        amberDeep: "#966B00",
        amberTint: "#FAEEDA",
        amberBorder: "#EF9F27",
        text: "#0F172A",
        textSoft: "#64748B",
        border: "#E4E9F0",
        danger: "#DC2626",
        dangerTint: "#FDE8E7",
        success: "#639922",
        successTint: "#EAF3DE",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "'Segoe UI'", "sans-serif"],
        body: ["'Inter'", "'Segoe UI'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
