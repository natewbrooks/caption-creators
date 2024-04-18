'use client';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import TopBar from '@/app/components/login/topBar';
import CaptionVideoComponent from '../../components/game/CaptionVideoComponent';

export default function GamePage() {
	const { id: lobbyId } = useParams();
	const [players, setPlayers] = useState([]);
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);
	const userToken = getUserToken();
	const [disconnectingUsers, setDisconnectingUsers] = useState({});

	const [currentRound, setCurrentRound] = useState(1);
	const [roundData, setRoundData] = useState({});
	const [captionedThisRound, setCaptionedThisRound] = useState(false);

	const handleCaptionSubmit = (caption) => {
		const socketInstance = getSocket();
		socketInstance.emit('game_action', {
			lobbyId,
			actionType: 'submit_caption',
			data: {
				userToken: userToken,
				videoId: 'fakeVideoIDForNow',
				caption: caption,
			},
		});
	};

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

		socketInstance.on('round_change', (round) => {
			setCurrentRound(round);
			setRoundData((prev) => ({
				...prev,
				[round]: initRoundData(players, round)[round],
			}));
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
							data-text={`~ ROUND ${currentRound} ~`}
							className='font-sunny text-3xl md:text-4xl select-none'>
							<span className={`text-green-300`}>~</span> ROUND {currentRound}{' '}
							<span className={`text-green-300`}>~</span>
						</h1>
					</div>
				</div>

				{players && roundData && (
					<CaptionVideoComponent
						players={players}
						currentRound={currentRound}
						captionedThisRound={captionedThisRound}
						setCaptionedThisRound={setCaptionedThisRound}
						roundData={roundData}
						setRoundData={setRoundData}
						lobbyId={lobbyId}
						userToken={userToken}
						handleCaptionSubmit={handleCaptionSubmit}
					/>
				)}
			</div>
		</div>
	);
}
