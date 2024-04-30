'use client';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TopBar from '@/app/components/login/topBar';
import CaptionVideoComponent from '../../components/game/CaptionVideoComponent';
import KeywordPromptComponent from '@/app/components/game/KeywordPromptComponent';
import BackButton from '@/app/components/BackButton';
import { FaClock } from 'react-icons/fa6';
import VotingComponent from '@/app/components/game/VotingComponent';
import GamePlayersScrollbar from '@/app/components/game/modules/GamePlayersScrollbar';

export default function GamePage() {
	const { id: lobbyId } = useParams(); // Current Lobby ID!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	const [players, setPlayers] = useState([]); // Players in the game
	/* 
	players: [
				{
					id: socket.id,
					name: playerName,
					email: email,
					isHost: true,
					userToken: hostUserToken,
					avatar: null,
				},
			],
	*/

	const [playerName, setPlayerName] = useState(''); // Clients game name
	const [socket, setSocket] = useState(null); // Clients websocket
	const userToken = getUserToken(); // Get clients userToken

	const [disconnectingUsers, setDisconnectingUsers] = useState({}); // Players who disconnected or swapped tabs within the last 10 seconds

	const [currentRound, setCurrentRound] = useState(1); // Keeps track of current round
	const [gameData, setGameData] = useState({}); // Keeps track of the current round data

	const [gamePhaseTimer, setGamePhaseTimer] = useState(0); // Keeps track of the current phase's
	const [currentPhase, setCurrentPhase] = useState('prompt'); // Keeps track of the current phase
	const [isFinishedPhase, setIsFinishedPhase] = useState(false); // Keeps track of whether the client is done the current phase

	const [currentVoteUser, setCurrentVoteUser] = useState(null); // The userToken of the player the client is currently looking at in the voting component

	const handleComponentDisplay = (key) => {
		switch (key) {
			case 'prompt':
				setCurrentPhase(key);
				break;
			case 'video':
				setCurrentPhase(key);
				break;
			case 'vote':
				setCurrentPhase(key);
				break;
			default:
				break;
		}
	};

	// const handleCaptionSubmit = (caption) => {
	// 	const socketInstance = getSocket();
	// 	socketInstance.emit('game_action', {
	// 		lobbyId,
	// 		actionType: 'submit_caption',
	// 		data: {
	// 			userToken: userToken,
	// 			videoId: 'fakeVideoIDForNow',
	// 			caption: caption,
	// 		},
	// 	});
	// };

	// useEffect(() => {
	// 	const socketInstance = getSocket();
	// 	setSocket(socketInstance);

	// 	if (socketInstance) {
	// 		window.addEventListener('beforeunload', handleUnload);
	// 		// Check if the document is already loaded
	// 		if (document.readyState === 'complete') {
	// 			handleReload(); // If the document is already loaded, call handleReload immediately
	// 		} else {
	// 			window.addEventListener('load', handleReload);
	// 		}

	// 		let intervalIds = {}; // To store interval IDs for clearing them later

	// 		socketInstance.on('disconnectTimerStarted', ({ userToken, duration }) => {
	// 			clearInterval(intervalIds[userToken]); // Clear existing interval if any

	// 			// Immediately set the initial duration
	// 			setDisconnectingUsers((prev) => ({ ...prev, [userToken]: duration }));

	// 			// Start a new countdown interval for this user
	// 			intervalIds[userToken] = setInterval(() => {
	// 				setDisconnectingUsers((prev) => {
	// 					const currentTime = prev[userToken];
	// 					if (currentTime <= 1) {
	// 						clearInterval(intervalIds[userToken]);
	// 						const { [userToken]: _, ...rest } = prev;
	// 						return rest;
	// 					}
	// 					return { ...prev, [userToken]: currentTime - 1 }; // Decrement the timer
	// 				});
	// 			}, 1000);

	// 			setTimeout(() => {
	// 				clearInterval(intervalIds[userToken]);
	// 			}, duration * 1000);
	// 		});

	// 		socketInstance.on('disconnectTimerEnded', (userToken) => {
	// 			clearInterval(intervalIds[userToken]);
	// 			setDisconnectingUsers((prev) => {
	// 				const { [userToken]: _, ...rest } = prev;
	// 				return rest; // Remove the userToken from state
	// 			});
	// 		});

	// 		// Cleanup function removes event listener when component unmounts
	// 		return () => {
	// 			window.removeEventListener('beforeunload', handleUnload);
	// 			window.removeEventListener('load', handleReload);
	// 			Object.values(intervalIds).forEach(clearInterval);
	// 			socketInstance.off('disconnectTimerStarted');
	// 			socketInstance.off('disconnectTimerEnded');
	// 		};
	// 	}
	// }, [socket, userToken]);

	// function handleUnload() {
	// 	const socketInstance = getSocket();
	// 	socketInstance.emit('reload', userToken);
	// }
	// function handleReload() {
	// 	const socketInstance = getSocket();
	// 	socketInstance.emit('restore_session', userToken);
	// }

	useEffect(() => {
		const socketInstance = getSocket();
		setSocket(socketInstance);

		socketInstance.on('lobby_details', ({ members }) => {
			setPlayers(members);
		});

		socketInstance.on('notify_players', ({ event, data }) => {
			console.log('NOTIFIED PLAYERS: ' + JSON.stringify(data));
			switch (event) {
				case 'game_start':
					setGameData(data.gameData);
					break;
				case 'round_start':
					setGameData(data.gameData);
					setCurrentRound(data.round);
					setIsFinishedPhase(false);
					break;
				case 'phase_countdown':
					console.log(data.time);
					setGamePhaseTimer(data.time);
					break;
				case 'phase_start':
					setGameData(data.gameData);
					setCurrentPhase(data.key);
					setGamePhaseTimer(data.duration);
					setIsFinishedPhase(false);
					break;
			}
		});

		socketInstance.emit('fetch_lobby_details', { lobbyId });

		return () => {
			socketInstance.off('lobby_details');
			socketInstance.off('notify_players');
		};
	}, [lobbyId]);

	useEffect(() => {
		console.log(players[0]);
	}, []);

	useEffect(() => {
		console.log('Game data updated:', JSON.stringify(gameData));
	}, [gameData]);

	return (
		<div className={`w-full h-full flex flex-col items-center`}>
			<div className={`w-full hidden md:block`}>
				<TopBar
					userOnClickEnabled={false}
					backButtonGoHome={true}
					backButtonText={'EXIT GAME'}
					showProfileIfNotLoggedIn={false}
				/>
			</div>
			<div
				className={`flex flex-col w-full items-center h-full space-y-2 leading-none text-center`}>
				<div
					className={`flex md:hidden flex-col xs:flex-row justify-center items-center pt-2 xs:pt-0 xs:justify-between space-x-2 w-full`}>
					{/* <BackButton
						goHome={true}
						text={'EXIT GAME'}
					/> */}

					<div className={`flex w-fit text-nowrap items-center justify-center space-x-1`}>
						<h1
							data-text={`${lobbyId}`}
							className='translate-y-[0.05rem] text-yellow-300 text-xl font-manga select-none'>
							{lobbyId}
						</h1>
						<h1
							data-text={`ROUND ${currentRound}`}
							className='font-sunny text-2xl select-none'>
							ROUND {currentRound}
						</h1>
					</div>
					<div className='flex w-full justify-center xs:justify-end items-center'>
						<div className={`w-fit p-1 mr-1 rounded-full bg-dark -translate-y-[0.15rem]`}>
							<FaClock
								size={14}
								className='text-white'
							/>
						</div>
						<h1
							data-text={gamePhaseTimer + 's'}
							className={`min-w-[3ch] items-end flex text-right ${
								gamePhaseTimer < 30
									? gamePhaseTimer < 10
										? 'text-red-300'
										: 'text-yellow-300'
									: 'text-white'
							} text-[1.35rem] font-manga`}>
							{gamePhaseTimer}s
						</h1>
					</div>
				</div>
				<div
					className={`hidden md:flex flex-col w-fit xs:mb-4 lg:mb-8 justify-center items-center`}>
					<div className='flex w-full justify-center items-center space-x-2'>
						<h1
							data-text={'~'}
							className='text-green-300 font-sunny text-3xl md:text-4xl'>
							~
						</h1>
						<div className='flex w-full justify-end items-center'>
							<div className={`w-fit p-1 mr-1 rounded-full bg-dark -translate-y-[0.15rem]`}>
								<FaClock
									size={14}
									className='text-white'
								/>
							</div>
							<h1
								data-text={gamePhaseTimer + 's'}
								className={`min-w-[3ch] items-end flex text-right ${
									gamePhaseTimer < 10 ? 'text-red-300' : 'text-yellow-300'
								} text-2xl md:text-3xl font-manga`}>
								{gamePhaseTimer}s
							</h1>
						</div>
						<h1
							data-text='•'
							className='text-green-300 font-sunny text-2xl md:text-3xl'>
							•
						</h1>
						<div className={`px-2`}>
							<h1
								data-text={`ROUND ${currentRound}`}
								className='font-sunny text-nowrap text-4xl md:text-5xl xxl:text-6xl'>
								ROUND {currentRound}
							</h1>
						</div>
						<h1
							data-text='•'
							className='text-green-300 font-sunny text-2xl md:text-3xl'>
							•
						</h1>

						<div className={`left-1 relative flex items-center w-fit`}>
							<h1
								data-text={lobbyId}
								className='font-manga  text-2xl md:text-3xl  min-w-[3ch] items-end flex text-right text-yellow-300'>
								{lobbyId}
							</h1>
							<h1
								data-text={'~'}
								className='relative left-3 text-green-300 font-sunny text-2xl md:text-3xl'>
								~
							</h1>
						</div>
					</div>
				</div>

				<div className={`max-w-[600px] w-full h-full flex flex-col justify-between items-center`}>
					{players && gameData && (
						<>
							{currentPhase === 'prompt' && (
								<KeywordPromptComponent
									lobbyId={lobbyId}
									userToken={userToken}
									players={players}
									currentRound={currentRound}
									gameData={gameData}
									setGameData={setGameData}
									isFinishedPhase={isFinishedPhase}
									setIsFinishedPhase={setIsFinishedPhase}
								/>
							)}

							{currentPhase === 'caption' && (
								<CaptionVideoComponent
									players={players}
									currentRound={currentRound}
									gameData={gameData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									userToken={userToken}
									isFinishedPhase={isFinishedPhase}
									setIsFinishedPhase={setIsFinishedPhase}
								/>
							)}

							{/* {currentPhase === 'vote' && (
								<VotingComponent
									players={players}
									currentRound={currentRound}
									gameData={gameData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									currentVoteUser={currentVoteUser}
									userToken={userToken}
									isFinishedPhase={isFinishedPhase}
									setIsFinishedPhase={setIsFinishedPhase}
								/>
							)} */}
						</>
					)}

					<GamePlayersScrollbar
						players={players}
						userToken={userToken}
						currentRound={currentRound}
						currentPhase={currentPhase}
						gameData={gameData}
						handleComponentDisplay={handleComponentDisplay}
						currentVoteUser={currentVoteUser}
						setCurrentVoteUser={setCurrentVoteUser}
						isFinishedPhase={isFinishedPhase}
					/>
				</div>
			</div>
		</div>
	);
}
