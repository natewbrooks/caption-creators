import { useRef } from 'react';

const BonusesScroll = ({ playerScoreData, index }) => {
	const scrollRef = useRef(null);

	// Map bonus keys to their corresponding text descriptions
	const bonusDescriptions = {
		majority: 'MAJORITY BONUS',
		diversity: 'DIVERSITY BONUS',
		consistency: 'CONSISTENCY BONUS',
		winner: 'WINNER BONUS',
		pityParty: 'PITY PARTY BONUS',
		selfless: 'SELFLESS BONUS',
	};

	return (
		<div
			ref={scrollRef}
			className={`w-full h-fit flex overflow-x-auto overflow-y-hidden text-start items-start ${
				index % 2 === 0 ? 'bg-darkAccent' : 'bg-dark'
			} rounded-md`}
			style={{ whiteSpace: 'nowrap' }} // Prevent text wrapping for horizontal scrolling
		>
			<div className='pt-2 min-h-[3ch] flex w-full space-x-4 font-manga leading-none text-md items-start text-white text-start space-x-1'>
				{/* Check if each field is available before rendering */}
				{playerScoreData && (
					<>
						{Object.entries(playerScoreData.bonuses).map(
							([bonusKey, bonusData]) =>
								bonusData.received && (
									<p
										key={bonusKey}
										className={``}>
										<>
											{bonusDescriptions[bonusKey]} +{bonusData.pts}
										</>
									</p>
								)
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default BonusesScroll;
