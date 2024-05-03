import { useState, useEffect, useRef } from 'react';
import { FaArrowRight, FaCheck, FaClock } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const TransitionComponent = ({
	players,
	currentRound,
	gameData,
	phaseData,
	roundData,
	setGameData,
	lobbyId,
	currentVideoDisplayed,
	usersFinished = [],
	phaseIndex,
	gamePhaseTimer,
	timeLeftAtSubmit,
}) => {
	const { socket, userToken } = useSocket();
	const [nextPhaseName, setNextPhaseName] = useState('');
	const [clientFinished, setClientFinished] = useState();

	useEffect(() => {
		if (roundData && Array.isArray(roundData.phases)) {
			const nextIndex = phaseIndex + 1;
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
							<div className={`pt-1 w-full h-full flex justify-center items-center flex-col`}>
								<h1
									data-text={'GOOD JOB! YOU SUBMITTED WITH'}
									className={`font-manga text-yellow-300 text-2xl`}>
									GOOD JOB! YOU SUBMITTED WITH
								</h1>

								<div className={`w-full justify-center items-center flex space-x-1`}>
									<div
										className={`bg-dark -translate-y-[0.15rem] p-1 rounded-full space-x-2 flex w-fit justify-center items-center`}>
										<FaClock
											size={18}
											className={``}
										/>
									</div>
									<h1
										data-text={`${timeLeftAtSubmit} seconds left.`}
										className={`font-manga text-3xl ${
											timeLeftAtSubmit > 10
												? 'text-white'
												: timeLeftAtSubmit <= 10 && timeLeftAtSubmit >= 5
												? 'text-yellow-300'
												: 'text-red-300'
										}
`}>
										{timeLeftAtSubmit}{' '}
										<span className={`text-white`}>
											SECOND{timeLeftAtSubmit != 1 ? 'S' : ''} LEFT
										</span>
									</h1>
								</div>
								<div className={`w-full h-full justify-center items-center flex flex-col`}>
									<div
										className={`flex flex-col w-fit h-fit justify-center bg-dark  p-1 rounded-full`}>
										<div
											className={`flex flex-col justify-center p-4 bg-green-300 items-center font-sunny text-8xl text-dark leading-none aspect-square rounded-full`}>
											<div
												className={`flex font-sunny text-[5rem] sm:text-[7rem] justify-center items-center h-full w-full space-x-10 space-y-2`}>
												<h1
													data-text={`${usersFinished.length}`}
													className={`-translate-y-10 translate-x-4 z-10  text-white`}>
													{usersFinished.length}
												</h1>
												<h1
													data-text={`/`}
													className={`z-10  text-white`}>
													/
												</h1>{' '}
												<h1
													data-text={`${players.length}`}
													className={`translate-y-10 -translate-x-4 z-10 text-white`}>
													{players.length}
												</h1>{' '}
											</div>
										</div>
										<h1
											data-text={'PLAYERS SUBMITTED IN TIME.'}
											className={`sm:hidden font-manga text-white z-10 text-2xl leading-none`}>
											PLAYERS SUBMITTED IN TIME.
										</h1>
									</div>
								</div>
							</div>
						</>
					) : (
						<>
							<div className={`p-1 w-full h-full flex justify-center items-center flex-col`}>
								<h1
									data-text={clientFinished ? 'YOU FINISHED WITH' : 'naew dawg'}
									className={`font-manga text-red-300 text-2xl`}>
									YIKES! YOU DIDN'T SUBMIT IN TIME!
								</h1>

								<div className={`w-full justify-center items-center flex space-x-1`}>
									<h1
										data-text={`THAT'S OKAY, HERE'S WHAT WE SUBMITTED FOR YOU:`}
										className={`font-manga text-3xl text-white`}>
										THAT'S OKAY, YOU'LL GET IT NEXT TIME...
									</h1>
								</div>
								<div className={`w-full h-full justify-center items-center flex flex-col`}>
									<div
										className={`flex flex-col w-fit h-fit justify-center bg-dark  p-1 rounded-full`}>
										<div
											className={`flex flex-col justify-center p-4 bg-red-300 items-center font-sunny text-8xl text-dark leading-none aspect-square rounded-full`}>
											<div
												className={`flex font-sunny sm:translate-y-4 text-[5rem] sm:text-[7rem] justify-center items-center h-full w-full space-x-10 space-y-2`}>
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
										<h1
											data-text={'PLAYERS SUBMITTED IN TIME.'}
											className={`sm:hidden font-manga text-yellow-300 z-10 text-2xl leading-none`}>
											PLAYERS SUBMITTED IN TIME.
										</h1>
									</div>
								</div>
							</div>
						</>
					)}

					<div
						className={`flex justify-center w-full h-fit py-4 text-3xl bg-darkAccent border-2 border-dark rounded-md`}>
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
