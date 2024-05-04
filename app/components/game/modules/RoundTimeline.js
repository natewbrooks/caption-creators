import React from 'react';

const RoundTimeline = ({ roundData, phaseIndex }) => {
	return (
		<div className={`hidden sm:flex justify-center w-full h-fit `}>
			{roundData && roundData.phases && roundData.phases.length > 0 && (
				<div className={`flex w-full items-center `}>
					{roundData.phases.map(
						(phase, index) =>
							phase.key !== 'transition' && (
								<React.Fragment key={index}>
									<div className={`relative w-full flex flex-col items-center`}>
										<span className={`text-white font-manga text-md pb-1 md:text-lg`}>
											{phase.key.toUpperCase()}
										</span>
										<div
											className={`w-4 h-4 rounded-full ${
												index === phaseIndex ? 'bg-dark' : 'bg-white'
											}`}
											style={{ border: index === phaseIndex ? '2px solid yellow' : '' }}
										/>
										{index < roundData.phases.length - 1 && (
											<div className='absolute w-4 bottom-[1.15rem] -right-2 border-t-4 translate-y-3 rounded-full border-white'></div>
										)}
									</div>
								</React.Fragment>
							)
					)}
				</div>
			)}
		</div>
	);
};

export default RoundTimeline;
