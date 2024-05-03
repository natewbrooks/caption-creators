import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const IntroComponent = ({
	players,
	currentRound,
	gameData,
	phaseData,
	roundData,
	setGameData,
	lobbyId,
	currentVideoDisplayed,
	usersFinished,
	phaseIndex,
	roundIndex,
	roundMultiplier,
}) => {
	const { socket, userToken } = useSocket();
	const [nextPhaseName, setNextPhaseName] = useState('');

	useEffect(() => {
		if (roundData && Array.isArray(roundData.phases)) {
			if (phaseIndex + 1 < roundData.phases.length) {
				setNextPhaseName(roundData.phases[phaseIndex + 1].name);
			} else {
				console.log('Phase index out of bounds');
				setNextPhaseName(''); // Reset if out of bounds
			}
		} else {
			console.log('Phases are undefined or not an array');
			setNextPhaseName(''); // Reset if phases is undefined
		}
	}, [phaseIndex, roundData]);

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-center items-center `}>
				<div
					className={`bg-dark rounded-md p-1  border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center `}>
					<div className={`w-full h-full flex justify-center items-center`}>
						<div
							className={`p-2 bg-green-300 aspect-square rounded-full w-fit h-fit flex justify-center items-center flex-col`}>
							<h1
								data-text={'ROUND 2'}
								className={`font-manga z-10 text-purple-300 text-2xl`}>
								ROUND 2
							</h1>
							<h1
								data-text={`${roundMultiplier}x`}
								className={`font-sunny z-10 text-yellow-300 text-[8rem]`}>
								{roundMultiplier}x
							</h1>

							<div className={`w-full z-10 justify-center items-center flex space-x-1`}>
								<h1
									data-text={`SCORE MULTIPLIER`}
									className={`font-manga text-4xl text-white `}>
									SCORE MULTIPLIER
								</h1>
							</div>
						</div>
					</div>

					<div
						className={`flex justify-center w-full h-fit py-4 text-3xl bg-darkAccent border-2 border-dark rounded-md`}>
						<h1
							data-text={nextPhaseName}
							className={`font-manga text-yellow-300 `}>
							NEXT PHASE: <span className={`text-white`}>{nextPhaseName.toUpperCase()}</span>
						</h1>
					</div>
				</div>
			</div>
		</>
	);
};

export default IntroComponent;
