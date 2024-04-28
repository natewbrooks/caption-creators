import React from 'react';
import Image from 'next/image';
import { FaUserCircle, FaCheck } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { TiArrowSortedDown } from 'react-icons/ti';

const GamePlayersScrollbar = ({
	players,
	roundData,
	currentRound,
	currentVoteUser,
	setCurrentVoteUser,
	scrollContainerRef,
	isVotingPhase,
	handleComponentDisplay,
}) => {
	const [activeElementPosition, setActiveElementPosition] = useState(0);
	const [animateArrow, setAnimateArrow] = useState(false);

	const updateIndicatorPosition = () => {
		const activeElement = document.getElementById(`player-${currentVoteUser}`);

		if (activeElement && scrollContainerRef.current) {
			const containerRect = scrollContainerRef.current.getBoundingClientRect();
			const elementRect = activeElement.getBoundingClientRect();

			const newPosition = elementRect.left + elementRect.width / 2 - containerRect.left;
			setActiveElementPosition(newPosition);

			console.log('New arrow position:', newPosition);
		}
	};

	useEffect(() => {
		const handleResize = () => updateIndicatorPosition();
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, [currentVoteUser, isVotingPhase, players]);

	useEffect(() => {
		if (isVotingPhase && currentVoteUser) {
			setAnimateArrow(true);
			scrollToActiveUser();
		}
	}, [currentVoteUser, isVotingPhase]);

	// Make the scrollTo function center the element
	const scrollToActiveUser = () => {
		const activeElement = document.getElementById(`player-${currentVoteUser}`);
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

	return (
		<div className={`relative flex flex-col justify-center items-center h-fit w-full `}>
			{/* Arrow pointing to the active element */}
			{isVotingPhase && (
				<div
					className={`absolute -top-0 z-20 ${
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
				className='flex bg-dark outline outline-2 outline-darkAccent max-w-[600px] rounded-t-md overflow-x-auto overflow-y-hidden whitespace-nowrap mt-4 justify-start w-full h-fit font-manga text-xl'
				onScroll={updateIndicatorPosition}>
				{players.map((player, index) => (
					<div
						key={player.userToken}
						id={`player-${player.userToken}`}
						className={`${
							index % 2 === 0 ? 'bg-dark' : 'bg-darkAccent'
						} transition-all duration-300 ease-in-out transform inline-flex flex-none flex-col justify-center items-center pt-2 px-8 `}
						onClick={() => {
							setCurrentVoteUser(player.userToken);
							updateIndicatorPosition();
						}}>
						<div className={`flex flex-col items-center `}>
							{player.avatar ? (
								<div className={`relative`}>
									<Image
										src={player.avatar}
										className={`border-2 rounded-full transition-all ease-in-out delay-100 duration-500 ${
											currentVoteUser === player.userToken && isVotingPhase
												? 'border-yellow-300'
												: 'border-dark'
										} ${
											roundData[currentRound]?.some(
												(p) => p.userToken === player.userToken && p.caption !== ''
											)
												? 'opacity-40 outline-green-300'
												: 'opacity-100'
										}`}
										alt={`Selected Avatar ${index + 1}`}
										width={48}
										height={48}
										unoptimized
									/>
								</div>
							) : (
								<FaUserCircle
									size={48}
									className={` ${
										index % 2 === 0 ? 'text-darkAccent border-darkAccent' : 'text-dark border-dark'
									} ${
										currentVoteUser === player.userToken && isVotingPhase
											? 'border-yellow-300'
											: ' '
									} border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
								/>
							)}
							<h1 className='font-manga text-2xl'>{player.name}</h1>
						</div>
					</div>
				))}
			</div>

			<div className={`lg:max-w-[50%] p-2 flex w-full justify-evenly`}>
				<div
					onClick={() => handleComponentDisplay('keyword-prompt')}
					className={`font-sunny text-2xl bg-blue-300 px-2 text-dark`}>
					PROMPT
				</div>
				<div
					onClick={() => handleComponentDisplay('caption-video')}
					className={`font-sunny text-2xl bg-green-300 px-2 text-dark`}>
					CAPTION
				</div>
				<div
					onClick={() => handleComponentDisplay('voting')}
					className={`font-sunny text-2xl bg-red-300 px-2 text-dark`}>
					VOTING
				</div>
			</div>
		</div>
	);
};

export default GamePlayersScrollbar;
