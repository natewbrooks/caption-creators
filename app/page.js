'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, getUserToken } from '@/server/socketManager';
import { FaArrowRight, FaTrophy } from 'react-icons/fa6';
import UserDisplay from './components/login/userDisplay';
import { useAuth } from './contexts/userAuthContext';

export default function Home() {
	const [lobbyId, setLobbyId] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();
	const userToken = getUserToken();
	const { currentUser } = useAuth();

	useEffect(() => {
		const socket = getSocket();

		socket.on('error_joining', setError);

		socket.on('lobby_created', ({ lobbyId, hostUserToken }) => {
			setError('');
			router.push(`/lobby/${lobbyId}`);
		});

		// Cleanup listeners on component unmount
		return () => {
			socket.off('error_joining', setError);
			socket.off('lobby_created');
		};
	}, []);

	const handleCreateLobby = () => {
		// Create the lobby, store the hosts userToken
		getSocket().emit('create_lobby', {
			hostUserToken: userToken,
			playerName: currentUser ? currentUser.displayName : 'Host',
			email: currentUser ? currentUser.email : null,
		});
	};

	const handleJoinLobby = () => {
		// Send user information to server to join lobby if the player inputted a lobby that exists
		if (lobbyId) {
			console.log('currentUser at lobby join:', currentUser);

			getSocket().emit('join_lobby', {
				lobbyId,
				playerName: currentUser ? currentUser.displayName : 'Anonymous',
				userToken: userToken,
				email: currentUser ? currentUser.email : null,
			});

			getSocket().on('lobby_joined', () => {
				router.push(`/lobby/${lobbyId}`);
			});
		}
	};
	return (
		<main className='w-full h-full flex flex-col items-center '>
			<div className='flex flex-col justify-center items-center mb-10 sm:flex-row  w-full sm:justify-between'>
				<div
					onClick={() => {
						router.push('/leaderboard');
					}}
					className={`flex space-x-2 items-center cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
					<FaTrophy
						size={18}
						className={`text-yellow-500 -translate-y-[0.15rem]`}
					/>
					<span className={`font-manga text-xl`}>LEADERBOARD</span>
				</div>
				<UserDisplay
					onClickEnabled={true}
					showLoginOption={true}
				/>
			</div>
			<div className='relative h-fit flex flex-col items-center leading-none'>
				<div className={`flex items-center justify-center text-center`}>
					<h1
						data-text='Caption Creators'
						className={`font-sunny text-8xl md:text-9xl`}>
						Caption Creators
					</h1>
					{/* <MdVideoLibrary
						size={70}
						className={`hidden md:block mb-2`}
					/> */}
				</div>
				<span
					className={`bg-dark outline outline-2 outline-darkAccent px-4 py-1 rounded-md font-manga text-md md:text-lg xl:text-xl text-yellow-300 text-center `}>
					Nate Brooks, Gabriel Huber, Connor O’Grady, David Borisevich, and Dominick Winningham
				</span>
			</div>

			<div className='h-full w-full sm:w-fit flex flex-col space-y-4 relative top-[10%] items-center text-center'>
				<>
					<button
						onClick={handleCreateLobby}
						className='bg-dark p-4 w-full text-center font-sunny text-4xl md:text-5xl  rounded-md text-white outline outline-2 outline-darkAccent  sm:hover:outline-white sm:active:scale-95'>
						HOST LOBBY
					</button>
					<div className='flex flex-col px-4 w-full sm:w-fit items-center bg-dark outline outline-2 outline-darkAccent rounded-md py-4'>
						<label className='text-center text-4xl md:text-5xl font-sunny pb-2 '>JOIN LOBBY</label>
						<div className={`flex space-x-1`}>
							<input
								type='text'
								value={lobbyId}
								maxLength={4} // Set to the length of sever lobby id (nanoid) length
								onChange={(e) => setLobbyId(e.target.value.replace(/\s/g, ''))} // NO SPACES ALLOWED
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleJoinLobby();
									}
								}}
								placeholder='Lobby ID'
								className='outline-none font-manga text-white text-xl text-center bg-darkAccent w-full py-1 rounded-md placeholder:text-white/50'
							/>
							<button
								onClick={handleJoinLobby}
								className='bg-yellow-300 select-none outline-none px-2 rounded-md font-sunny text-xl text-black outline-2 outline-offset-2 sm:hover:outline-white sm:hover:outline sm:active:scale-95'>
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
