import { useState, useEffect } from 'react';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const PreviewComponent = ({
	lobbyId,
	players,
	roundData,
	currentUserDisplayed,
	currentVideoDisplayed,
	setCurrentVideoDisplayed,
	setCurrentUserDisplayed,
	seenVideos,
	setSeenVideos,
	gamePhaseTimer,
	usersFinished,
}) => {
	const { socket, userToken } = useSocket();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [hasWatchedAllVideos, setHasWatchedAllVideos] = useState(false);

	useEffect(() => {
		if (players.length === 0 || !roundData || hasWatchedAllVideos) return;

		// Add the user's video assignment to seenVideos
		const videoAssignment = roundData.videoAssignments.find(
			(assignment) => assignment.userToken === userToken
		);
		if (videoAssignment) {
			console.log('VIDEO ASSIGNMENT LOOKED AT: ' + JSON.stringify(videoAssignment));
			if (videoAssignment.video) {
				setSeenVideos((prevSeenVideos) => new Set([...prevSeenVideos, videoAssignment.video]));
				console.log('SEEN VIDEOS: ' + JSON.stringify(seenVideos));
			} else {
				// If video is null then submit automatically
				handleSubmit();
			}
		}

		// Find the index of the first player with a unique unseen video assignment
		const firstUniqueVideoAssignmentIndex = roundData.videoAssignments.findIndex(
			(assignment) => !seenVideos.has(assignment.video)
		);

		if (firstUniqueVideoAssignmentIndex !== -1) {
			console.log(
				'FOUND UNIQUE VIDEO: ' +
					JSON.stringify(roundData.videoAssignments[firstUniqueVideoAssignmentIndex])
			);
			setCurrentIndex(firstUniqueVideoAssignmentIndex);
			setCurrentUserDisplayed(
				roundData.videoAssignments[firstUniqueVideoAssignmentIndex].userToken
			);
			// setCurrentVideoDisplayed(roundData.videoAssignments[firstUniqueVideoAssignmentIndex].video);
		}
	}, []);

	useEffect(() => {
		console.log('SEEN VIDEOS (UPDATE): ' + JSON.stringify(seenVideos));
		const uniqueVideosInRound = new Set(
			roundData.videoAssignments.map((assignment) => assignment.video)
		).size;

		if (seenVideos.size === uniqueVideosInRound) {
			handleSubmit();
		}
	}, [seenVideos]);

	useEffect(() => {
		if (players.length === 0 || !roundData || hasWatchedAllVideos) return;

		let nextIndex = currentIndex;

		const uniqueVideosInRound = new Set(
			roundData.videoAssignments.map((assignment) => assignment.video)
		).size;

		while (seenVideos.size < uniqueVideosInRound) {
			const nextPlayer = players[nextIndex];
			const videoAssignment = roundData.videoAssignments.find(
				(assignment) => assignment.userToken === nextPlayer?.userToken
			);

			if (videoAssignment && !seenVideos.has(videoAssignment.video)) {
				setCurrentIndex(nextIndex);
				setCurrentUserDisplayed(nextPlayer.userToken);
				setCurrentVideoDisplayed(videoAssignment.video);
				break;
			}

			nextIndex = (nextIndex + 1) % players.length; // Move to the next player in a circular manner
		}
	}, [currentIndex, players, roundData, seenVideos]);

	const handleVideoEnd = () => {
		// Update the seen videos and proceed to the next video
		setSeenVideos((prevSeenVideos) => new Set([...prevSeenVideos, currentVideoDisplayed]));
		console.log('VIDEO ENDED + seen videos: ' + seenVideos);

		const uniqueVideosInRound = new Set(
			roundData.videoAssignments.map((assignment) => assignment.video)
		).size;

		if (seenVideos.size === uniqueVideosInRound) {
			// If all unique videos have been seen, emit game_action event
			console.log('SUBMIT');
			handleSubmit();
		} else {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % players.length);
		}
	};

	const handleSubmit = () => {
		socket.emit('game_action', {
			lobbyId: lobbyId,
			key: 'preview',
			userToken: userToken,
			isFinished: true,
			data: {
				time: gamePhaseTimer,
			},
		});
		setHasWatchedAllVideos(true);
		setSeenVideos(new Set());
		setCurrentUserDisplayed(userToken); // Set shown user as client
	};

	return (
		<>
			<div className='relative flex flex-col w-full h-full justify-between items-center'>
				<div className='flex flex-col sm:flex-row items-center w-full space-x-2 justify-center'>
					<h1
						data-text={`PREVIEWING ${
							players
								.find((player) => player.userToken === currentUserDisplayed)
								?.name.toUpperCase() || 'NONE SELECTED'
						}'s VIDEO `}
						className='text-xl md:text-2xl lg:text-3xl font-manga text-yellow-300 text-nowrap'>
						PREVIEWING{' '}
						{players
							.find((player) => player.userToken === currentUserDisplayed)
							?.name.toUpperCase() || 'NONE SELECTED'}
						's VIDEO
					</h1>
				</div>

				<VideoEmbed
					url={currentVideoDisplayed}
					handleVideoEnd={handleVideoEnd}
				/>
				<div
					className={`${
						hasWatchedAllVideos ? '' : 'hidden'
					} flex flex-col w-full top-2 relative h-fit justify-center items-center`}>
					<h1
						data-text={`YOU'VE WATCHED ALL VIDEOS!`}
						className='text-xl md:text-2xl font-manga text-yellow-300 text-nowrap'>
						YOU'VE WATCHED ALL VIDEOS!
					</h1>
					<h1
						data-text={`WAITING FOR ${players.length - usersFinished.length} MORE TO START VOTE...`}
						className='text-xl md:text-2xl font-manga text-yellow-300 text-nowrap'>
						WAITING FOR {players.length - usersFinished.length} MORE TO START VOTE...
					</h1>
				</div>
			</div>
		</>
	);
};

export default PreviewComponent;
