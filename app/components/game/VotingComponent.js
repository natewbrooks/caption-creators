import { getSocket } from '@/server/socketManager';
import { useState, useEffect } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from './modules/VideoEmbed';

const VotingComponent = ({
	players,
	currentRound,
	roundData,
	setRoundData,
	lobbyId,
	userToken,
	currentVoteUser,
}) => {
	const [currentVotes, setCurrentVotes] = useState({});

	/* 
    {
        [userToken1 (votedFor), quantityOfVotes],
        [userToken2 (votedFor), quantityOfVotes],
        [userToken3 (votedFor), quantityOfVotes],
        [userToken4 (votedFor), quantityOfVotes],
    }
    
    existence of an array means that the user DID voted

    */

	// useEffect(() => {
	// 	const socketInstance = getSocket();

	// 	socketInstance.on('notify_players', ({ event, data }) => {
	// 		if (!data || !data.userToken) return;
	// 		const wasMyAction = data.userToken === userToken;

	// 		setRoundData((prev) => {
	// 			const newRoundData = { ...prev };
	// 			const playerEntries = newRoundData[1] || [];

	// 			const playerIndex = playerEntries.findIndex((p) => p.userToken === data.userToken);
	// 			if (playerIndex !== -1) {
	// 				if (event === 'caption_submitted') {
	// 					playerEntries[playerIndex].caption = data.caption;
	// 					if (wasMyAction) setCaptionedThisRound(true);
	// 				}
	// 			}

	// 			return newRoundData;
	// 		});
	// 	});

	// 	socketInstance.on('round_change', (round) => {
	// 		setCaptionedThisRound(false);
	// 		setCurrentCaption('');
	// 	});

	// 	return () => {
	// 		socketInstance.off('notify_players');
	// 		socketInstance.off('round_change');
	// 	};
	// }, [lobbyId]);

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-between items-center `}>
				{/* <h1
					data-text={`VOTING FOR: ${
						players.find((player) => player.userToken === currentVoteUser)?.name || 'Not found'
					}`}
					className={`font-sunny text-nowrap text-4xl md:text-5xl xxl:text-6xl`}>
					VOTING FOR:{' '}
					<span className='text-yellow-300'>
						{players.find((player) => player.userToken === currentVoteUser)?.name || 'Not found'}
					</span>
				</h1> */}
				<h1
					data-text={`x5 VOTES REMAINING`}
					className={`font-manga text-nowrap text-2xl md:text-3xl`}>
					<span className={`text-green-300`}>x5</span> VOTES REMAINING
				</h1>

				<VideoEmbed embedURL={'https://www.youtube.com/embed/x6iwZSURP44'} />
				<div className={`w-full h-fit flex  justify-center`}>
					<div
						className={`flex bg-darkAccent border-dark border-2 rounded-md h-full w-full space-x-3 items-center justify-evenly`}>
						<div
							className={`text-3xl xl:text-4xl bg-dark border-red-300 border-2 leading-none font-sunny rounded-md text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							-1
						</div>
						<div className={`flex flex-col w-full ustify-center items-center py-1`}>
							<div className={`flex flex-col justify-center items-center`}>
								<h1
									className={` text-lg md:text-2xl xxl:text-3xl font-manga text-yellow-300 text-nowrap `}>
									{players
										.find((player) => player.userToken === currentVoteUser)
										?.name.toUpperCase() || 'Not found'}{' '}
								</h1>
							</div>
							<h1
								className={`text-xl md:text-2xl xxl:text-3xl font-manga text-white text-nowrap px-3 py-2 bg-dark w-fit rounded-full`}>
								x5 votes{' '}
							</h1>
						</div>
						<div
							className={`text-3xl xl:text-4xl bg-dark border-green-300 border-2 leading-none font-sunny rounded-md text-white flex h-full w-full items-center justify-center md:hover:border-white active:scale-95 cursor-pointer`}>
							+1
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default VotingComponent;
