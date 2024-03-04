'use client';
import BackButton from '@/app/components/BackButton';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPencil, FaCheck, FaCopy } from 'react-icons/fa6';

export default function GamePage() {
	const { id: lobbyId } = useParams();
	const [isHost, setIsHost] = useState(false);
	const [players, setPlayers] = useState([]);
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);
	const userToken = getUserToken();
	const [editingName, setEditingName] = useState(false);
	const [showLinkCopied, setShowLinkCopied] = useState(false);

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		if (lobbyId && socketInstance) {
			// Send request to server to fetch lobby details
			socketInstance.emit('fetch_lobby_details', { lobbyId });

			socketInstance.on('lobby_details', ({ members, hostUserToken }) => {
				setPlayers(members);
				setIsHost(userToken === hostUserToken);
			});

			socketInstance.on('update_lobby', ({ members, hostUserToken }) => {
				setPlayers(members);
				setIsHost(userToken === hostUserToken);
			});

			// Cleanup function removes event listeners
			return () => {
				socketInstance.off('lobby_details');
				socketInstance.off('update_lobby');
			};
		}
	}, [lobbyId, userToken]);

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		if (socketInstance) {
			function handleUnload() {
				socketInstance.emit('reload', userToken);
			}
			function handleReload() {
				socketInstance.emit('restore_session', userToken);
			}

			window.addEventListener('beforeunload', handleUnload);
			// Check if the document is already loaded
			if (document.readyState === 'complete') {
				handleReload(); // If the document is already loaded, call handleReload immediately
			} else {
				// Otherwise, listen for the load event
				window.addEventListener('load', handleReload);
			}

			// Cleanup function removes event listener when component unmounts
			return () => {
				window.removeEventListener('beforeunload', handleUnload);
				window.removeEventListener('load', handleReload);
			};
		}
	}, [socket, userToken]);

	const handlePlayerNameSubmit = () => {
		if (playerName.trim()) {
			setPlayerName(playerName);
			setPlayers((prevPlayers) =>
				prevPlayers.map((player) => {
					if (player.userToken === userToken) {
						return { ...player, name: playerName };
					}
					return player;
				})
			);

			socket.emit('update_player_name', { lobbyId, userToken, playerName });
		}
	};

	const handleLobbyIdCopy = () => {
		navigator.clipboard.writeText(lobbyId).then(
			() => {
				setShowLinkCopied(true);
				setTimeout(() => {
					setShowLinkCopied(false);
				}, 3000);
			},
			() => {
				console.error('Failed to copy lobby ID to clipboard.');
			}
		);
	};

	return (
		<div className={`w-full h-full flex flex-col justify-center items-center`}>
			{showLinkCopied && (
				<span className={`absolute top-5 font-sunny text-lg text-red-300`}>LOBBY ID COPIED!</span>
			)}
			<div className={`w-full justify-start mb-4`}>
				<BackButton />
			</div>
			<div className={`flex flex-col space-y-1 mb-4 leading-none justify-center text-center`}>
				<div className={`relative`}>
					<h1 className='font-sunny text-4xl'>Lobby ID: {lobbyId}</h1>
					<FaCopy
						onClick={handleLobbyIdCopy}
						size={18}
						className={`text-white/50 absolute -right-8 top-2 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
					/>
				</div>
				<h2 className={`font-manga text-xl ${isHost ? 'text-green-300' : 'text-red-300'}`}>
					HOST: {isHost ? 'TRUE' : 'FALSE'}
				</h2>
			</div>
			<div
				className={`flex flex-col h-full w-full items-center justify-center bg-blue-300/10 pt-4 rounded-md`}>
				<h2 className={`font-sunny text-3xl text-blue-300 mb-2`}>PLAYER LIST</h2>
				<ul className='w-full list-disc space-y-2'>
					{players?.map((player, index) => (
						<li
							key={index}
							className={`py-2 ${
								index % 2 === 0 ? 'bg-white/10' : ''
							} relative w-full font-manga text-2xl flex space-x-2 justify-center text-center items-center`}>
							<div className='relative w-fit flex justify-center items-center'>
								<span className='select-none absolute bottom-0 -left-9 font-sunny text-[16px] text-green-300'>
									{players[index].userToken === userToken ? '  (YOU)' : ''}
								</span>
								{players[index].userToken === userToken && editingName ? (
									<input
										type='text'
										value={playerName}
										onChange={(e) => setPlayerName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handlePlayerNameSubmit();
												setEditingName(false);
											}
										}}
										placeholder={player.name}
										maxLength={16}
										className='w-[172px] h-[30px] text-center font-manga bg-blue-300/10 rounded-md text-white placeholder:text-white/50'
									/>
								) : (
									<span className='w-[172px] h-[30px] flex items-center justify-center'>
										{player.name}
									</span>
								)}
								{players[index].userToken === userToken && (
									<div className='select-none outline-none absolute bottom-2 -right-5 flex items-center justify-center'>
										{editingName ? (
											<FaCheck
												onClick={() => {
													handlePlayerNameSubmit();
													setEditingName(false);
												}}
												tabIndex={0}
												size={14}
												className='cursor-pointer sm:hover:opacity-50 sm:active:scale-95'
											/>
										) : (
											<FaPencil
												onClick={() => {
													setEditingName(true);
												}}
												size={14}
												className='cursor-pointer sm:hover:opacity-50 sm:active:scale-95'
											/>
										)}
									</div>
								)}
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
