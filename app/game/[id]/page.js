'use client';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import TopBar from '@/app/components/login/topBar';

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

	const [currentRound, setCurrentRound] = useState(1);
	const [roundData, setRoundData] = useState({});
	const [currentCaption, setCurrentCaption] = useState('');
	const [captionedThisRound, setCaptionedThisRound] = useState(false);
	const [currentVote, setCurrentVote] = useState('');
	const [votedThisRound, setVotedThisRound] = useState(false);

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

	function handleUnload() {
		const socketInstance = getSocket();
		socketInstance.emit('reload', userToken);
	}
	function handleReload() {
		const socketInstance = getSocket();
		socketInstance.emit('restore_session', userToken);
	}

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		socketInstance.on('lobby_details', ({ members }) => {
			setPlayers(members);
			const initialData = initRoundData(members, currentRound);
			setRoundData(initialData);
		});

		socketInstance.on('notify_players', ({ event, data }) => {
			if (!data || !data.userToken) return;
			const wasMyAction = data.userToken === userToken;

			setRoundData((prev) => {
				const newRoundData = { ...prev };
				const playerEntries = newRoundData[1] || [];

				const playerIndex = playerEntries.findIndex((p) => p.userToken === data.userToken);
				if (playerIndex !== -1) {
					if (event === 'caption_submitted') {
						playerEntries[playerIndex].caption = data.caption;
						if (wasMyAction) setCaptionedThisRound(true);
					} else if (event === 'vote_submitted') {
						playerEntries[playerIndex].voted = true;
						if (wasMyAction) setVotedThisRound(true);
					}
				}

				return newRoundData;
			});
		});

		socketInstance.on('round_change', (round) => {
			setCurrentRound(round);
			setRoundData((prev) => ({
				...prev,
				[round]: initRoundData(players, round)[round],
			}));
			setCaptionedThisRound(false);
			setVotedThisRound(false);
			setCurrentCaption('');
			setCurrentVote('');
		});

		socketInstance.emit('fetch_lobby_details', { lobbyId });

		return () => {
			socketInstance.off('lobby_details');
			socketInstance.off('notify_players');
			socketInstance.off('round_change');
		};
	}, [lobbyId]);

	useEffect(() => {
		console.log('Round data updated:', JSON.stringify(roundData));
	}, [roundData]);

	function initRoundData(players, currentRound) {
		let newRoundData = {};
		newRoundData[currentRound] = players.map((player) => ({
			userToken: player.userToken,
			caption: '',
			voted: false,
		}));
		return newRoundData;
	}

	const handleCaptionSubmit = () => {
		const socketInstance = getSocket();
		socketInstance.emit('game_action', {
			lobbyId,
			actionType: 'submit_caption',
			data: {
				userToken: userToken,
				videoId: 'fakeVideoIDForNow',
				caption: currentCaption,
			},
		});
	};

	return (
		<div className={`w-full h-full flex flex-col items-center`}>
			<TopBar
				userOnClickEnabled={false}
				backButtonGoHome={true}
				showProfileIfNotLoggedIn={false}
			/>
			<div className={`flex flex-col space-y-1 mb-8 leading-none justify-center text-center`}>
				<div className={`flex flex-col w-full justify-center items-center mb-4`}>
					<div className={`flex w-full justify-center space-x-2`}>
						<h1
							data-text={`Game ID -`}
							className='font-sunny text-4xl md:text-5xl select-none'>
							Game ID -
						</h1>
						<h1
							data-text={`${lobbyId}`}
							className='text-4xl md:text-5xl font-manga select-text text-yellow-300'>
							{lobbyId}
						</h1>
					</div>
					<div className={`flex w-full justify-center space-x-2`}>
						<h1
							data-text={`~ ROUND 1 ~`}
							className='font-sunny text-3xl md:text-4xl select-none'>
							<span className={`text-green-300`}>~</span> ROUND 1{' '}
							<span className={`text-green-300`}>~</span>
						</h1>
					</div>
				</div>

				<div
					className={`flex justify-center items-center aspect-video w-full h-full sm:h-[25vh] md:h-[30vh] lg:h-[40vh] xl:h-[50vh] bg-white rounded-md p-2`}>
					<h1
						data-text='VIDEO PLACEHOLDER'
						className={`font-sunny text-4xl text-dark`}>
						VIDEO PLACEHOLDER
					</h1>
				</div>

				{captionedThisRound ? (
					<div className='relative top-4 w-full flex justify-center mt-2'>
						<h1
							data-text='Waiting for others to caption...'
							className={`w-fit font-sunny text-4xl text-yellow-300`}>
							Waiting for others to caption...
						</h1>
					</div>
				) : (
					<div>
						<input
							type='text'
							value={currentCaption}
							maxLength={64}
							onChange={(e) => setCurrentCaption(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleCaptionSubmit();
								}
							}}
							placeholder='Enter caption...'
							className='outline-none font-manga text-white text-xl text-center bg-darkAccent w-full h-[4rem] px-2 rounded-md placeholder:text-white/50'
						/>
						<div className={`w-full flex justify-center items-center mt-4`}>
							<div
								onClick={handleCaptionSubmit}
								className='bg-dark p-2 rounded-md w-fit font-sunny text-2xl text-green-300 cursor-pointer outline outline-2 outline-green-300 sm:hover:outline-white sm:active:scale-95'>
								SUBMIT CAPTION
							</div>
						</div>
					</div>
				)}
				{votedThisRound ? 'waiting for others to vote...' : ''}

				<div className='bg-dark/80 py-4 absolute bottom-0 left-0 flex justify-evenly w-full h-fit -z-[1] font-manga text-xl'>
					{players.map((player) => (
						<div
							key={player.userToken}
							className='flex flex-col justify-center items-center'>
							<div className={`flex space-x-2 items-center`}>
								<FaUserCircle
									size={18}
									className={`-translate-y-[0.15rem]`}
								/>
								<h1 className='font-manga text-2xl'>{player.name}</h1>
							</div>
							<div className='flex'>
								{roundData[currentRound]?.find((p) => p.userToken === player.userToken)
									?.caption && (
									<div className={`relative flex items-center space-x-1`}>
										<h1 className='font-sunny text-md text-green-300'>READY</h1>
										<FaCheck
											size={12}
											className='absolute -right-4 text-green-300'
										/>
									</div>
								)}
								{roundData[currentRound]?.find((p) => p.userToken === player.userToken)?.voted && (
									<div className={`flex space-x-2 items-center`}>
										<h1 className='font-sunny text-md text-blue-300'>VOTED</h1>
										<FaCheck
											size={16}
											className='text-blue-300'
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
