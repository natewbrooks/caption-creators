import { useState, useEffect, useRef } from 'react';

const BonusesScroll = ({ playerScoreData, index }) => {
	const scrollRef = useRef(null);

	return (
		<div
			ref={scrollRef}
			className={`w-full h-fit flex overflow-x-auto overflow-y-hidden ${
				index % 2 === 0 ? 'bg-dark' : 'bg-dark'
			} rounded-md px-2`}
			style={{ whiteSpace: 'nowrap' }} // Prevent text wrapping for horizontal scrolling
		>
			<div className='py-2 flex w-full font-manga leading-none text-md text-white space-x-6'>
				{/* Check if each field is available before rendering */}
				{playerScoreData.majorityBonus?.received && (
					<p className={``}>MAJORITY BONUS +{playerScoreData.majorityBonus.ptsReceived}</p>
				)}
				{playerScoreData.diversityBonus?.received && (
					<p className={``}>DIVERSITY BONUS +{playerScoreData.diversityBonus.ptsReceived}</p>
				)}
				{playerScoreData.consistencyBonus?.received && (
					<p>CONSISTENCY BONUS +{playerScoreData.consistencyBonus.ptsReceived}</p>
				)}
				{playerScoreData.winnerBonus?.received && (
					<p>WINNER BONUS +{playerScoreData.winnerBonus.ptsReceived}</p>
				)}
				{playerScoreData.pityPartyBonus?.received && (
					<p>PITY PARTY BONUS +{playerScoreData.pityPartyBonus.ptsReceived}</p>
				)}
			</div>
		</div>
	);
};

export default BonusesScroll;
