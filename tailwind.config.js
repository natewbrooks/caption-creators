/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			colors: {
				dark: 'rgb(31,31,31)',
				darkAccent: 'rgb(52,52,52)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			fontFamily: {
				dubbo: ['Dubbo'],
				sunny: ['Sunny'],
				manga: ['Manga'],
			},
			keyframes: {
				spin: {
					'0%, 100%': { transform: 'rotate(0deg)' },
					'50%': { transform: 'rotate(360deg)' },
				},
			},
			animation: {
				'spin-infinite': 'spin 2s ease-in-out infinite',
			},
		},
		screens: {
			xs: '240px',
			sm: '340px',
			md: '680px',
			lg: '1080px',
			xl: '1280px',
			xxl: '2560px',
		},
	},
	plugins: [],
};
