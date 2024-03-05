'use client';
import BackButton from '@/app/components/BackButton';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPencil, FaCheck, FaCopy } from 'react-icons/fa6';
import { LuUnplug } from 'react-icons/lu';

export default function GamePage() {
	const { id: lobbyId } = useParams();
	const [players, setPlayers] = useState([]);
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);
	const userToken = getUserToken();
	const [editingName, setEditingName] = useState(false);
	const [showLinkCopied, setShowLinkCopied] = useState(false);
	const [disconnectingUsers, setDisconnectingUsers] = useState({});
	const [hostUserToken, setHostUserToken] = useState(null);

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		if (lobbyId && socketInstance) {
			// Send request to server to fetch lobby details
			socketInstance.emit('fetch_lobby_details', { lobbyId });

			socketInstance.on('lobby_details', ({ members, hostUserToken }) => {
				setPlayers(members);
				setHostUserToken(hostUserToken);
			});

			socketInstance.on('update_lobby', ({ members, hostUserToken }) => {
				setPlayers(members);
				setHostUserToken(hostUserToken);
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

			let intervalIds = {}; // To store interval IDs for clearing them later

			socketInstance.on('disconnectTimerStarted', ({ userToken, duration }) => {
				clearInterval(intervalIds[userToken]); // Clear existing interval if any

				// Immediately set the initial duration
				setDisconnectingUsers((prev) => ({ ...prev, [userToken]: duration }));

				// Start a new countdown interval for this user
				intervalIds[userToken] = setInterval(() => {
					setDisconnectingUsers((prev) => {
						const currentTime = prev[userToken];
						if (currentTime <= 1) {
							clearInterval(intervalIds[userToken]); // Stop the interval
							const { [userToken]: _, ...rest } = prev; // Remove this userToken from the state
							return rest;
						}
						return { ...prev, [userToken]: currentTime - 1 }; // Decrement the timer
					});
				}, 1000);

				setTimeout(() => {
					clearInterval(intervalIds[userToken]); // Ensure interval is cleared when time runs out
				}, duration * 1000);
			});

			socketInstance.on('disconnectTimerEnded', (userToken) => {
				clearInterval(intervalIds[userToken]); // Clear the interval when the timer ends
				setDisconnectingUsers((prev) => {
					const { [userToken]: _, ...rest } = prev;
					return rest; // Remove the userToken from state
				});
			});

			// Cleanup function removes event listener when component unmounts
			return () => {
				window.removeEventListener('beforeunload', handleUnload);
				window.removeEventListener('load', handleReload);
				Object.values(intervalIds).forEach(clearInterval);
				socketInstance.off('disconnectTimerStarted');
				socketInstance.off('disconnectTimerEnded');
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
			<div className={`flex flex-col space-y-1 mb-8 leading-none justify-center text-center`}>
				<div className={`relative`}>
					<h1 className='font-sunny text-3xl select-none'>Lobby ID: </h1>
					<h1 className='font-manga text-5xl'> {lobbyId}</h1>
					<FaCopy
						onClick={handleLobbyIdCopy}
						size={18}
						className={`text-white/50 absolute -right-8 bottom-4 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
					/>
				</div>
			</div>
			<div
				className={`flex flex-col h-full w-full items-center justify-center bg-blue-300/10 pt-4 rounded-md`}>
				<h2 className={`font-sunny text-3xl text-blue-300 mb-2 select-none`}>PLAYER LIST</h2>
				<ul className='w-full list-disc space-y-2'>
					{players?.map((player, index) => (
						<li
							key={index}
							className={`py-2 ${
								index % 2 === 0 ? 'bg-white/10' : ''
							} relative w-full font-manga text-2xl flex space-x-2 justify-center text-center items-center`}>
							{disconnectingUsers[player.userToken] !== undefined && (
								<div
									className={`h-fit absolute right-4 items-center justify-center flex -space-x-1`}>
									<LuUnplug
										size={18}
										className={`relative bottom-[0.15rem] h-full text-red-300`}
									/>
									<span className={`w-[50px] h-fit`}>{disconnectingUsers[player.userToken]}s</span>
								</div>
							)}
							<div className='relative w-fit flex justify-center items-center'>
								<span
									className={`${
										players[index].userToken === hostUserToken
											? 'text-green-300'
											: players[index].userToken === userToken
											? 'text-white/20'
											: ''
									} select-none absolute bottom-0 -left-10 font-sunny text-[16px]`}>
									{players[index].userToken === hostUserToken
										? '  (HOST)'
										: players[index].userToken === userToken
										? '  (YOU)'
										: ''}
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
