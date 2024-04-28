'use client';
import { FixedSizeList as List } from 'react-window';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaPencil, FaCheck, FaCopy } from 'react-icons/fa6';
import { LuUnplug } from 'react-icons/lu';
import TopBar from '@/app/components/login/topBar';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/userAuthContext';
import LobbyInfoSelectModal from '@/app/components/lobby/LobbyInfoSelectModal';
import LobbyAvatarSelect from '@/app/components/lobby/LobbyAvatarSelect';
import AutoSizer from 'react-virtualized-auto-sizer';

function PlayerRow({ index, style, data }) {
	const player = data.players[index];
	const isDisconnecting = data.disconnectingUsers[player.userToken] !== undefined;
	const isHost = player.userToken === data.hostUserToken;
	const isCurrentUser = player.userToken === data.userToken;
	const editingName = data.editingName;
	const setPlayerName = data.setPlayerName;
	const handlePlayerNameSubmit = data.handlePlayerNameSubmit;
	const handleAvatarSelect = data.handleAvatarSelect;
	const setEditingName = data.setEditingName;
	const playerName = data.playerName;
	const takenAvatars = data.takenAvatars;
	const avatars = data.avatars;
	const playerAvatar = Object.keys(takenAvatars).find(
		(key) => takenAvatars[key] === player.userToken
	);

	return (
		<li
			style={style}
			className={`py-2 ${
				index % 2 === 0 ? 'bg-darkAccent' : 'bg-dark'
			} relative w-full font-manga text-3xl flex space-x-2 justify-center text-center items-center rounded-md`}>
			{isDisconnecting && (
				<div className={`h-fit absolute right-4 items-center justify-center flex -space-x-1`}>
					<LuUnplug
						size={18}
						className={`relative bottom-[0.15rem] h-full text-red-300`}
					/>
					<span className={`w-[50px] h-fit`}>{data.disconnectingUsers[player.userToken]}s</span>
				</div>
			)}
			<div className={`relative w-fit flex justify-center items-center `}>
				<div
					className={`relative flex flex-col items-center justify-center ${
						playerAvatar && (isHost || isCurrentUser) ? '-translate-y-2' : ''
					}`}>
					{playerAvatar && (
						<div className='relative w-[40px] h-[40px] md:w-[42px] md:h-[42px]'>
							<Image
								src={playerAvatar}
								layout='responsive'
								width={100} // These width and height serve as aspect ratio
								height={100}
								className={`outline-dark outline-2 outline rounded-full`}
								alt={`Selected Player Avatar ${index + 1}`}
								unoptimized
							/>
						</div>
					)}

					{/* <div className={`absolute w-[480px] top-0`}>
						<LobbyAvatarSelect
							avatars={avatars}
							takenAvatars={takenAvatars}
							userToken={data.userToken}
							players={data.players}
							handleAvatarSelect={handleAvatarSelect}
						/>
					</div> */}

					<div
						style={{ width: !playerAvatar ? 48 : '', height: !playerAvatar ? 48 : '' }}
						className={`${
							isHost ? 'text-green-300' : isCurrentUser ? 'text-yellow-300' : ''
						} select-none  ${
							playerAvatar ? '-bottom-[1.55rem] md:-bottom-[1.85rem] absolute' : 'translate-y-3'
						} font-sunny text-xl md:text-2xl`}>
						{isHost ? 'HOST' : isCurrentUser ? 'YOU' : ''}
					</div>
				</div>

				<div className={`px-4`}>
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
							maxLength={12}
							className='w-[180px] h-[30px] outline-none text-2xl md:text-3xl text-center  font-manga bg-white/10 rounded-md text-white placeholder:text-white/50'
						/>
					) : (
						<span className='w-[180px] h-[30px] flex justify-center text-2xl md:text-3xl items-center'>
							{player.name}
						</span>
					)}
				</div>
				{isCurrentUser && (
					<div className='select-none outline-none absolute bottom-5 -right-3 flex items-center justify-center'>
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
	const [avatars, setAvatars] = useState([]);
	const [takenAvatars, setTakenAvatars] = useState({});
	const [currentAvatar, setCurrentAvatar] = useState('');
	const [showEntryPrompt, setShowEntryPrompt] = useState(true);
	const [error, setError] = useState('');
	const { currentUser } = useAuth();
	const router = useRouter();

	const [listHeight, setListHeight] = useState(window.innerHeight * 0.8); // Initial height set to 80% of viewport height

	useEffect(() => {
		const handleResize = () => {
			setListHeight(window.innerHeight * 0.8); // Update height on window resize
		};

		window.addEventListener('resize', handleResize);

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const fetchAvatars = async (start, end) => {
		const loadedAvatars = [];
		for (let i = start; i <= end; i++) {
			const avatarPath = `/avatars/${i}.png`; // Path should reflect where the images are stored
			loadedAvatars.push(avatarPath);
		}
		setAvatars(loadedAvatars);
	};

	useEffect(() => {
		const fetchData = async () => {
			const socketInstance = getSocket();
			setSocket(socketInstance);

			if (lobbyId && socketInstance) {
				socketInstance.emit('fetch_lobby_details', { lobbyId });
				socketInstance.on(
					'lobby_details',
					({ members, hostUserToken, avatarRange, takenAvatars }) => {
						setPlayers(members);
						setHostUserToken(hostUserToken);
						setTakenAvatars(takenAvatars);
						if (avatarRange) {
							fetchAvatars(avatarRange[0], avatarRange[1]);
						}
					}
				);

				socketInstance.on('update_lobby', ({ members, hostUserToken, takenAvatars }) => {
					setPlayers(members);
					setHostUserToken(hostUserToken);
					setTakenAvatars(takenAvatars);
					try {
						const myAvatar = Object.values(takenAvatars).find(takenAvatars[userToken]);
						setCurrentAvatar(myAvatar);
					} catch (error) {}
				});
			}
		};
		fetchData();
	}, [lobbyId, userToken, setTakenAvatars]);

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		if (lobbyId && socketInstance) {
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

	const handlePlayerNameSubmit = useCallback(() => {
		if (playerName.trim()) {
			const newName = playerName.trim();
			setPlayerName(newName); // set state only once per submit to avoid triggering re-renders

			const updatedPlayers = players.map((player) => {
				if (player.userToken === userToken) {
					return { ...player, name: newName };
				}
				return player;
			});

			setPlayers(updatedPlayers);

			const socketInstance = getSocket();
			socketInstance.emit('update_player_name', { lobbyId, userToken, playerName: newName });
		}
	}, [playerName, players, userToken, lobbyId]);

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

	const handleAvatarSelect = (avatarSrc) => {
		// Check if the avatar is already taken by another user
		if (takenAvatars[avatarSrc] && takenAvatars[avatarSrc] !== userToken) {
			alert('This avatar is already taken. Please choose another.');
			return;
		}

		// If selecting a new avatar that is not taken, update locally and emit to server
		let updatedTakenAvatars = { ...takenAvatars };

		// Remove old avatar selection if it exists
		Object.keys(updatedTakenAvatars).forEach((key) => {
			if (updatedTakenAvatars[key] === userToken) {
				delete updatedTakenAvatars[key];
			}
		});

		updatedTakenAvatars[avatarSrc] = userToken;
		setTakenAvatars(updatedTakenAvatars);
		setCurrentAvatar(avatarSrc);

		// Emit the avatar selection event to the server
		const socketInstance = getSocket();
		socketInstance.emit('avatar_selected', {
			lobbyId,
			userToken,
			avatarSrc,
		});
	};

	return (
		<div className={`w-full h-full flex flex-col items-center`}>
			<h1
				className={`${
					showLinkCopied ? 'translate-y-0' : '-translate-y-full'
				} absolute w-full text-center transition-all  duration-500 bg-green-300 border border-b-4 border-dark text-dark xbold text-nowrap left-0 top-0 font-sunny text-2xl`}>
				LOBBY ID COPIED TO CLIPBOARD!
			</h1>
			<TopBar
				userOnClickEnabled={false}
				backButtonGoHome={true}
				showProfileIfNotLoggedIn={false}
			/>
			<div
				id='lobby-header'
				className={`flex flex-col space-y-1 mt-2 xs:mb-4 lg:mb-8 leading-none justify-center text-center`}>
				<div className={`relative`}>
					<div className={`flex space-x-2 w-full justify-center`}>
						<h1
							data-text={`Lobby ID -`}
							className='font-sunny  xs:text-5xl lg:text-8xl select-none'>
							Lobby ID -
						</h1>
						<h1
							data-text={`${lobbyId}`}
							className='xs:text-5xl lg:text-8xl font-manga select-text text-yellow-300'>
							{lobbyId}
						</h1>
					</div>

					<FaCopy
						onClick={handleLobbyIdCopy}
						size={20}
						className={`text-white absolute -right-8 bottom-5 lg:bottom-12 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
					/>
				</div>
				<div className={`flex w-full justify-center space-x-2`}>
					<h1
						data-text={`~ ${players.length}/9 PLAYERS ~`}
						className='font-manga text-2xl sm:text-3xl lg:text-4xl select-none'>
						<span className={`text-green-300`}>~</span> {players.length}/9 PLAYERS{' '}
						<span className={`text-green-300`}>~</span>
					</h1>
				</div>
			</div>

			{!showEntryPrompt ? (
				<>
					{countdown !== null && (
						<div
							className={`absolute z-30 w-full h-full flex justify-center items-center md:-translate-y-40`}>
							<div className={`w-fit h-fit flex justify-center p-12 bg-green-300 rounded-full`}>
								<div className={`flex flex-col items-center justify-center `}>
									<h1
										data-text='GAME STARTS IN...'
										className={`font-sunny text-3xl text-dark`}>
										GAME STARTS IN...
									</h1>
									<h1
										data-text={`${countdown}`}
										id='startTimer'
										className={` translate-y-4 text-9xl font-manga z-20 ${
											countdown >= 4
												? 'text-green-300'
												: countdown <= 3 && countdown >= 2
												? 'text-yellow-300'
												: 'text-red-300'
										}`}>
										{countdown || 'Go!'}
									</h1>
								</div>
							</div>
						</div>
					)}
					<div
						className={`flex flex-col w-full md:w-[80%] max-h-[800px] h-full  p-4 bg-dark rounded-md outline outline-2 outline-darkAccent`}>
						<div className={`h-full w-full `}>
							<AutoSizer>
								{({ height, width }) => (
									<>
										<List
											width={width}
											height={height}
											itemCount={players.length}
											itemSize={84}
											itemData={{
												players,
												disconnectingUsers,
												hostUserToken,
												editingName,
												setPlayerName,
												handlePlayerNameSubmit,
												handleAvatarSelect,
												setEditingName,
												userToken,
												playerName,
												takenAvatars,
												avatars,
											}}>
											{PlayerRow}
										</List>
									</>
								)}
							</AutoSizer>
						</div>
						{userToken === hostUserToken ? (
							<div
								onClick={() => {
									if (players.length >= 2) {
										handleGameStart();
									}
								}}
								className={`bg-dark flex z-20 w-full justify-center text-center p-2 md:p-4 font-sunny text-4xl md:text-5xl ${
									players.length >= 2
										? 'cursor-pointer outline-green-300 sm:hover:outline-white sm:active:scale-95'
										: 'outline-red-300'
								} outline outline-2 rounded-md text-white `}>
								{players.length >= 2 ? 'START GAME' : 'NEED ATLEAST 2 PLAYERS TO START GAME'}
							</div>
						) : (
							players.length >= 2 && (
								<div
									className={`bg-dark flex z-20 w-full justify-center text-center p-2 md:p-4 font-sunny text-4xl md:text-5xl ${
										players.length >= 2 ? 'outline-yellow-300' : 'outline-red-300'
									} outline outline-2 rounded-md text-white`}>
									{players.length >= 2
										? 'WAITING FOR HOST TO START GAME'
										: 'NEED ATLEAST 2 PLAYERS TO START GAME'}
								</div>
							)
						)}
					</div>
				</>
			) : (
				<LobbyInfoSelectModal
					avatars={avatars}
					takenAvatars={takenAvatars}
					userToken={userToken}
					players={players}
					playerName={playerName}
					setPlayerName={setPlayerName}
					handlePlayerNameSubmit={handlePlayerNameSubmit}
					handleAvatarSelect={handleAvatarSelect}
					setShowEntryPrompt={setShowEntryPrompt}
					currentAvatar={currentAvatar}
					currentUser={currentUser}
					hostUserToken={hostUserToken}
					error={error}
				/>
			)}
		</div>
	);
}
