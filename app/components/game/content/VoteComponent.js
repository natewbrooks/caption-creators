import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const VotingComponent = ({
	players,
	gameData,
	phaseData,
	roundData,
	setGameData,
	lobbyId,
	currentVideoDisplayed,
	setCurrentVideoDisplayed,
	currentUserDisplayed,
	roundIndex,
	phaseIndex,
	gamePhaseTimer,
	setTimeLeftAtSubmit,
	vote,
	setVote,
}) => {
	const [totalVotes, setTotalVotes] = useState(5); // Total votes allowed for clients
	const [votesUsed, setVotesUsed] = useState(0); // Current client's number of votes used
	const [LinkedCaptionPhaseData, setLinkedCaptionPhaseData] = useState(null);
	const [caption, setCaption] = useState('');
	const voteRef = useRef(vote); // Create a ref to track the latest vote state

	const { socket, userToken } = useSocket();

	useEffect(() => {
		const initialVotes = new Map();
		players.forEach((player) => {
			initialVotes.set(player.userToken, 0);
		});
		setVote(initialVotes);
		voteRef.current = initialVotes;
	}, []);

	useEffect(() => {
		handleSubmit();

		if (totalVotes === votesUsed) {
			console.log('USER ' + userToken + ' SUBMITTED VOTE!! ' + Array.from(vote));
		}
	}, [vote]);

	const addVote = () => {
		if (votesUsed < totalVotes && currentUserDisplayed) {
			const updatedVote = new Map(vote);
			updatedVote.set(currentUserDisplayed, (updatedVote.get(currentUserDisplayed) || 0) + 1);
			console.log('ADDED VOTE, NEW TOTAL:' + updatedVote.get(currentUserDisplayed));
			setVote(updatedVote);
			setVotesUsed(votesUsed + 1);
		}
	};

	const subtractVote = () => {
		if (votesUsed > 0 && currentUserDisplayed && vote.get(currentUserDisplayed) > 0) {
			const updatedVote = new Map(vote);
			updatedVote.set(currentUserDisplayed, (updatedVote.get(currentUserDisplayed) || 0) - 1);
			console.log('SUBTRACTED VOTE, NEW TOTAL:' + updatedVote.get(currentUserDisplayed));
			setVote(updatedVote);
			setVotesUsed(votesUsed - 1);
		}
	};

	const handleSubmit = () => {
		const voteObject = {};
		for (let [key, value] of vote.entries()) {
			voteObject[key] = value;
		}

		console.log('VOTE @ SUBMIT: ' + Array.from(vote));
		socket.emit('game_action', {
			lobbyId: lobbyId,
			userToken: userToken,
			isFinished: votesUsed === totalVotes,
			key: 'vote',
			data: { vote: voteObject },
		});
		setTimeLeftAtSubmit(gamePhaseTimer);
		console.log('TIME LEFT: ' + gamePhaseTimer);
	};

	useEffect(() => {
		if (roundData) {
			const videoAssignment = roundData.videoAssignments.find(
				(assignment) => assignment.userToken === currentUserDisplayed
			);
			if (videoAssignment) {
				setCurrentVideoDisplayed(videoAssignment.video);
			}

			const captionPhaseData = roundData.phases.find((phase) => phase.key === 'caption');
			const playerData = captionPhaseData.userData.find(
				(data) => data.userToken === currentUserDisplayed
			);
			if (playerData) {
				setCaption(playerData.results.caption);
			}
		}
	}, [roundIndex, roundData, currentUserDisplayed]);

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-between items-center `}>
				<div className={`flex flex-col sm:flex-row items-center w-full space-x-2 justify-center`}>
					<h1
						data-text={`x${totalVotes - votesUsed} VOTES REMAIN`}
						className={`font-manga text-nowrap text-xl md:text-2xl lg:text-3xl`}>
						x{totalVotes - votesUsed} VOTES REMAIN
					</h1>
					<h1
						data-text={`•`}
						className={`hidden sm:flex text-xl md:text-2xl lg:text-3xl font-manga text-green-300 text-nowrap `}>
						•
					</h1>
					<h1
						data-text={`${
							players
								.find((player) => player.userToken === currentUserDisplayed)
								?.name.toUpperCase() || 'NONE SELECTED'
						}'s CAPTION `}
						className={`text-xl md:text-2xl lg:text-3xl font-manga text-yellow-300 text-nowrap `}>
						{players
							.find((player) => player.userToken === currentUserDisplayed)
							?.name.toUpperCase() || 'NONE SELECTED'}
						's CAPTION
					</h1>
				</div>

				<VideoEmbed url={currentVideoDisplayed} />
				<div
					className={`flex z-20 bg-dark border-2 border-darkAccent rounded-b-md p-1 h-fit w-full`}>
					<div className='border-2 border-dark focus:outline-none rounded-md font-manga text-white text-3xl text-center bg-darkAccent w-full p-2 md:p-3 placeholder:text-white/50'>
						{caption ?? 'NO CAPTION SUBMITTED'}
					</div>
				</div>

				<div className={`w-full h-fit flex justify-center`}>
					<div
						className={`flex p-1 space-x-1 bg-dark border-darkAccent border-2 h-full w-full items-center justify-evenly`}>
						<div
							onClick={() => subtractVote()}
							className={`text-3xl xl:text-4xl rounded-md bg-dark py-2 border-red-300 border-2 leading-none font-sunny text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							-1 VOTE
						</div>
						{/* <div className={`flex flex-col w-full justify-center items-center py-2`}>
							<h1
								className={`text-xl md:text-2xl xxl:text-3xl font-manga text-white text-nowrap px-1 w-fit`}>
								x{vote[currentUserDisplayed] || 0} votes{' '}
							</h1>
						</div> */}
						<div
							onClick={() => addVote()}
							className={`text-3xl xl:text-4xl py-2 rounded-md bg-dark border-green-300 border-2 leading-none font-sunny  text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							+1 VOTE
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default VotingComponent;
