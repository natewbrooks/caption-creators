import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from './modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const VotingComponent = ({
	players,
	currentRound,
	gameData,
	setGameData,
	lobbyId,
	currentVoteUser,
}) => {
	const [totalVotes, setTotalVotes] = useState(5); // Total votes allowed for clients
	const [votesUsed, setVotesUsed] = useState(0); // Current client's number of votes used
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
		if (votesUsed < totalVotes && currentVoteUser) {
			setVote((prevVotes) => {
				const updatedVotes = {
					...prevVotes,
					[currentVoteUser]: (prevVotes[currentVoteUser] || 0) + 1,
				};
				voteRef.current = updatedVotes;
				return updatedVotes;
			});
			setVotesUsed(votesUsed + 1);
		}
	};

	const subtractVote = () => {
		if (votesUsed > 0 && currentVoteUser && vote[currentVoteUser] > 0) {
			setVote((prevVotes) => {
				const updatedVotes = {
					...prevVotes,
					[currentVoteUser]: prevVotes[currentVoteUser] - 1,
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
			isFinished: false,
			key: 'vote',
			data: { vote: currentVotes },
		});
	};

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-between items-center `}>
				<div className={`flex flex-col sm:flex-row items-center w-full space-x-2 justify-center`}>
					<h1
						data-text={`${
							players.find((player) => player.userToken === currentVoteUser)?.name.toUpperCase() ||
							'NONE SELECTED'
						}'s CAPTION `}
						className={`text-xl md:text-2xl lg:text-3xl font-manga text-yellow-300 text-nowrap `}>
						{players.find((player) => player.userToken === currentVoteUser)?.name.toUpperCase() ||
							'NONE SELECTED'}
						's CAPTION
					</h1>
					<h1
						data-text={`•`}
						className={`hidden sm:flex text-xl md:text-2xl lg:text-3xl font-manga text-green-300 text-nowrap `}>
						•
					</h1>

					<h1
						data-text={`x${totalVotes - votesUsed} VOTES REMAINING`}
						className={`font-manga text-nowrap text-xl md:text-2xl lg:text-3xl`}>
						x{totalVotes - votesUsed} VOTES REMAINING
					</h1>
				</div>

				<VideoEmbed embedURL={'https://www.youtube.com/embed/x6iwZSURP44'} />
				<div className='w-full flex flex-col'>
					<div className='px-2 bg-dark  border-x-2 py-1 border-t-2 border-darkAccent font-manga text-xl md:text-2xl xxl:text-3xl whitespace-nowrap overflow-x-auto'>
						A silly little mongoose loves to eat his lil carrots!
					</div>
				</div>

				<div className={`w-full h-fit flex justify-center`}>
					<div
						className={`flex bg-dark border-darkAccent border-2 h-full w-full items-center justify-evenly`}>
						<div
							onClick={() => subtractVote()}
							className={`text-3xl xl:text-4xl bg-dark border-red-300 border-2 leading-none font-sunny rounded-r-md text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							-1
						</div>
						<div className={`flex flex-col w-full justify-center items-center py-2`}>
							<h1
								className={`text-xl md:text-2xl xxl:text-3xl font-manga text-white text-nowrap px-1 w-fit`}>
								x{vote[currentVoteUser] || 0} votes{' '}
							</h1>
						</div>
						<div
							onClick={() => addVote()}
							className={`text-3xl xl:text-4xl bg-dark border-green-300 border-2 leading-none font-sunny rounded-l-md text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							+1
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default VotingComponent;
