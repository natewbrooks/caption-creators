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
}) => {
	const [totalVotes, setTotalVotes] = useState(5); // Total votes allowed for clients
	const [votesUsed, setVotesUsed] = useState(0); // Current client's number of votes used
	const [LinkedCaptionPhaseData, setLinkedCaptionPhaseData] = useState(null);
	const [caption, setCaption] = useState('');
	const [vote, setVote] = useState({});
	const voteRef = useRef(vote); // Create a ref to track the latest vote state

	const { socket, userToken } = useSocket();

	useEffect(() => {
		const initialVotes = {};
		players.forEach((player) => {
			initialVotes[player.userToken] = 0;
		});
		setVote(initialVotes);
		voteRef.current = initialVotes;
	}, []);

	useEffect(() => {
		handleSubmit();
	}, [vote]);

	const addVote = () => {
		if (votesUsed < totalVotes && currentUserDisplayed) {
			setVote((prevVotes) => {
				const updatedVotes = {
					...prevVotes,
					[currentUserDisplayed]: (prevVotes[currentUserDisplayed] || 0) + 1,
				};
				voteRef.current = updatedVotes;
				return updatedVotes;
			});
			setVotesUsed(votesUsed + 1);
		}
	};

	const subtractVote = () => {
		if (votesUsed > 0 && currentUserDisplayed && vote[currentUserDisplayed] > 0) {
			setVote((prevVotes) => {
				const updatedVotes = {
					...prevVotes,
					[currentUserDisplayed]: prevVotes[currentUserDisplayed] - 1,
				};
				voteRef.current = updatedVotes;
				return updatedVotes;
			});
			setVotesUsed(votesUsed - 1);
		}
	};

	const handleSubmit = () => {
		const currentVotes = voteRef.current;
		if (!currentVotes) {
			return;
		}
		socket.emit('game_action', {
			lobbyId: lobbyId,
			userToken: userToken,
			isFinished: votesUsed === totalVotes,
			key: 'vote',
			data: { vote: currentVotes },
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

				<VideoEmbed embedURL={currentVideoDisplayed} />
				<div className='flex w-full leading-none  p-3 h-fit  overflow-y-hidden  px-3 md:px-2 md:justify-center bg-darkAccent  border-x-2 border-t-2 border-dark font-manga text-xl md:text-2xl xxl:text-3xl whitespace-nowrap overflow-x-auto'>
					{caption}
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
