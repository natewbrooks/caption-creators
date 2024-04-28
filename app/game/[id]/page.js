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
import GamePlayersScollbar from '@/app/components/game/modules/GamePlayersScrollbar';

export default function GamePage() {
	const { id: lobbyId } = useParams();
	const [players, setPlayers] = useState([]);
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);
	const userToken = getUserToken();
	const [disconnectingUsers, setDisconnectingUsers] = useState({});
	const scrollContainerRef = useRef(null);
	const [touchStartX, setTouchStartX] = useState(0);
	const [touchMoveX, setTouchMoveX] = useState(0);

	const [currentRound, setCurrentRound] = useState(1);
	const [roundData, setRoundData] = useState({});
	const [gameRoundTimer, setGameRoundTimer] = useState(120);
	const [roundPhase, setRoundPhase] = useState('keyword-prompt');

	const [currentVoteUser, setCurrentVoteUser] = useState(players[1]?.userToken || null);
	const [captionedThisRound, setCaptionedThisRound] = useState(false);
	const timerRef = useRef(null);

	// Temp round timer
	useEffect(() => {
		timerRef.current = setInterval(() => {
			setGameRoundTimer((prevTimer) => {
				if (prevTimer <= 1) {
					return 120;
				}
				return prevTimer - 1;
			});
		}, 1000);

		return () => {
			clearInterval(timerRef.current);
		};
	}, []);

	const handleComponentDisplay = (key) => {
		switch (key) {
			case 'keyword-prompt':
				setRoundPhase(key);
				break;
			case 'caption-video':
				setRoundPhase(key);
				break;
			case 'voting':
				setRoundPhase(key);
				break;
			default:
				break;
		}
	};

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
			email: player.email,
			caption: '',
			voted: false,
		}));
		return newRoundData;
	}

	const handleWheel = (e) => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollLeft -= e.deltaY;
			e.preventDefault(); // Prevent the default vertical scroll
		}
	};

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener('wheel', handleWheel);
			container.addEventListener('touchstart', handleTouchStart, { passive: true });
			container.addEventListener('touchmove', handleTouchMove, { passive: false });
			container.addEventListener('touchend', handleTouchEnd, { passive: true });
		}
		return () => {
			if (container) {
				container.removeEventListener('wheel', handleWheel);
				container.removeEventListener('touchstart', handleTouchStart);
				container.removeEventListener('touchmove', handleTouchMove);
				container.removeEventListener('touchend', handleTouchEnd);
			}
		};
	}, [touchMoveX]);

	const handleTouchStart = (e) => {
		setTouchStartX(e.touches[0].clientX);
		setTouchMoveX(0); // Reset move distance on new touch
	};

	const handleTouchMove = (e) => {
		const touchX = e.touches[0].clientX;
		const moveX = touchStartX - touchX;
		setTouchMoveX(moveX);
	};

	const handleTouchEnd = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollLeft += touchMoveX;
		}
	};

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
					<BackButton
						goHome={true}
						text={'EXIT GAME'}
					/>

					<div className={`w-fit flex sm:flex-col`}>
						<div className={`flex w-fit text-nowrap justify-center space-x-2`}>
							<h1
								data-text={`${lobbyId} ROUND ${currentRound}`}
								className='font-sunny text-2xl select-none'>
								<span className={`text-yellow-300 text-[1.4rem] font-manga`}>{lobbyId}</span>
								{` `}
								ROUND {currentRound}
							</h1>
						</div>
						<div className='flex w-full justify-end items-center'>
							<div className={`w-fit p-1 mr-1 rounded-full bg-dark -translate-y-[0.15rem]`}>
								<FaClock
									size={14}
									className='text-white'
								/>
							</div>
							<h1
								data-text={gameRoundTimer + 's'}
								className={`min-w-[3ch] items-end flex text-right ${
									gameRoundTimer < 30
										? gameRoundTimer < 10
											? 'text-red-300'
											: 'text-yellow-300'
										: 'text-white'
								} text-[1.35rem] font-manga`}>
								{gameRoundTimer}s
							</h1>
						</div>
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
									className='text-yellow-300'
								/>
							</div>
							<h1
								data-text={gameRoundTimer + 's'}
								className={`min-w-[3ch] items-end flex text-right ${
									gameRoundTimer < 10 ? 'text-red-300' : 'text-yellow-300'
								} text-2xl md:text-3xl font-manga`}>
								{gameRoundTimer}s
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
					{players && roundData && (
						<>
							{roundPhase === 'keyword-prompt' && (
								<KeywordPromptComponent
									players={players}
									currentRound={currentRound}
									roundData={roundData}
									setRoundData={setRoundData}
									lobbyId={lobbyId}
									userToken={userToken}
								/>
							)}

							{roundPhase === 'caption-video' && (
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

							{roundPhase === 'voting' && (
								<>
									{() => {
										setCurrentVoteUser(players[0].userToken);
									}}
									<VotingComponent
										players={players}
										currentRound={currentRound}
										roundData={roundData}
										setRoundData={setRoundData}
										lobbyId={lobbyId}
										currentVoteUser={currentVoteUser}
										userToken={userToken}
									/>
								</>
							)}
						</>
					)}

					<GamePlayersScollbar
						players={players}
						roundData={roundData}
						currentRound={currentRound}
						scrollContainerRef={scrollContainerRef}
						handleComponentDisplay={handleComponentDisplay}
						currentVoteUser={currentVoteUser}
						setCurrentVoteUser={setCurrentVoteUser}
						isVotingPhase={roundPhase === 'voting'}
					/>
				</div>
			</div>
		</div>
	);
}
