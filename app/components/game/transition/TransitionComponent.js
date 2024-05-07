import { useState, useEffect, useRef } from 'react';
import { FaArrowRight, FaCheck, FaClock } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/SocketContext';
import TimerInline from '../modules/TimerInline';
import AutoSizer from 'react-virtualized-auto-sizer';

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
	const [prevPhaseKey, setPrevPhaseKey] = useState('');
	const [nextPhaseName, setNextPhaseName] = useState('');
	const [clientFinished, setClientFinished] = useState();

	useEffect(() => {
		if (roundData && Array.isArray(roundData.phases)) {
			const prevIndex = phaseIndex - 1;
			const nextIndex = phaseIndex + 1;
			if (prevIndex >= 0) {
				setPrevPhaseKey(roundData.phases[prevIndex].key);
			} else {
				console.log('Phase index out of bounds');
				setPrevPhaseKey(''); // Reset if out of bounds
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
			<div className={`relative flex flex-col w-full h-full `}>
				<AutoSizer>
					{({ height, width }) => (
						<div
							style={{ height, width }}
							className={`bg-dark overflow-hidden rounded-md pt-2 md:pt-4 border-2 border-darkAccent justify-between flex flex-col items-center `}>
							{clientFinished ? (
								<>
									<div
										className={`p-1 w-full h-full flex justify-center items-center flex-col space-y-2 md:space-y-4`}>
										<div className={`flex flex-col w-full h-fit justify-end items-center`}>
											<h1
												data-text={`
									${prevPhaseKey.toUpperCase()} SUBMITTED!
									`}
												className={`font-sunny text-green-300 text-4xl sm:text-5xl md:text-6xl`}>
												{prevPhaseKey.toUpperCase()} SUBMITTED!
											</h1>
											<div
												className={`w-full text-nowrap justify-center items-center flex space-x-1`}>
												<h1
													data-text={`YOU HAD`}
													className={`font-manga text-xl sm:text-2xl text-white`}>
													YOU HAD
												</h1>
												<div className={`flex font-manga text-xl sm:text-2xl space-x-2 text-white`}>
													<TimerInline timer={timeLeftAtSubmit} />
													<span> SECOND{timeLeftAtSubmit != 1 ? 'S' : ''} LEFT</span>
												</div>
											</div>
										</div>
										<div
											className={`flex flex-col w-full h-fit justify-center items-center bg-dark  p-1 rounded-full`}>
											<div
												className={`flex flex-col h-fit w-fit justify-center p-7 bg-green-300 items-center font-sunny text-8xl text-dark leading-none aspect-square rounded-full`}>
												<div
													className={`flex font-sunny text-[3rem] sm:text-[5rem] justify-center items-center h-fit w-full space-x-10 space-y-2`}>
													<h1
														data-text={`${usersFinished.length}`}
														className={` -translate-y-10 translate-x-4  text-white`}>
														{usersFinished.length}
													</h1>
													<h1
														data-text={`/`}
														className={` z-10 text-white`}>
														/
													</h1>{' '}
													<h1
														data-text={`${players.length}`}
														className={` translate-y-10 -translate-x-4 text-white`}>
														{players.length}
													</h1>{' '}
												</div>
											</div>
										</div>
										<div className={`w-full justify-center items-center flex flex-col space-x-1`}>
											<h1
												data-text={`SUBMITTED THEIR ${prevPhaseKey.toUpperCase()} IN TIME.`}
												className={`font-manga text-xl sm:text-2xl text-white`}>
												SUBMITTED THEIR {prevPhaseKey.toUpperCase()} IN TIME.
											</h1>
										</div>
									</div>
								</>
							) : (
								<>
									<div
										className={`p-1 w-full h-full flex items-center justify-center flex-col space-y-2 md:space-y-4`}>
										<div className={`flex flex-col w-full h-fit justify-end items-center`}>
											<h1
												data-text={`NO SUBMISSION!`}
												className={`font-sunny text-red-300 text-4xl sm:text-5xl md:text-6xl`}>
												NO SUBMISSION!
											</h1>
											<div className={`w-full justify-center items-center flex space-x-1`}>
												<h1
													data-text={`YOU'LL GET IT NEXT TIME...`}
													className={`font-manga text-xl sm:text-2xl text-white`}>
													{`YOU'LL GET IT NEXT TIME...`}
												</h1>
											</div>
										</div>
										<div
											className={`flex flex-col space-y-4 w-full h-fit justify-center items-center bg-dark p-1 rounded-full`}>
											<div
												className={`flex flex-col h-full w-fit justify-center p-7 bg-red-300 items-center font-sunny text-dark leading-none aspect-square rounded-full`}>
												<div
													className={`flex font-sunny text-[3rem] sm:text-[5rem] justify-center items-center h-full w-full space-x-10 space-y-2`}>
													<h1
														data-text={`${usersFinished.length}`}
														className={` -translate-y-10 translate-x-4 z-10  text-white`}>
														{usersFinished.length}
													</h1>
													<h1
														data-text={`/`}
														className={` z-10  text-white`}>
														/
													</h1>{' '}
													<h1
														data-text={`${players.length}`}
														className={` translate-y-10 -translate-x-4 z-10 text-white`}>
														{players.length}
													</h1>{' '}
												</div>
											</div>
										</div>
										<div className={`w-full justify-center items-center flex flex-col space-x-1`}>
											<h1
												data-text={`SUBMITTED THEIR ${prevPhaseKey.toUpperCase()} IN TIME.`}
												className={`font-manga text-xl sm:text-2xl text-white`}>
												SUBMITTED THEIR {prevPhaseKey.toUpperCase()} IN TIME.
											</h1>
										</div>
									</div>
								</>
							)}

							<div className={`flex w-full h-fit p-1`}>
								<div
									className={`flex justify-center w-full h-fit py-4 text-xl sm:text-2xl bg-darkAccent border-2 border-dark rounded-md`}>
									<h1
										data-text={nextPhaseName}
										className={`font-manga text-yellow-300`}>
										NEXT PHASE: <span className={`text-white`}>{nextPhaseName.toUpperCase()}</span>
									</h1>
								</div>
							</div>
						</div>
					)}
				</AutoSizer>
			</div>
		</>
	);
};

export default TransitionComponent;
