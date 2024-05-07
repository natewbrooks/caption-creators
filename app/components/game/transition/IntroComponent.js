import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/SocketContext';
import RoundTimeline from '../modules/RoundTimeline';

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

	const bgColors = [
		'bg-purple-300',
		'bg-teal-300',
		'bg-cyan-300',
		'bg-green-300',
		'bg-red-300',
		'bg-yellow-300',
		'bg-pink-300',
	];
	// Choose a random color from the array idky why just cool
	const randomBgColor = bgColors[Math.floor(Math.random() * bgColors.length)];

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
			<div className={`relative flex flex-col w-full h-full justify-between items-center `}>
				<div
					className={`bg-dark rounded-md p-1  border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center `}>
					<div
						className={`w-full h-full flex flex-col space-y-2 py-4 justify-between items-center`}>
						<h1
							data-text={`ROUND ${roundIndex + 1} OVERVIEW`}
							className={`font-sunny z-10 text-yellow-300 text-5xl md:text-6xl`}>
							ROUND {roundIndex + 1} OVERVIEW
						</h1>
						<div
							className={`p-2 ${randomBgColor} aspect-square rounded-full w-fit h-fit flex justify-center items-center flex-col`}>
							<h1
								data-text={`${roundMultiplier}x`}
								className={`font-sunny z-10 text-yellow-300 text-[8rem]`}>
								{roundMultiplier}
								<span className={`text-dark`}>x</span>
							</h1>

							<div className={`w-full z-10 justify-center items-center flex space-x-1`}>
								<h1
									data-text={`VOTE MULTIPLIER`}
									className={`font-sunny text-4xl leading-none text-white `}>
									VOTE MULTIPLIER
								</h1>
							</div>
						</div>
						<div className={`hidden sm:flex justify-center w-full h-fit `}>
							<RoundTimeline
								roundData={roundData}
								phaseIndex={phaseIndex}
							/>
						</div>
					</div>

					<div
						className={`flex justify-center w-full h-fit py-4 text-2xl bg-darkAccent border-2 border-dark rounded-md`}>
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
