import React from 'react';
import Image from 'next/image';
import { FaUserCircle, FaCheck } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { TiArrowSortedDown } from 'react-icons/ti';
import { useSocket } from '@/app/contexts/socketContext';

const GamePlayersScrollbar = ({
	players,
	gameData,
	currentRound,
	currentPhase,
	currentUserDisplayed,
	setCurrentUserDisplayed,
	handleComponentDisplay,
	usersFinished,
	phaseData,
}) => {
	const scrollContainerRef = useRef(null); // Used in the GamePlayersScrollbar at the bottom
	const [activeElementPosition, setActiveElementPosition] = useState(0);
	const [animateArrow, setAnimateArrow] = useState(false);
	const { userToken } = useSocket();

	const [touchStartX, setTouchStartX] = useState(0); // Used to improve scroll functionality in GamePlayersScrollbar
	const [touchMoveX, setTouchMoveX] = useState(0); // Used to improve scroll functionality in GamePlayersScrollbar

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
	}, [currentUserDisplayed, currentPhase === 'vote', players]);

	useEffect(() => {
		if (currentPhase !== 'preview' && currentPhase === 'vote' && currentUserDisplayed) {
			setAnimateArrow(true);
			scrollToActiveUser();
		}
	}, [currentUserDisplayed, currentPhase === 'vote']);

	// Make the scrollTo function center the element
	const scrollToActiveUser = () => {
		const activeElement = document.getElementById(`player-${currentUserDisplayed}`);
		if (activeElement && scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				left:
					activeElement.offsetLeft -
					scrollContainerRef.current.offsetLeft -
					scrollContainerRef.current.clientWidth / 2 +
					activeElement.clientWidth / 2,
				behavior: 'smooth',
			});
			updateIndicatorPosition();
		}
	};

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
		<div className={`relative flex flex-col justify-center items-center h-fit w-full `}>
			{/* Arrow pointing to the active element */}
			{currentPhase === 'vote' && (
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
					const hasFinished = usersFinished.find((userToken) => userToken === player.userToken);
					const votesFor =
						currentPhase === 'vote' && phaseData?.userData
							? phaseData.userData.find((user) => user.userToken === userToken)?.results?.vote?.[
									player.userToken
							  ] ?? 0
							: 0;

					return (
						<div
							key={player.userToken}
							id={`player-${player.userToken}`}
							className={`${
								index % 2 === 0 ? 'bg-dark' : 'bg-darkAccent'
							} transition-all duration-300 ease-in-out transform inline-flex flex-none flex-col justify-center items-center pt-2 px-6 md:px-8`}
							onClick={() => {
								if (currentPhase === 'vote') {
									setCurrentUserDisplayed(player.userToken);
									updateIndicatorPosition();
								}
							}}>
							<div className={`flex flex-col items-center`}>
								{player.avatar ? (
									<div className={`relative`}>
										<Image
											src={player.avatar}
											className={`border-2 rounded-full transition-all ease-in-out delay-100 duration-500 ${
												currentUserDisplayed === player.userToken && currentPhase === 'vote'
													? 'border-yellow-300'
													: 'border-dark'
											} ${
												hasFinished
													? 'opacity-40 outline-green-300 border-green-300'
													: 'opacity-100'
											}`}
											alt={`Selected Avatar ${index + 1}`}
											width={48}
											height={48}
											unoptimized
										/>
										{hasFinished && (
											<FaCheck
												size={18}
												className={`absolute top-4 right-4 text-green-300`}
											/>
										)}
									</div>
								) : (
									<FaUserCircle
										size={48}
										className={`${
											index % 2 === 0
												? 'text-darkAccent border-darkAccent'
												: 'text-dark border-dark'
										} ${
											currentUserDisplayed === player.userToken && currentPhase === 'vote'
												? 'border-yellow-300'
												: ' '
										}
                        border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
									/>
								)}
								<h1 className='font-manga text-xl md:text-2xl'>{player.name}</h1>
								{currentPhase === 'vote' && (
									<h1 className='absolute top-0 z-50 right-1 font-manga text-xl'>x{votesFor}</h1>
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
};

export default GamePlayersScrollbar;
