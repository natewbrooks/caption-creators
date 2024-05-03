import { useState, useEffect } from 'react';
import { useSocket } from '@/app/contexts/socketContext';

const OutroComponent = ({
	players,
	gameData,
	phaseData,
	roundData,
	roundScoreData,
	roundIndex,
	roundMultiplier,
}) => {
	const { socket, userToken } = useSocket();
	const [hasRoundScoreData, setHasRoundScoreData] = useState(false);

	useEffect(() => {
		setHasRoundScoreData(Object.keys(roundScoreData).length > 0);
	}, [roundScoreData]);

	return (
		<div className={`relative flex flex-col w-full h-full justify-center items-center`}>
			<h1
				data-text={`ROUND ${roundIndex + 1} RECAP`}
				className={`text-sunny text-yellow-300 text-4xl`}>
				ROUND {roundIndex + 1} RECAP
			</h1>
			<div className={`flex flex-col space-y-4 p-4`}>
				{hasRoundScoreData ? (
					Object.entries(roundScoreData).map(([userToken, scoreData]) => {
						// Check if player is found and assign the correct name
						const player = players?.find((p) => p.userToken === userToken) || { name: 'Unknown' };
						return (
							<div
								key={userToken}
								className='flex flex-col space-y-2 border-b border-gray-300 pb-2'>
								<h2 className='text-2xl text-white font-bold'>{player.name}</h2>
								<div className='text-white'>
									{/* Check if each field is available before rendering */}
									<p>Points Earned: {scoreData.pointsEarned ?? 'N/A'}</p>
									{scoreData.majorityBonus?.received && (
										<p>Majority Bonus: {scoreData.majorityBonus.ptsReceived}</p>
									)}
									{scoreData.diversityBonus?.received && (
										<p>Diversity Bonus: {scoreData.diversityBonus.ptsReceived}</p>
									)}
									{scoreData.consistencyBonus?.received && (
										<p>Consistency Bonus: {scoreData.consistencyBonus.ptsReceived}</p>
									)}
									{scoreData.winnerBonus?.received && (
										<p>Winner Bonus: {scoreData.winnerBonus.ptsReceived}</p>
									)}
									{scoreData.pityPartyBonus?.received && (
										<p>Pity Party Bonus: {scoreData.pityPartyBonus.ptsReceived}</p>
									)}
								</div>
							</div>
						);
					})
				) : (
					<div className={`flex w-full h-full justify-center items-center`}>
						<h1
							data-text={`LOADING...`}
							className={`text-4xl font-sunny text-purple-300 `}>
							LOADING...
						</h1>
					</div>
				)}
			</div>
		</div>
	);
};

export default OutroComponent;
