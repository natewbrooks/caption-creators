import React from 'react';
import Image from 'next/image';
import { FaUserCircle, FaCheck, FaEye } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { TiArrowSortedDown } from 'react-icons/ti';
import { useSocket } from '@/app/contexts/SocketContext';

export default function PlayersScrollbar({
	players,
	hostUserToken,
	gameEnded,
	gameData,
	roundData,
	currentRound,
	currentPhase,
	currentUserDisplayed,
	setCurrentUserDisplayed,
	usersFinished,
	phaseData,
	seenVideos,
	vote,
}) {
	const scrollContainerRef = useRef(null); // Used in the PlayersScrollbar at the bottom
	const [activeElementPosition, setActiveElementPosition] = useState(0);
	const [animateArrow, setAnimateArrow] = useState(false);
	const { userToken } = useSocket();

	const [touchStartX, setTouchStartX] = useState(0); // Used to improve scroll functionality in PlayersScrollbar
	const [touchMoveX, setTouchMoveX] = useState(0); // Used to improve scroll functionality in PlayersScrollbar

	const updateIndicatorPosition = () => {
		const activeElement = document.getElementById(`player-${currentUserDisplayed}`);

		if (activeElement && scrollContainerRef.current) {
			const containerRect = scrollContainerRef.current.getBoundingClientRect();
			const elementRect = activeElement.getBoundingClientRect();

			const newPosition = elementRect.left + elementRect.width / 2 - containerRect.left;
			setActiveElementPosition(newPosition);
		}
	};

	useEffect(() => {
		const handleResize = () => updateIndicatorPosition();
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, [currentUserDisplayed, players]);

	useEffect(() => {
		if ((currentPhase === 'preview' || currentPhase === 'vote') && currentUserDisplayed) {
			setAnimateArrow(true);
			scrollToActiveUser();
		}
	}, [currentUserDisplayed, currentPhase]);

	// Make the scrollTo function center the element
	// const scrollToActiveUser = () => {
	// 	const activeElement = document.getElementById(`player-${currentUserDisplayed}`);
	// 	if (activeElement && scrollContainerRef.current) {
	// 		scrollContainerRef.current.scrollTo({
	// 			left:
	// 				activeElement.offsetLeft -
	// 				scrollContainerRef.current.offsetLeft -
	// 				scrollContainerRef.current.clientWidth / 2 +
	// 				activeElement.clientWidth / 2,
	// 			behavior: 'smooth',
	// 		});
	// 		updateIndicatorPosition();
	// 	}
	// };

	const scrollToActiveUser = () => {
		const activeElement = document.getElementById(`player-${currentUserDisplayed}`);
		if (activeElement && scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				left:
					activeElement.offsetLeft -
					scrollContainerRef.current.offsetLeft -
					scrollContainerRef.current.clientWidth / 2 +
					activeElement.clientWidth / 2,
				behavior: 'smooth', // Smooth scrolling
			});
			updateIndicatorPosition();
		}
	};

	const handleWheel = (e) => {
		if (scrollContainerRef.current) {
			const scrollAmount = e.deltaY * 0.3; // Multiplier for sensitivity
			scrollContainerRef.current.scrollLeft -= scrollAmount;
			e.preventDefault(); // Prevent vertical scrolling
		}
	};

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener('wheel', handleWheel);
			container.addEventListener('touchstart', handleTouchStart, { passive: true });
		}
		return () => {
			if (container) {
				container.removeEventListener('wheel', handleWheel);
				container.removeEventListener('touchstart', handleTouchStart);
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

		// Add smoothing by gradually applying the move
		const scrollAmount = moveX * 0.3; // Multiplier for sensitivity
		setTouchMoveX(scrollAmount);
	};

	const handleTouchEnd = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollLeft += touchMoveX;
		}
		// Reset touch values
		setTouchStartX(0);
		setTouchMoveX(0);
	};

	const shouldShowCheckmark = (playerUserToken) => {
		// Check if the player has finished
		const playerHasFinished = usersFinished.includes(playerUserToken);
		// Check if the client has finished
		const clientHasFinished = usersFinished.includes(userToken);

		// Conditions for showing the checkmark
		if (playerHasFinished && currentPhase !== 'preview') {
			return true;
		}
		if (playerHasFinished && currentPhase === 'preview' && clientHasFinished) {
			return true;
		}
		return false;
	};

	const shouldShowEye = (playerUserToken) => {
		const videoAssignment = roundData.videoAssignments?.find(
			(assignment) => assignment.userToken === playerUserToken
		);
		const clientHasFinished = usersFinished.includes(userToken);

		return (
			currentPhase === 'preview' && seenVideos.has(videoAssignment?.video) && !clientHasFinished
		);
	};

	return (
		<div className={`relative flex flex-col justify-center items-center h-fit w-full mt-1 z-20`}>
			{/* Arrow pointing to the active element */}
			{(currentPhase === 'vote' || currentPhase === 'preview') && (
				<div
					className={`absolute -top-2 z-20 ${
						animateArrow ? 'transition-all duration-[400ms] ease-in-out transform' : ''
					} `}
					onTransitionEnd={() => {
						setAnimateArrow(false);
					}}
					style={{ left: `${activeElementPosition}px`, transform: 'translateX(-50%)' }}>
					<div className={`w-fit h-full flex items-center justify-center flex-col`}>
						<TiArrowSortedDown
							size={32}
							className={`text-yellow-300`}
						/>
					</div>
				</div>
			)}

			<div
				ref={scrollContainerRef}
				className='flex bg-dark outline outline-2 outline-darkAccent max-w-[600px] rounded-t-md overflow-x-auto overflow-y-hidden whitespace-nowrap mt-2 justify-start w-full h-fit font-manga text-xl'
				onScroll={updateIndicatorPosition}>
				{players.map((player, index) => {
					const isMe = player.userToken === userToken;
					const isHost = hostUserToken === player.userToken;
					const hasFinished = usersFinished.find((userToken) => userToken === player.userToken);
					const votesFor = vote.get(player.userToken);

					const videoAssignment = roundData.videoAssignments?.find(
						(assignment) => assignment.userToken === player.userToken
					);
					const hasClientSeenPlayersVideo =
						seenVideos.has(videoAssignment?.video) && currentPhase === 'preview';
					const isClientFinished = usersFinished.find((player) => player.userToken === userToken);

					return (
						<div
							key={player.userToken}
							id={`player-${player.userToken}`}
							className={`${index % 2 === 0 ? 'bg-dark' : 'bg-darkAccent'} ${
								currentUserDisplayed === player.userToken
									? 'border-yellow-300/40 border-opacity-20 rounded-t-md rounded-x-md border-2'
									: ''
							}  transition-colors duration-300 ease-in-out transform inline-flex flex-none flex-col justify-center items-center pt-2 px-6 md:px-8`}
							onClick={() => {
								if (currentPhase === 'vote' || (currentPhase === 'preview' && isClientFinished)) {
									setCurrentUserDisplayed(player.userToken);
									updateIndicatorPosition();
								}
							}}>
							<div className={`flex flex-col items-center `}>
								{player.avatar ? (
									<div className={`relative`}>
										<Image
											src={player.avatar}
											className={`outline outline-2 rounded-full transition-all ease-in-out delay-100 duration-500 ${
												currentPhase === 'vote' ? 'cursor-pointer' : `cursor-default`
											}  ${
												currentUserDisplayed === player.userToken &&
												(currentPhase === 'vote' || currentPhase === 'preview')
													? 'outline-yellow-300'
													: ``
											} ${
												shouldShowCheckmark(player.userToken)
													? 'opacity-40 outline-green-300 border-green-300'
													: hasClientSeenPlayersVideo
													? 'opacity-40'
													: 'opacity-100'
											}`}
											alt={`Selected Avatar ${index + 1}`}
											width={48}
											height={48}
										/>
										{shouldShowEye(player.userToken) && (
											<div
												className={`absolute top-[0.65rem] right-[.65rem] bg-dark outline-2 outline  p-1 rounded-full`}>
												<FaEye
													size={18}
													className={`${
														index % 2 === 0
															? 'text-white outline-dark'
															: 'text-white outline-darkAccent'
													}`}
												/>
											</div>
										)}
										{shouldShowCheckmark(player.userToken) && (
											<FaCheck
												size={18}
												className={`absolute top-4 right-4 text-green-300`}
											/>
										)}
									</div>
								) : (
									<div className={`relative`}>
										<FaUserCircle
											size={48}
											className={`${
												index % 2 === 0
													? 'text-darkAccent border-darkAccent'
													: 'text-dark border-dark'
											}  ${
												currentUserDisplayed === player.userToken &&
												(currentPhase === 'vote' || currentPhase === 'preview')
													? 'border-yellow-300'
													: ' '
											} ${
												shouldShowCheckmark(player.userToken)
													? 'opacity-40 outline-green-300 border-green-300'
													: 'opacity-100'
											}  ${
												hasClientSeenPlayersVideo && 'opacity-40'
											}   border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
										/>
										{shouldShowEye(player.userToken) && (
											<div
												className={`absolute top-3 right-3 bg-dark outline-2 outline  p-1 rounded-full`}>
												<FaEye
													size={18}
													className={`${
														index % 2 === 0
															? 'text-white outline-dark'
															: 'text-white outline-darkAccent'
													}`}
												/>
											</div>
										)}
										{shouldShowCheckmark(player.userToken) && (
											<FaCheck
												size={18}
												className={`absolute top-4 right-4 text-green-300`}
											/>
										)}
									</div>
								)}
								<h1 className='font-manga text-xl md:text-2xl'>{player.name}</h1>
								{isMe && (
									<h1 className='absolute -top-[2px] z-50 left-[4px] font-manga text-yellow-300 text-xs sm:text-lg'>
										YOU
									</h1>
								)}
								{isHost && !isMe && gameEnded && (
									<h1 className='absolute -top-[2px] z-50 left-[4px] font-manga text-green-300 text-xs sm:text-lg'>
										HOST
									</h1>
								)}

								{currentPhase === 'vote' && (
									<h1 className='absolute -top-[2px] z-50 right-[4px] font-manga text-lg'>
										x{votesFor}
									</h1>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* <div className={`lg:max-w-[50%] p-2 flex w-full justify-evenly`}>
				<div
					onClick={() => handleComponentDisplay('prompt')}
					className={`font-sunny text-2xl bg-blue-300 px-2 text-dark`}>
					PROMPT
				</div>
				<div
					onClick={() => handleComponentDisplay('video')}
					className={`font-sunny text-2xl bg-green-300 px-2 text-dark`}>
					CAPTION
				</div>
				<div
					onClick={() => handleComponentDisplay('vote')}
					className={`font-sunny text-2xl bg-red-300 px-2 text-dark`}>
					VOTING
				</div>
			</div> */}
		</div>
	);
}
