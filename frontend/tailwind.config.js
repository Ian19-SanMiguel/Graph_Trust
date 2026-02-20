/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "#5E4B8B",
				gradient: "#C3C6FF",
				accent: {
					300: "#a78bff",
					400: "#8f5bff",
					500: "#8f5bff",
					600: "#7c3aff",
					700: "#6920e6",
				},
			},
		},
	},
	plugins: [],
};
