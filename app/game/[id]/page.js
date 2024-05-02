'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TopBar from '@/app/components/login/topBar';
import CaptionComponent from '../../components/game/CaptionComponent';
import PromptComponent from '@/app/components/game/PromptComponent';
import BackButton from '@/app/components/BackButton';
import { FaClock } from 'react-icons/fa6';
import VotingComponent from '@/app/components/game/VoteComponent';
import GamePlayersScrollbar from '@/app/components/game/modules/GamePlayersScrollbar';
import { useSocket } from '@/app/contexts/socketContext';

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
	const { socket, userToken } = useSocket(); // Clients websocket and userToken

	const [disconnectingUsers, setDisconnectingUsers] = useState({}); // Players who disconnected or swapped tabs within the last 10 seconds

	const [currentRound, setCurrentRound] = useState(1); // Keeps track of current round
	const [gameData, setGameData] = useState({}); // Keeps track of the entire game data
	const [roundData, setRoundData] = useState([]); // Keeps track of current round data
	const [phaseData, setPhaseData] = useState([]); // Keeps track of current phase data

	const [gamePhaseTimer, setGamePhaseTimer] = useState(0); // Keeps track of the current phase's
	const [currentPhase, setCurrentPhase] = useState('prompt'); // Keeps track of the current phase
	const [phaseIndex, setPhaseIndex] = useState(0); // Keep track of current phase INDEX (reconstructed on client)
	const [roundIndex, setRoundIndex] = useState(0); // Keep track of current round INDEX (reconstructed on client)
	const [usersFinished, setUsersFinished] = useState([]); // Keeps track of the userTokens that are finished current phase

	const [currentVoteUser, setCurrentVoteUser] = useState(null); // The userToken of the player the client is currently looking at in the voting component
	const [currentVideoDisplayed, setCurrentVideoDisplayed] = useState(null);

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
	//
	// 	socket.emit('game_action', {
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
	// 	if (socket) {
	// 		window.addEventListener('beforeunload', handleUnload);
	// 		// Check if the document is already loaded
	// 		if (document.readyState === 'complete') {
	// 			handleReload(); // If the document is already loaded, call handleReload immediately
	// 		} else {
	// 			window.addEventListener('load', handleReload);
	// 		}

	// 		let intervalIds = {}; // To store interval IDs for clearing them later

	// 		socket.on('disconnectTimerStarted', ({ userToken, duration }) => {
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

	// 		socket.on('disconnectTimerEnded', (userToken) => {
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
	// 			socket.off('disconnectTimerStarted');
	// 			socket.off('disconnectTimerEnded');
	// 		};
	// 	}
	// }, [socket, userToken]);

	// function handleUnload() {
	//
	// 	socket.emit('reload', userToken);
	// }
	// function handleReload() {
	//
	// 	socket.emit('restore_session', userToken);
	// }

	useEffect(() => {
		socket.on('lobby_details', ({ members }) => {
			setPlayers(members);
		});

		socket.on('notify_players', ({ event, data }) => {
			switch (event) {
				case 'game_start':
					setGameData(data.gameData);
					setRoundIndex(0);
					setPhaseIndex(0);
					setUsersFinished([]);
					break;
				case 'round_start':
					setCurrentRound(data.roundIndex + 1);
					setRoundIndex(data.roundIndex);
					break;
				case 'phase_countdown':
					console.log(data.key + ', ' + data.time);
					setGamePhaseTimer(data.time);
					break;
				case 'phase_start':
					setCurrentPhase(data.key);
					setPhaseIndex(data.phaseIndex);
					setGamePhaseTimer(data.duration);
					setUsersFinished([]);
					console.log('USERS FINISHED: ' + data.usersFinished);
					break;
				case 'game_data_updated':
					setGameData(data.gameData || gameData);
					setUsersFinished(data.usersFinished || usersFinished);
					console.log('USERS FINISHED: ' + data.usersFinished);
			}
		});

		socket.emit('fetch_lobby_details', { lobbyId });

		return () => {
			socket.off('lobby_details');
			socket.off('notify_players');
		};
	}, [socket, lobbyId]);

	useEffect(() => {
		const rounds = gameData.rounds;
		if (rounds && rounds.length > roundIndex) {
			const currentRound = rounds[roundIndex];
			setRoundData(currentRound);
			if (currentRound.phases && currentRound.phases.length > phaseIndex) {
				const currentPhaseData = currentRound.phases[phaseIndex];
				if (currentPhaseData) {
					setPhaseData(currentPhaseData.data);
				} else {
					setPhaseData([]);
				}
			}
		}
	}, [roundIndex, phaseIndex, gameData]);

	useEffect(() => {
		if (currentPhase === 'vote' && players.length > 0) {
			setCurrentVoteUser(players[0].userToken);
		}
	}, [currentPhase]);

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
								data-text={`${gamePhaseTimer < 10 ? '0' : ''}${gamePhaseTimer}s`}
								className={`min-w-[3ch] items-end flex text-right ${
									gamePhaseTimer < 10 ? 'text-red-300' : 'text-yellow-300'
								} text-2xl md:text-3xl font-manga`}>
								{gamePhaseTimer < 10 ? `0${gamePhaseTimer}` : gamePhaseTimer}s
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
								<PromptComponent
									lobbyId={lobbyId}
									players={players}
									currentRound={currentRound}
									gameData={gameData}
									setGameData={setGameData}
								/>
							)}

							{currentPhase === 'caption' && (
								<CaptionComponent
									players={players}
									currentRound={currentRound}
									gameData={gameData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									currentVideoDisplayed={currentVideoDisplayed}
									setCurrentVideoDisplayed={setCurrentVideoDisplayed}
								/>
							)}

							{currentPhase === 'vote' && (
								<VotingComponent
									players={players}
									currentRound={currentRound}
									roundData={roundData}
									phaseData={phaseData}
									gameData={gameData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									currentVoteUser={currentVoteUser}
									currentVideoDisplayed={currentVideoDisplayed}
									setCurrentVideoDisplayed={setCurrentVideoDisplayed}
								/>
							)}
						</>
					)}

					<GamePlayersScrollbar
						players={players}
						currentRound={currentRound}
						currentPhase={currentPhase}
						gameData={gameData}
						handleComponentDisplay={handleComponentDisplay}
						currentVoteUser={currentVoteUser}
						setCurrentVoteUser={setCurrentVoteUser}
						usersFinished={usersFinished || []}
						phaseData={phaseData}
					/>
				</div>
			</div>
		</div>
	);
}
