import { useState, useEffect, useRef } from 'react';
import { FaArrowRight, FaCheck, FaClock } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';
import TimerInline from '../modules/TimerInline';

const TransitionComponent = ({
	players,
	gameData,
	phaseData,
	roundData,
	setGameData,
	currentPhase = 'vote',
	lobbyId,
	currentVideoDisplayed,
	usersFinished = [],
	phaseIndex,
	gamePhaseTimer,
	timeLeftAtSubmit,
}) => {
	const { socket, userToken } = useSocket();
	const [prevPhaseName, setPrevPhaseName] = useState('');
	const [nextPhaseName, setNextPhaseName] = useState('');
	const [clientFinished, setClientFinished] = useState();

	useEffect(() => {
		if (roundData && Array.isArray(roundData.phases)) {
			const prevIndex = phaseIndex - 1;
			const nextIndex = phaseIndex + 1;
			if (prevIndex >= 0) {
				setPrevPhaseName(roundData.phases[prevIndex].name);
			} else {
				console.log('Phase index out of bounds');
				setPrevPhaseName(''); // Reset if out of bounds
			}

			if (nextIndex < roundData.phases.length) {
				setNextPhaseName(roundData.phases[nextIndex].name);
			} else {
				console.log('Phase index out of bounds');
				setNextPhaseName(''); // Reset if out of bounds
			}
		} else {
			console.log('Phases are undefined or not an array');
			setNextPhaseName(''); // Reset if phases are undefined
		}

		setClientFinished(usersFinished.includes(userToken) || false);
	}, [phaseIndex, roundData, usersFinished, userToken]);

	console.log('ROUND DATA:', JSON.stringify(roundData));
	console.log('NEXT PHASE NAME:', nextPhaseName);
	console.log('usersFinished: ' + JSON.stringify(usersFinished));

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-center items-center `}>
				<div
					className={`bg-dark rounded-md p-1  border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center `}>
					{clientFinished ? (
						<>
							<div
								className={`p-1 w-full h-full flex justify-center items-center flex-col space-y-4`}>
								<div className={`flex flex-col w-full h-fit justify-end items-center`}>
									<h1
										data-text={`
									${currentPhase.toUpperCase()} SUBMITTED!
									`}
										className={`font-sunny text-green-300 text-2xl  sm:text-4xl`}>
										{currentPhase.toUpperCase()} SUBMITTED!
									</h1>
									<div className={`w-full justify-center items-center flex space-x-1`}>
										<h1
											data-text={`YOU HAD`}
											className={`font-manga text-2xl text-white`}>
											YOU HAD
										</h1>
										<div className={`flex font-manga text-2xl space-x-1 text-white`}>
											<TimerInline timer={timeLeftAtSubmit} />
											<span> SECOND{timeLeftAtSubmit != 1 ? 'S' : ''} LEFT</span>
										</div>
									</div>
								</div>
								<div
									className={`flex flex-col w-fit h-fit justify-center bg-dark  p-1 rounded-full`}>
									<div
										className={`flex flex-col h-full w-fit justify-center p-6 bg-green-300 items-center font-sunny text-8xl text-dark leading-none aspect-square rounded-full`}>
										<div
											className={`flex font-sunny text-[5rem] sm:text-[7rem] justify-center items-center h-full w-full space-x-10 space-y-2`}>
											<h1
												data-text={`${usersFinished.length}`}
												className={` -translate-y-10 translate-x-4 z-10  text-dark`}>
												{usersFinished.length}
											</h1>
											<h1
												data-text={`/`}
												className={` z-10  text-dark`}>
												/
											</h1>{' '}
											<h1
												data-text={`${players.length}`}
												className={` translate-y-10 -translate-x-4 z-10 text-dark`}>
												{players.length}
											</h1>{' '}
										</div>
									</div>
								</div>
								<div className={`w-full justify-center items-center flex flex-col space-x-1`}>
									<h1
										data-text={`SUBMITTED THEIR ${currentPhase.toUpperCase()} IN TIME.`}
										className={`font-manga text-2xl text-white`}>
										SUBMITTED THEIR {currentPhase.toUpperCase()} IN TIME.
									</h1>
								</div>
							</div>
						</>
					) : (
						<>
							<div
								className={`p-1 w-full h-full flex justify-center items-center flex-col space-y-4`}>
								<div className={`flex flex-col w-full h-fit justify-end items-center`}>
									<h1
										data-text={`
									NO SUBMISSION! YIKES!
									`}
										className={`font-sunny text-red-300 text-2xl  sm:text-4xl`}>
										NO SUBMISSION! YIKES!
									</h1>
									<div className={`w-full justify-center items-center flex space-x-1`}>
										<h1
											data-text={`THAT'S OKAY, HERE'S WHAT WE SUBMITTED FOR YOU:`}
											className={`font-manga text-2xl text-white`}>
											YOU'LL GET IT NEXT TIME...
										</h1>
									</div>
								</div>
								<div
									className={`flex flex-col w-fit h-fit justify-center bg-dark  p-1 rounded-full`}>
									<div
										className={`flex flex-col h-full w-fit justify-center p-6 bg-red-300 items-center font-sunny text-8xl text-dark leading-none aspect-square rounded-full`}>
										<div
											className={`flex font-sunny text-[5rem] sm:text-[7rem] justify-center items-center h-full w-full space-x-10 space-y-2`}>
											<h1
												data-text={`${usersFinished.length}`}
												className={` -translate-y-10 translate-x-4 z-10  text-dark`}>
												{usersFinished.length}
											</h1>
											<h1
												data-text={`/`}
												className={` z-10  text-dark`}>
												/
											</h1>{' '}
											<h1
												data-text={`${players.length}`}
												className={` translate-y-10 -translate-x-4 z-10 text-dark`}>
												{players.length}
											</h1>{' '}
										</div>
									</div>
								</div>
								<div className={`w-full justify-center text-2xl items-center flex space-x-1`}>
									<h1
										data-text={`SUBMITTED THEIR ${currentPhase.toUpperCase()} IN TIME.`}
										className={`font-manga text-2xl text-white`}>
										SUBMITTED THEIR {currentPhase.toUpperCase()} IN TIME.
									</h1>
								</div>
							</div>
						</>
					)}

					<div
						className={`flex justify-center w-full h-fit py-4 text-2xl md:text-3xl bg-darkAccent border-2 border-dark rounded-md`}>
						<h1
							data-text={nextPhaseName}
							className={`font-manga text-yellow-300`}>
							NEXT PHASE: <span className={`text-white`}>{nextPhaseName.toUpperCase()}</span>
						</h1>
					</div>
				</div>
			</div>
		</>
	);
};

export default TransitionComponent;
