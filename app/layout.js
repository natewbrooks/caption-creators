'use client';
import { useEffect, useState } from 'react';
import './globals.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { UserAuthProvider } from '@/app/contexts/UserAuthContext';
import { SocketProvider } from '@/app/contexts/SocketContext';

// export const metadata = {
// 	title: 'Caption Creators',
// 	description:
// 		'A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.',
// };

export default function RootLayout({ children }) {
	const [isPageLoaded, setIsPageLoaded] = useState(false);

	useEffect(() => {
		setIsPageLoaded(true);
		// Define the function inside useEffect to ensure it's using the latest state and props.
		function adjustAnimationPlayState() {
			if (document.hidden) {
				document.body.style.setProperty('--animation-play-state', 'paused');
			} else {
				document.body.style.setProperty('--animation-play-state', 'running');
			}
		}

		// Initial check in case the page loads in a background tab
		adjustAnimationPlayState();

		// Attach the event listener
		document.addEventListener('visibilitychange', adjustAnimationPlayState);

		// Return a cleanup function to remove the event listener when the component unmounts
		return () => {
			document.removeEventListener('visibilitychange', adjustAnimationPlayState);
		};
	}, []);

	return (
		<html
			lang='en'
			className={`overflow-hidden`}>
			<HelmetProvider>
				<Helmet>
					<title>Caption Creators</title>
					<meta
						name='description'
						content='A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.'
					/>
					<meta
						name='keywords'
						content='caption, party game, online game, funny, multiplayer, videos, prompts'
					/>
					<link
						rel='icon'
						href='/favicon/favicon.svg'
						type='image/svg+xml'
					/>
					<link
						rel='alternate icon'
						href='/favicon/favicon.png'
						type='image/png'
					/>
					<meta
						property='og:title'
						content='Caption Creators'
					/>
					<meta
						property='og:description'
						content='A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.'
					/>
					<meta
						property='og:type'
						content='website'
					/>
					<meta
						property='og:image'
						content='/path/to/image.jpg'
					/>
					<meta
						name='twitter:card'
						content='summary_large_image'
					/>
					<meta
						name='twitter:title'
						content='Caption Creators'
					/>
					<meta
						name='twitter:description'
						content='A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.'
					/>
					<meta
						name='twitter:image'
						content='/path/to/image.jpg'
					/>
				</Helmet>
				<body className={`xs:p-2 sm:p-4 md:p-8 overflow-hidden w-full h-screen `}>
					<div className='absolute'>
						<div className={`${isPageLoaded ? 'background' : ''}`}></div>
						<div className={`${isPageLoaded ? 'backgroundOffset' : ''}`}></div>
					</div>
					<SocketProvider>
						<UserAuthProvider>{children}</UserAuthProvider>
					</SocketProvider>
				</body>
			</HelmetProvider>
		</html>
	);
}
