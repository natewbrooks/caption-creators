'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TopBar from '@/app/components/game/modules/TopBar';
import CaptionComponent from '../../components/game/content/CaptionComponent';
import PromptComponent from '@/app/components/game/content/PromptComponent';
import BackButton from '@/app/components/game/modules/BackButton';
import { FaClock, FaHourglassStart } from 'react-icons/fa6';
import { BiSolidTrafficCone } from 'react-icons/bi';
import VotingComponent from '@/app/components/game/content/VoteComponent';
import PlayersScrollbar from '@/app/components/game/modules/PlayersScrollbar';
import { useSocket } from '@/app/contexts/SocketContext';
import TransitionComponent from '@/app/components/game/transition/TransitionComponent';
import IntroComponent from '@/app/components/game/transition/IntroComponent';
import OutroComponent from '@/app/components/game/transition/OutroComponent';
import GameResultsComponent from '@/app/components/game/transition/GameResultsComponent';
import PreviewComponent from '@/app/components/game/content/PreviewComponent';
import ActionAlertModal from '@/app/components/game/modules/ActionAlertModal';

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
	const router = useRouter();
	const { socket, userToken } = useSocket(); // Clients websocket and userToken

	const [disconnectingUsers, setDisconnectingUsers] = useState({}); // Players who disconnected or swapped tabs within the last 10 seconds

	const [gameData, setGameData] = useState({}); // Keeps track of the entire game data
	const [roundData, setRoundData] = useState([]); // Keeps track of current round data
	const [phaseData, setPhaseData] = useState([]); // Keeps track of current phase data
	const [roundScoreData, setRoundScoreData] = useState({}); // Keeps track of current round's score data when outro key is detected

	const [gameStartCountdown, setGameStartCountdown] = useState(null);
	const [gamePhaseTimer, setGamePhaseTimer] = useState(0); // Keeps track of the current phase's
	const [timeLeftAtSubmit, setTimeLeftAtSubmit] = useState(0);
	const [currentPhase, setCurrentPhase] = useState(''); // Keeps track of the current phase
	const [phaseIndex, setPhaseIndex] = useState(0); // Keep track of current phase INDEX (reconstructed on client)
	const [roundIndex, setRoundIndex] = useState(0); // Keep track of current round INDEX (reconstructed on client)
	const [usersFinished, setUsersFinished] = useState([]); // Keeps track of the userTokens that are finished current phase
	const [roundMultiplier, setRoundMultiplier] = useState(1); // Keeps track of current round multiplier
	const [gameStarted, setGameStarted] = useState(false);
	const [gameEnded, setGameEnded] = useState(false);
	const [hostUserToken, setHostUserToken] = useState('');
	const [usersLoadedGamePage, setUsersLoadedGamePage] = useState([]);

	const [currentUserDisplayed, setCurrentUserDisplayed] = useState(null); // The userToken of the player the client is currently looking at in the voting component
	const [currentVideoDisplayed, setCurrentVideoDisplayed] = useState(null);
	const [seenVideos, setSeenVideos] = useState(new Set()); // Keeps track of the video URLS that have been seen by the client in preview phase
	const [vote, setVote] = useState(new Map()); //Keeps track of the client's vote hashmap

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
		// If haven't already been registered as game page loaded by server
		if (!usersLoadedGamePage.includes(userToken)) {
			console.log('GAME PAGE LOADED');
			socket.emit('game_page_loaded', {
				lobbyId: lobbyId,
				userToken: userToken,
			});
		}
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (lobbyId && socket) {
				socket.emit('fetch_lobby_details', { lobbyId });
				socket.on('lobby_details', ({ members, hostUserToken }) => {
					setPlayers(members);
					setHostUserToken(hostUserToken);
				});

				socket.on('update_lobby', ({ members, hostUserToken }) => {
					setPlayers(members);
					setHostUserToken(hostUserToken);
				});
			}
		};
		fetchData();

		return () => {
			socket.off('lobby_details');
			socket.off('update_lobby');
		};
	}, [lobbyId, userToken, gameStarted]);

	useEffect(() => {
		socket.on('navigate_to_lobby', ({ path }) => {
			if (path) {
				router.push(path);
			}
		});

		socket.on('update_lobby', ({ members, hostUserToken }) => {
			setPlayers(members);
			setHostUserToken(hostUserToken);
			console.log('HOST USER TOKEN: ' + hostUserToken);
		});

		socket.on('users_loaded_game_page', (usersArray) => setUsersLoadedGamePage(usersArray));

		// Everything handled in the GAME, sent by gameManager
		socket.on('notify_players', ({ event, data }) => {
			switch (event) {
				case 'game_start':
					setHostUserToken(data.hostUserToken);
					setGameData(data.gameData);
					setRoundData(data.roundData);
					setPhaseData(data.phaseData);
					setRoundIndex(0);
					setPhaseIndex(0);
					setUsersFinished([]);
					setGameEnded(false);
					setGameStarted(true);
					setVote(new Map());
					break;
				case 'round_start':
					setRoundIndex(data.roundIndex);
					setRoundMultiplier(data.multiplier);
					setVote(new Map());
					break;
				case 'phase_countdown':
					console.log(data.key + ', ' + data.time);
					setGamePhaseTimer(data.time);
					break;
				case 'phase_start':
					setCurrentPhase(data.key);
					setPhaseIndex(data.phaseIndex);
					setGamePhaseTimer(data.duration);
					break;
				case 'player_action_response':
					console.log('PLAYER ACTION: ' + JSON.stringify(data));
					setUsersFinished(data.usersFinished);
					console.log('USERS FINISHED: ' + data.usersFinished);
					break;
				case 'game_data_update':
					setGameData(data.gameData);
					setRoundData(data.roundData);
					setPhaseData(data.phaseData);
					setRoundIndex(data.roundIndex);
					setPhaseIndex(data.phaseIndex);
					break;
				case 'score_data_update':
					setRoundScoreData(data.roundScoreData);
					console.log('SCORE DATA GAMEPAGE: ' + JSON.stringify(data.roundScoreData));
					break;
				case 'users_finished':
					setUsersFinished(data.usersFinished);
					console.log('USERS FINISHED: ' + data.usersFinished);
					break;
				case 'game_end':
					setCurrentPhase('');
					setGameEnded(true);
					setGameStarted(false);
					setGamePhaseTimer(0);
					setUsersFinished([]);
					console.log('GAME ENDED');
					break;
			}
		});

		return () => {
			socket.off('users_loaded_game_page');
			socket.off('game_start_countdown');
			socket.off('update_lobby');
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
					setPhaseData(currentPhaseData);
				} else {
					setPhaseData([]);
				}
			}
		}
	}, [roundIndex, phaseIndex, gameData]);

	useEffect(() => {
		// Triggered on phase update
		if (players.length > 0 && userToken) {
			// If the current phase is 'vote' or 'preview', set to the first player's userToken
			if (currentPhase === 'vote' || currentPhase === 'preview') {
				setCurrentUserDisplayed(players[0].userToken);
			} else {
				// Otherwise, set to the client's own userToken
				setCurrentUserDisplayed(userToken);
			}
		}
	}, [currentPhase, players, userToken]);

	useEffect(() => {
		if (roundData) {
			const videoAssignment = roundData.videoAssignments?.find(
				(assignment) => assignment.userToken === currentUserDisplayed
			);
			if (videoAssignment) {
				setCurrentVideoDisplayed(videoAssignment?.video || '');
			}
		}
	}, [roundIndex, roundData, currentUserDisplayed]);

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

			{/* {usersLoadedGamePage.length === players.length || gameStarted ? (
				gameStartCountdown > 0 && (
					<div
						className={`absolute top-0 bg-dark/80 z-50 w-full h-full flex justify-center items-center`}>
						<div
							className={`w-fit h-fit flex justify-center p-12 bg-green-300 outline outline-6 outline-dark rounded-full`}>
							<div className={`flex flex-col items-center justify-center `}>
								<h1
									data-text='GAME STARTS IN...'
									className={`font-sunny text-3xl text-dark`}>
									GAME STARTS IN...
								</h1>
								<h1
									data-text={`${gameStartCountdown}`}
									id='startTimer'
									className={` translate-y-4 text-9xl font-manga z-20 ${
										gameStartCountdown >= 4
											? 'text-white'
											: gameStartCountdown <= 3 && gameStartCountdown >= 2
											? 'text-yellow-300'
											: 'text-red-300'
									}`}>
									{gameStartCountdown || 'GO!'}
								</h1>
							</div>
						</div>
					</div>
				)
			) : (
				<div
					className={`absolute top-0 bg-dark/80 z-50 w-full h-full flex justify-center items-center`}>
					<div
						className={`w-fit h-fit flex justify-center p-12 bg-green-300 aspect-square max-w-[400px] outline outline-6 outline-dark rounded-full`}>
						<div className={`flex flex-col items-center justify-center `}>
							<h1
								data-text='GAME STARTS IN...'
								className={`font-sunny text-3xl text-dark`}>
								WAITING FOR {usersLoadedGamePage?.length || 0} / {players?.length || 0} PLAYERS TO
								LOAD PAGE
							</h1>
						</div>
					</div>
				</div>
			)} */}

			{(!usersLoadedGamePage.length === players.length || (!gameStarted && !gameEnded)) &&
				(players.length > 0 ? (
					<ActionAlertModal
						header={`WAITING FOR ${players.length - usersLoadedGamePage.length}`}
						subtext={`MORE TO LOAD PAGE`}
						Icon={FaHourglassStart}
						bgColorClass={`bg-yellow-300`}
					/>
				) : (
					<ActionAlertModal
						header={`GAME NOT FOUND`}
						subtext={`RETURN HOME`}
						Icon={BiSolidTrafficCone}
						bgColorClass={`bg-red-300`}
						onClick={() => {
							router.push('/');
						}}
					/>
				))}

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
							data-text={`ROUND ${roundIndex + 1}`}
							className='font-sunny text-2xl select-none'>
							ROUND {roundIndex + 1}
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
								data-text={`ROUND ${roundIndex + 1}`}
								className='font-sunny text-nowrap text-4xl md:text-5xl xxl:text-6xl'>
								ROUND {roundIndex + 1}
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
					{players && roundData && (
						<>
							{currentPhase === 'prompt' && (
								<PromptComponent
									lobbyId={lobbyId}
									players={players}
									gameData={gameData}
									roundData={roundData}
									phaseData={phaseData}
									setGameData={setGameData}
									gamePhaseTimer={gamePhaseTimer}
									setTimeLeftAtSubmit={setTimeLeftAtSubmit}
								/>
							)}

							{currentPhase === 'caption' && (
								<CaptionComponent
									players={players}
									roundIndex={roundIndex}
									phaseIndex={phaseIndex}
									gameData={gameData}
									roundData={roundData}
									phaseData={phaseData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									gamePhaseTimer={gamePhaseTimer}
									setTimeLeftAtSubmit={setTimeLeftAtSubmit}
									currentVideoDisplayed={currentVideoDisplayed}
									currentUserDisplayed={currentUserDisplayed}
									setCurrentVideoDisplayed={setCurrentVideoDisplayed}
								/>
							)}

							{currentPhase === 'preview' && (
								<PreviewComponent
									lobbyId={lobbyId}
									players={players}
									roundData={roundData}
									currentUserDisplayed={currentUserDisplayed}
									currentVideoDisplayed={currentVideoDisplayed}
									setCurrentUserDisplayed={setCurrentUserDisplayed}
									setCurrentVideoDisplayed={setCurrentVideoDisplayed}
									seenVideos={seenVideos}
									setSeenVideos={setSeenVideos}
									gamePhaseTimer={gamePhaseTimer}
									usersFinished={usersFinished}
								/>
							)}

							{currentPhase === 'vote' && (
								<VotingComponent
									players={players}
									roundIndex={roundIndex}
									phaseIndex={phaseIndex}
									gameData={gameData}
									roundData={roundData}
									phaseData={phaseData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									currentUserDisplayed={currentUserDisplayed}
									currentVideoDisplayed={currentVideoDisplayed}
									setCurrentVideoDisplayed={setCurrentVideoDisplayed}
									gamePhaseTimer={gamePhaseTimer}
									setTimeLeftAtSubmit={setTimeLeftAtSubmit}
									vote={vote}
									setVote={setVote}
								/>
							)}

							{currentPhase === 'intro' && (
								<IntroComponent
									roundIndex={roundIndex}
									phaseIndex={phaseIndex}
									roundData={roundData}
									phaseData={phaseData}
									gameData={gameData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									usersFinished={usersFinished}
									roundMultiplier={roundMultiplier}
								/>
							)}

							{currentPhase === 'transition' && (
								<TransitionComponent
									players={players}
									roundData={roundData}
									phaseData={phaseData}
									gameData={gameData}
									currentPhase={currentPhase}
									setGameData={setGameData}
									lobbyId={lobbyId}
									usersFinished={usersFinished}
									phaseIndex={phaseIndex}
									gamePhaseTimer={gamePhaseTimer}
									timeLeftAtSubmit={timeLeftAtSubmit}
								/>
							)}

							{currentPhase === 'outro' && (
								<OutroComponent
									players={players}
									roundData={roundData}
									phaseData={phaseData}
									gameData={gameData}
									roundScoreData={roundScoreData}
									setGameData={setGameData}
									lobbyId={lobbyId}
									usersFinished={usersFinished}
									phaseIndex={phaseIndex}
									roundIndex={roundIndex}
									roundMultiplier={roundMultiplier}
								/>
							)}
						</>
					)}

					{gameEnded && (
						<GameResultsComponent
							hostUserToken={hostUserToken}
							players={players}
							roundData={roundData}
							phaseData={phaseData}
							gameData={gameData}
							phaseIndex={phaseIndex}
							roundIndex={roundIndex}
							lobbyId={lobbyId}
						/>
					)}

					<PlayersScrollbar
						players={players}
						hostUserToken={hostUserToken}
						gameEnded={gameEnded}
						currentPhase={currentPhase}
						gameData={gameData}
						roundData={roundData}
						currentUserDisplayed={currentUserDisplayed}
						setCurrentUserDisplayed={setCurrentUserDisplayed}
						usersFinished={usersFinished || []}
						phaseData={phaseData}
						vote={vote}
						seenVideos={seenVideos}
					/>
				</div>
			</div>
		</div>
	);
}
