'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, getUserToken } from '@/server/socketManager';
import { MdVideoLibrary } from 'react-icons/md';
import { FaArrowRight } from 'react-icons/fa6';

export default function Home() {
	const [lobbyId, setLobbyId] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();
	const userToken = getUserToken();

	useEffect(() => {
		const socket = getSocket();

		socket.on('error_joining', setError);

		socket.on('lobby_created', ({ lobbyId, hostUserToken }) => {
			setError('');
			router.push(`/game/${lobbyId}`);
		});

		// Cleanup listeners on component unmount
		return () => {
			socket.off('error_joining', setError);
			socket.off('lobby_created');
		};
	}, []);

	const handleCreateLobby = () => {
		// Create the lobby, store the hosts userToken
		getSocket().emit('create_lobby', { hostUserToken: userToken });
	};

	const handleJoinLobby = () => {
		// Send user information to server to join lobby if the player inputted a lobby that exists
		if (lobbyId) {
			getSocket().emit('join_lobby', {
				lobbyId,
				playerName: 'Anonymous',
				userToken: userToken,
			});
			getSocket().on('lobby_joined', () => {
				router.push(`/game/${lobbyId}`);
			});
		}
	};
	return (
		<main className='w-full h-full flex flex-col justify-between items-center'>
			<div className='relative flex flex-col items-center leading-none mt-10 mb-24'>
				<div className={`flex space-x-6 items-center justify-center text-center`}>
					<h1 className={`font-sunny text-8xl`}>Caption Creators</h1>
					<MdVideoLibrary
						size={70}
						className={`hidden md:block mb-2`}
					/>
				</div>
				<span className={`font-manga text-lg text-blue-300 text-center`}>
					Nate Brooks, Gabriel Huber, Connor O’Grady, David Borisevich, and Dominick Winningham
				</span>
			</div>

			<div className='h-full w-fit flex flex-col space-y-4 justify-center items-center text-center'>
				<>
					<button
						onClick={handleCreateLobby}
						className='bg-white/10 p-4 font-sunny text-5xl rounded-md text-white sm:hover:opacity-50 sm:active:scale-95'>
						HOST LOBBY
					</button>
					<div className='flex flex-col w-full items-center bg-white/10 rounded-md px-2 py-4'>
						<label className='text-start text-5xl font-sunny pb-2'>JOIN LOBBY</label>
						<div className={`flex space-x-1`}>
							<input
								type='text'
								value={lobbyId}
								maxLength={7}
								onChange={(e) => setLobbyId(e.target.value.replace(/\s/g, ''))} // NO SPACES ALLOWED
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleJoinLobby();
									}
								}}
								placeholder='Lobby ID'
								className='font-manga text-white text-xl text-center bg-white/10 w-full py-1 rounded-md placeholder:text-white/50'
							/>
							<button
								onClick={handleJoinLobby}
								className='bg-blue-300 select-none outline-none px-2 rounded-md font-sunny text-xl text-black sm:hover:opacity-50 sm:active:scale-95'>
								<FaArrowRight size={18} />
							</button>
						</div>
						{error && <span className='pt-2 font-manga text-xl text-red-400'>Error - {error}</span>}
					</div>
				</>
			</div>
		</main>
	);
}
