import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const PreviewComponent = ({
	players,
	gameData,
	phaseData,
	roundData,
	setGameData,
	lobbyId,
	currentVideoDisplayed,
	setCurrentVideoDisplayed,
	currentUserDisplayed,
	setCurrentUserDisplayed,
	roundIndex,
	phaseIndex,
	gamePhaseTimer,
	setTimeLeftAtSubmit,
}) => {
	const { socket, userToken } = useSocket();
	// iterate through all players in the lobby one by one, setCurrentUserDisplayed to current iteration,
	// setCurrentVideoDisplayed to roundData.videoAssignments where assignment.userToken === currentUserDisplayed.userToken,
	// set the timeout interval of each video to the videoDuration in roundData.videoAssignments where userTokens match
	const [currentIndex, setCurrentIndex] = useState(0); // Keep track of the current index
	const [caption, setCaption] = useState('');
	const [hasWatchedAllVideos, setHasWatchedAllVideos] = useState(false);

	useEffect(() => {
		if (players.length === 0 || !roundData) return; // Exit if there are no players or no roundData

		// Find the video assigned to the current player
		const videoAssignment = roundData.videoAssignments.find(
			(assignment) => assignment.userToken === players[currentIndex].userToken
		);

		// Update the current video and user
		setCurrentUserDisplayed(players[currentIndex].userToken);
		if (videoAssignment) {
			setCurrentVideoDisplayed(videoAssignment.video);
		}

		// Update the caption based on the current user
		const captionPhaseData = roundData.phases.find((phase) => phase.key === 'caption');
		if (captionPhaseData) {
			const playerData = captionPhaseData.userData.find(
				(data) => data.userToken === players[currentIndex].userToken
			);
			if (playerData) {
				setCaption(playerData.results.caption);
			}
		}
	}, [currentIndex, players, roundData, hasWatchedAllVideos]);

	const handleVideoEnd = () => {
		//Switch to the next player on video end
		if (currentIndex + 1 < players.length) {
			setCurrentIndex((prevIndex) => prevIndex + 1); // Move to the next player
		} else {
			// SUBMISSION
			if (!hasWatchedAllVideos) {
				if (currentIndex === players.length) {
					socket.emit('game_action', {
						key: 'preview',
						userToken: userToken,
						isFinished: true,
					});
					setHasWatchedAllVideos(true);
				}
			}
		}
	};

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-between items-center `}>
				<div className={`flex flex-col sm:flex-row items-center w-full space-x-2 justify-center`}>
					<h1
						data-text={`PREVIEWING ${
							players
								.find((player) => player.userToken === currentUserDisplayed)
								?.name.toUpperCase() || 'NONE SELECTED'
						}'s CAPTION `}
						className={`text-xl md:text-2xl lg:text-3xl font-manga text-yellow-300 text-nowrap `}>
						PREVIEWING{' '}
						{players
							.find((player) => player.userToken === currentUserDisplayed)
							?.name.toUpperCase() || 'NONE SELECTED'}
						's CAPTION
					</h1>
				</div>

				<VideoEmbed
					url={currentVideoDisplayed}
					handleVideoEnd={handleVideoEnd}
				/>
				<div className='flex w-full leading-none  p-3 h-fit  overflow-y-hidden  px-3 md:px-2 md:justify-center bg-darkAccent  border-x-2 border-t-2 border-dark font-manga text-xl md:text-2xl xxl:text-3xl whitespace-nowrap overflow-x-auto'>
					{caption}
				</div>
			</div>
		</>
	);
};

export default PreviewComponent;
