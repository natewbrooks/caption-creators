'use client';
import { getSocket, getUserToken } from '@/server/socketManager';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TopBar from '@/app/components/login/topBar';
import Image from 'next/image';
import { FaUserCircle, FaCheck } from 'react-icons/fa';
import CaptionVideoComponent from '../../components/game/CaptionVideoComponent';
import PromptForKeywordComponent from '@/app/components/game/PromptForKeywordComponent';

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
	const [captionedThisRound, setCaptionedThisRound] = useState(false);

	// display round components
	const [showKeywordPrompt, setShowKeywordPrompt] = useState(true);
	const [showCaptionVideo, setShowCaptionVideo] = useState(false);
	const [showVoting, setShowVoting] = useState(false);

	const handleComponentDisplay = (key) => {
		switch (key) {
			case 'keyword-prompt':
				setShowKeywordPrompt(true);
				setShowCaptionVideo(false);
				setShowVoting(false);
				break;
			case 'caption-video':
				setShowKeywordPrompt(false);
				setShowCaptionVideo(true);
				setShowVoting(false);
				break;
			case 'voting':
				setShowKeywordPrompt(false);
				setShowCaptionVideo(false);
				setShowVoting(true);
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
			<TopBar
				userOnClickEnabled={false}
				backButtonGoHome={true}
				showProfileIfNotLoggedIn={false}
			/>
			<div
				className={`flex flex-col w-full items-center h-full space-y-2 leading-none text-center`}>
				<div className={`flex flex-col w-fit xs:mb-4 lg:mb-8 justify-center items-center`}>
					<div className={`flex w-full justify-center space-x-2`}>
						<h1
							data-text={`Game ID -`}
							className='font-sunny xs:text-5xl 2xxl:text-8xl select-none'>
							Game ID -
						</h1>
						<h1
							data-text={`${lobbyId}`}
							className='xs:text-5xl 2xxl:text-8xl font-manga select-text text-yellow-300'>
							{lobbyId}
						</h1>
					</div>
					<div className={`flex w-full justify-center space-x-2`}>
						<h1
							data-text={`~ ROUND ${currentRound} ~`}
							className='font-manga text-2xl sm:text-3xl lg:text-4xl select-none'>
							<span className={`text-green-300`}>~</span> ROUND {currentRound}{' '}
							<span className={`text-green-300`}>~</span>
						</h1>
					</div>
				</div>

				<div className={`w-full h-full flex justify-center`}>
					{players && roundData && (
						<>
							{showCaptionVideo && (
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

							{showVoting && (
								// You can add the voting component here when you have it ready.
								<div>Voting Component Placeholder</div>
							)}

							{showKeywordPrompt && (
								<PromptForKeywordComponent
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
						</>
					)}
				</div>
			</div>

			<div
				ref={scrollContainerRef}
				className='flex bg-dark outline outline-2 outline-darkAccent rounded-t-md overflow-x-auto overflow-y-hidden whitespace-nowrap space-x-12 pb-2 pt-4 lg:pb-4 px-4 lg:pt-6 mt-4  justify-evenly w-full h-fit z-50 font-manga text-xl'>
				{players.map((player, index) => (
					<div
						key={player.userToken}
						className='inline-flex flex-none flex-col justify-center items-center mx-2'>
						<div className={`flex flex-col items-center`}>
							{player.avatar ? (
								<div className={`relative`}>
									<div className={`w-[32px] h-[32px] lg:w-[48px] lg:h-[48px]`}>
										<Image
											src={player.avatar}
											className={`outline-dark outline-2 outline rounded-full transition-all duration-300 ${
												roundData[currentRound]?.some(
													(p) => p.userToken === player.userToken && p.caption !== ''
												)
													? 'opacity-40 outline-green-300'
													: 'opacity-100'
											}`}
											alt={`Selected Avatar ${index + 1}`}
											type='responsive'
											width={100}
											height={100}
											unoptimized
										/>
									</div>
									{roundData[currentRound]?.find(
										(p) => p.userToken === player.userToken && p.caption
									) && (
										<div
											className={`absolute z-20 top-2 right-[0.4rem] lg:top-3 lg:right-[0.65rem] flex items-center space-x-1`}>
											<FaCheck className='w-[18px] h-[18px] lg:h-[24px] lg:w-[24px] text-green-300' />
										</div>
									)}
								</div>
							) : (
								<FaUserCircle
									size={48}
									className={`outline-dark outline-2 outline rounded-full`}
								/>
							)}
							<h1 className='font-manga text-2xl'>{player.name}</h1>
						</div>
					</div>
				))}
			</div>
			<div className={`p-2 flex w-full justify-evenly`}>
				<div
					onClick={() => handleComponentDisplay('keyword-prompt')}
					className={`font-sunny text-xl bg-blue-300 px-2 text-dark`}>
					PROMPT
				</div>
				<div
					onClick={() => handleComponentDisplay('caption-video')}
					className={`font-sunny text-xl bg-green-300 px-2 text-dark`}>
					CAPTION
				</div>
				<div
					onClick={() => handleComponentDisplay('voting')}
					className={`font-sunny text-xl bg-red-300 px-2 text-dark`}>
					VOTING (not rdy)
				</div>
			</div>
		</div>
	);
}
