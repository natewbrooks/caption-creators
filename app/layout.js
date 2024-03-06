import Head from 'next/head';
import './globals.css';
import { UserAuthProvider } from './contexts/UserAuthContext';

export const metadata = {
	title: 'Caption Creators',
	description:
		'A hilarious online party game where players caption short videos sourced from random keywords or AI prompts.',
};

export default function RootLayout({ children }) {
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
			<body className={`mx-10 my-4 overflow-hidden`}>
				<UserAuthProvider>{children} </UserAuthProvider>
			</body>
		</html>
	);
}
