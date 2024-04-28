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
			<div className={`relative flex flex-col w-full h-full justify-between pb-2 md:pb-4`}>
				<VideoEmbed embedURL={'https://www.youtube.com/embed/x6iwZSURP44'} />
			</div>
		</>
	);
};

export default VotingComponent;
