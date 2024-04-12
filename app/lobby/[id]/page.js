'use client';
import { FixedSizeList as List } from 'react-window';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPencil, FaCheck, FaCopy } from 'react-icons/fa6';
import { LuUnplug } from 'react-icons/lu';
import TopBar from '@/app/components/login/topBar';

function PlayerRow({ index, style, data }) {
	const player = data.players[index];
	const isDisconnecting = data.disconnectingUsers[player.userToken] !== undefined;
	const isHost = player.userToken === data.hostUserToken;
	const isCurrentUser = player.userToken === data.userToken;
	const editingName = data.editingName;
	const setPlayerName = data.setPlayerName;
	const handlePlayerNameSubmit = data.handlePlayerNameSubmit;
	const setEditingName = data.setEditingName;
	const playerName = data.playerName;

	return (
		<li
			style={style}
			className={`py-2 ${
				index % 2 === 0 ? 'bg-darkAccent' : 'bg-dark'
			} relative w-full font-manga text-2xl flex space-x-2 justify-center text-center items-center`}>
			{isDisconnecting && (
				<div className={`h-fit absolute right-4 items-center justify-center flex -space-x-1`}>
					<LuUnplug
						size={18}
						className={`relative bottom-[0.15rem] h-full text-red-300`}
					/>
					<span className={`w-[50px] h-fit`}>{data.disconnectingUsers[player.userToken]}s</span>
				</div>
			)}
			<div className='relative w-fit flex justify-center items-center'>
				<span
					className={`${
						isHost ? 'text-green-300' : isCurrentUser ? 'text-yellow-300' : ''
					} select-none absolute bottom-0 -left-10 font-sunny text-[16px]`}>
					{isHost ? '  (HOST)' : isCurrentUser ? '  (YOU)' : ''}
				</span>
				{isCurrentUser && editingName ? (
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
						className='w-[172px] h-[30px] outline-none text-center font-manga bg-blue-300/10 rounded-md text-white placeholder:text-white/50'
					/>
				) : (
					<span className='w-[172px] h-[30px] flex items-center justify-center'>{player.name}</span>
				)}
				{isCurrentUser && (
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
	);
}

export default function LobbyPage() {
	const { id: lobbyId } = useParams();
	const [players, setPlayers] = useState([]);
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);
	const userToken = getUserToken();
	const [editingName, setEditingName] = useState(false);
	const [showLinkCopied, setShowLinkCopied] = useState(false);
	const [disconnectingUsers, setDisconnectingUsers] = useState({});
	const [hostUserToken, setHostUserToken] = useState(null);
	const [countdown, setCountdown] = useState(null);
	const router = useRouter();

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

			// Navigate to /game/[id] when game start
			socketInstance.on('navigate', ({ path }) => {
				console.log(`Navigating to ${path}`);
				router.push(path);
			});

			// Shows countdown til start of game
			socketInstance.on('countdown', (count) => {
				setCountdown(count);
				if (count < 1) {
					setCountdown(null); // Reset countdown after it finishes
				}
			});

			// Cleanup function removes event listeners
			return () => {
				socketInstance.off('lobby_details');
				socketInstance.off('update_lobby');
				socketInstance.off('navigate');
				socketInstance.off('countdown');
			};
		}
	}, [lobbyId, userToken]);

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		if (socketInstance) {
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
					clearInterval(intervalIds[userToken]);
				}, duration * 1000);
			});

			socketInstance.on('disconnectTimerEnded', (userToken) => {
				clearInterval(intervalIds[userToken]); // Clear the interval when the timer ends
				setDisconnectingUsers((prev) => {
					const { [userToken]: _, ...rest } = prev;
					return rest; // Remove the userToken from state
				});
			});

			return () => {
				window.removeEventListener('beforeunload', handleUnload);
				window.removeEventListener('load', handleReload);
				Object.values(intervalIds).forEach(clearInterval);
				socketInstance.off('disconnectTimerStarted');
				socketInstance.off('disconnectTimerEnded');
			};
		}
	}, [socket, userToken]);

	function handleUnload() {
		const socketInstance = getSocket();
		socketInstance.emit('reload', userToken);
	}
	function handleReload() {
		const socketInstance = getSocket();
		socketInstance.emit('restore_session', userToken);
	}

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

	const handleGameStart = () => {
		console.log('Preparing to start game for lobby ' + lobbyId);
		const socketInstance = getSocket();
		socketInstance.emit('start_game', { lobbyId, userToken });
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
		<div className={`w-full h-full flex flex-col items-center`}>
			<TopBar
				userOnClickEnabled={false}
				backButtonGoHome={true}
				showProfileIfNotLoggedIn={false}
			/>
			<div className={`flex flex-col space-y-1 mb-8 leading-none justify-center text-center`}>
				<div className={`relative`}>
					{showLinkCopied && (
						<h1
							data-text='LOBBY ID COPIED TO CLIPBOARD!'
							className={`absolute w-fit text-nowrap left-0 -top-10 font-sunny text-xl md:text-2xl text-green-300`}>
							LOBBY ID COPIED TO CLIPBOARD!
						</h1>
					)}
					<div className={`flex space-x-2 w-full justify-center`}>
						<h1
							data-text={`Lobby ID -`}
							className='font-sunny text-4xl md:text-5xl select-none'>
							Lobby ID -
						</h1>
						<h1
							data-text={`${lobbyId}`}
							className='text-4xl md:text-5xl font-manga select-text text-yellow-300'>
							{lobbyId}
						</h1>
					</div>

					<FaCopy
						onClick={handleLobbyIdCopy}
						size={20}
						className={`text-white absolute -right-8 bottom-3 md:bottom-4 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
					/>
				</div>
			</div>

			<div
				className={`relative flex flex-col h-fit w-full md:w-[80%] items-center justify-center bg-dark rounded-md outline outline-2 outline-darkAccent`}>
				{countdown !== null && (
					<div className={`absolute top-[40%] text-center flex flex-col`}>
						<h1
							data-text='GAME STARTS IN...'
							className={`font-sunny text-2xl text-white`}>
							GAME STARTS IN...
						</h1>
						<h1
							data-text={`${countdown}`}
							id='startTimer'
							className={` text-9xl font-manga ${
								countdown >= 3
									? 'text-green-300'
									: countdown === 2
									? 'text-yellow-300'
									: 'text-red-300'
							}`}>
							{countdown || 'Go!'}
						</h1>
					</div>
				)}
				<List
					height={400}
					itemCount={players.length}
					itemSize={50}
					width={'100%'}
					itemData={{
						players,
						disconnectingUsers,
						hostUserToken,
						editingName,
						setPlayerName,
						handlePlayerNameSubmit,
						setEditingName,
						userToken,
						playerName,
					}}>
					{PlayerRow}
				</List>
			</div>

			{userToken === hostUserToken ? (
				players.length >= 2 ? (
					<div className='flex justify-center w-full items-center mt-4'>
						<div
							onClick={handleGameStart}
							className='bg-dark p-2 rounded-md font-sunny text-2xl text-green-300 cursor-pointer outline outline-2 outline-green-300 sm:hover:outline-white sm:active:scale-95'>
							START GAME
						</div>
					</div>
				) : (
					<div className='flex justify-center w-full items-center mt-4'>
						<div className='bg-dark p-2 rounded-md font-sunny text-2xl text-red-300 cursor-not-allowed outline outline-2 outline-red-300'>
							NEED 2 PLAYERS TO START GAME
						</div>
					</div>
				)
			) : players.length >= 2 ? (
				<div className='flex justify-center w-full items-center mt-4'>
					<div className='bg-dark p-2 rounded-md font-sunny text-2xl text-red-300 cursor-not-allowed outline outline-2 outline-red-300'>
						WAITING FOR HOST TO START GAME...
					</div>
				</div>
			) : (
				''
			)}
		</div>
	);
}
