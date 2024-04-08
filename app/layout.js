'use client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import './globals.css';
import { UserAuthProvider } from './contexts/UserAuthContext';

// export const metadata = {
// 	title: 'Caption Creators',
// 	description:
// 		'A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.',
// };

export default function RootLayout({ children }) {
	const [isPageLoaded, setIsPageLoaded] = useState(false);

	useEffect(() => {
		// This assumes the page content is ready immediately or very quickly.
		// You may want to implement more sophisticated checks for content readiness.
		setIsPageLoaded(true);
	}, []);

	return (
		<html lang='en'>
			<Head>
				<link
					rel='icon'
					type='image/svg+xml'
					href='/favicon/favicon.svg'
				/>
				<link
					rel='icon'
					type='image/png'
					href='/favicon/favicon.png'
				/>
			</Head>
			<body className={`p-8 overflow-hidden ${isPageLoaded ? 'background' : ''}`}>
				<UserAuthProvider>{children}</UserAuthProvider>
			</body>
		</html>
	);
}
