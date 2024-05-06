import { useState, useEffect, useMemo } from 'react';
import { FaArrowRight, FaClock, FaMedal, FaTrophy } from 'react-icons/fa6';
import { FaCrown, FaUserCircle } from 'react-icons/fa';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';
import TimerInline from '../modules/TimerInline';
import AutoSizer from 'react-virtualized-auto-sizer';
import Image from 'next/image';
import { FixedSizeList as List } from 'react-window';
import { useRouter } from 'next/navigation';
import HostActionAlert from '../modules/HostActionAlert';

const PlayerListRow = ({ index, style, data }) => {
	const { players } = data;
	const player = players[index];

	if (!player) {
		return null;
	}

	return (
		<div
			style={{ style }}
			className={`${index % 2 === 1 ? 'bg-dark' : 'bg-darkAccent'} rounded-md overflow-hidden`}>
			<div className={`px-4 py-2 flex flex-row justify-between items-center w-full`}>
				<div className='w-fit h-full flex space-x-2 justify-center items-center'>
					{player.avatar ? (
						<div className={`relative`}>
							<Image
								src={player.avatar}
								className={`border-2 ${
									index % 2 === 0 ? 'border-dark' : 'border-darkAccent'
								} rounded-full `}
								alt={`Recap Avatar ${index + 1}`}
								width={48}
								height={48}
								unoptimized
							/>
						</div>
					) : (
						<div className={`relative`}>
							<FaUserCircle
								size={48}
								className={`${
									index % 2 === 0 ? 'text-darkAccent border-darkAccent' : 'text-dark border-dark'
								} border-2 rounded-full `}
							/>
						</div>
					)}
					<h2 className='text-2xl md:text-3xl text-white font-manga'>{player.name}</h2>
				</div>

				<div className='flex flex-col w-fit h-full justify-center items-center text-center'>
					<h1 className='text-2xl md:text-3xl font-manga text-end w-full text-yellow-300'>
						{player.totalPoints}
						<span className='font-manga text-lg ml-1'>PTS</span>
					</h1>
				</div>
			</div>
		</div>
	);
};

const GameResultsComponent = ({
	hostUserToken,
	players,
	gameData,
	phaseData,
	roundData,
	lobbyId,
	phaseIndex,
	roundIndex,
}) => {
	const router = useRouter();
	const { socket, userToken } = useSocket();
	const [finalScores, setFinalScores] = useState([]);
	const formattedTimeElapsed = formatTimeElapsed(gameData.timeElapsed);
	const [hostActionHeader, setHostActionHeader] = useState('');
	const [hostActionSubtext, setHostActionSubtext] = useState('');
	const [showHostActionAlert, setShowHostActionAlert] = useState(false);

	function formatTimeElapsed(totalSeconds) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		} else {
			return `${seconds}s`;
		}
	}

	const handleExitParty = () => {
		socket.emit('leave_lobby');
		router.push('/');
	};

	const handleStartNewGame = () => {
		if (userToken === hostUserToken) {
			socket.emit('start_game', { lobbyId, userToken });
			setHostActionHeader(true);
			setHostActionHeader('HOST STARTED NEW GAME');
			setHostActionSubtext('RESETTING...');
		}
	};

	const handleReturnToLobby = () => {
		if (userToken === hostUserToken) {
			socket.emit('return_to_lobby', { lobbyId, userToken });
			setHostActionHeader(true);
			setHostActionHeader('HOST BRINGING PARTY');
			setHostActionSubtext('TO LOBBY...');
		}
	};

	// Function to calculate and sort the final scores
	const calculateSortedFinalScores = () => {
		let playerScores = [];

		// Aggregate scores from all rounds for each player
		players.forEach((player) => {
			let totalPoints = 0;

			gameData.rounds.forEach((round) => {
				const roundScores = round.scores[player.userToken];
				if (roundScores && roundScores.pts) {
					totalPoints += roundScores.pts.total;
				}
			});

			playerScores.push({
				userToken: player.userToken,
				name: player.name,
				avatar: player.avatar,
				totalPoints: totalPoints,
			});
		});

		// Sort the array by total points in descending order
		playerScores.sort((a, b) => b.totalPoints - a.totalPoints);

		return playerScores;
	};

	useEffect(() => {
		// Calculate and set the sorted final scores
		const sortedScores = calculateSortedFinalScores();
		setFinalScores(sortedScores);
	}, [gameData]);

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-evenly items-center `}>
				<div
					id=''
					className={`bg-dark rounded-md p-2  border-2 border-darkAccent justify-between flex h-full w-full flex-col `}>
					<div
						className={`border-b-2 border-b-darkAccent w-full h-fit py-2 flex flex-col justify-center items-center`}>
						<h1
							data-text={'GAME ENDED'}
							className={`font-sunny text-5xl md:text-6xl z-10 text-purple-300`}>
							GAME ENDED
						</h1>
						<div
							className={`w-full flex justify-center flex-col xs:flex-row items-center space-x-2`}>
							<div className={`flex flex-row space-x-2 w-[100px] justify-center `}>
								<FaCrown
									size={18}
									className={`text-yellow-300 translate-y-[0.15rem]`}
								/>
								<h1 className={`font-manga text-xl l z-10 text-white`}>
									{finalScores[0]?.name.toUpperCase()}
								</h1>
							</div>
							<div className={`w-[100px] flex flex-row space-x-1 justify-center `}>
								<div className={`flex font-manga text-xl items-center space-x-2`}>
									<FaClock
										size={15}
										className={`-translate-y-[0.1rem] text-yellow-300`}
									/>
									<span>{formattedTimeElapsed}</span>
								</div>
							</div>
						</div>
					</div>

					{finalScores && (
						<div className={`w-full h-full overflow-hidden `}>
							<AutoSizer>
								{({ height, width }) => (
									<div
										style={{ height, width }}
										className={`flex flex-col space-y-1 items-center overflow-y-auto overflow-x-hidden `}>
										{finalScores && (
											<div
												className={`w-full md:w-2/3 pt-4 px-4 md:px-0 min-h-[200px] md:min-h-[220px] flex `}>
												<div className={`w-full h-full items-end flex space-x-1`}>
													<div
														className={`relative w-full h-full flex flex-col items-center justify-end`}>
														<div
															className={`h-fit flex flex-col space-y-1 justify-center items-center`}>
															{finalScores[1]?.avatar ? (
																<div className={`relative`}>
																	<Image
																		src={finalScores[1].avatar}
																		className={`border-2 rounded-full transition-all ease-in-out delay-100 duration-500 border-darkAccent`}
																		alt={`Podium Avatar BRONZE`}
																		width={42}
																		height={42}
																		unoptimized
																	/>
																</div>
															) : (
																<div className={`relative`}>
																	<FaUserCircle
																		size={42}
																		className={`border-darkAccent text-white border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
																	/>
																</div>
															)}
															<div
																className={`flex flex-col justify-center items-center leading-none`}>
																<h1 className={`font-manga text-xl text-white `}>
																	{finalScores[1]?.name || 'N/A'}
																</h1>
																<h1 className={`font-manga text-md text-slate-300 -translate-y-1`}>
																	{finalScores[1]?.totalPoints || 0}{' '}
																	<span className={`text-sm`}>PTS</span>
																</h1>
															</div>
														</div>
														<div className='bg-slate-300 rounded-t-md flex w-full h-[40%] justify-center items-end pb-2'>
															<FaMedal
																size={32}
																className={`text-dark`}
															/>
														</div>
													</div>
													<div
														className={`relative w-full h-full flex flex-col items-center justify-end`}>
														<div
															className={` flex flex-col justify-center space-y-1 items-center leading-none`}>
															{finalScores[0]?.avatar ? (
																<div className={`relative`}>
																	<Image
																		src={finalScores[0].avatar}
																		className={`border-2 rounded-full transition-all ease-in-out delay-100 duration-500 border-darkAccent`}
																		alt={`Podium Avatar GOLD`}
																		width={42}
																		height={42}
																		unoptimized
																	/>
																</div>
															) : (
																<div className={`relative`}>
																	<FaUserCircle
																		size={42}
																		className={`border-darkAccent text-white border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
																	/>
																</div>
															)}
															<div
																className={`flex flex-col justify-center items-center leading-none`}>
																<h1 className={`font-manga text-xl text-white `}>
																	{finalScores[0]?.name || 'N/A'}
																</h1>
																<h1 className={`font-manga text-md text-yellow-300 -translate-y-1`}>
																	{finalScores[0]?.totalPoints || 0}{' '}
																	<span className={`text-sm`}>PTS</span>
																</h1>
															</div>
														</div>
														<div className='bg-yellow-300 rounded-t-md flex w-full h-[100%] justify-center items-end pb-2'>
															<FaTrophy
																size={32}
																className={`text-dark`}
															/>
														</div>
													</div>
													<div
														className={`relative w-full h-full flex flex-col items-center justify-end`}>
														<div className={` flex flex-col justify-center space-y-1 items-center`}>
															{finalScores[2]?.avatar ? (
																<div className={`relative`}>
																	<Image
																		src={finalScores[2].avatar}
																		className={`border-2 rounded-full transition-all ease-in-out delay-100 duration-500 border-darkAccent`}
																		alt={`Podium Avatar SILVER`}
																		width={42}
																		height={42}
																		unoptimized
																	/>
																</div>
															) : (
																<div className={`relative`}>
																	<FaUserCircle
																		size={42}
																		className={`border-darkAccent text-white border-2 rounded-full transition-all ease-in-out delay-100 duration-500`}
																	/>
																</div>
															)}
															<div
																className={`flex flex-col justify-center items-center leading-none`}>
																<h1 className={`font-manga text-xl text-white `}>
																	{finalScores[2]?.name || 'N/A'}
																</h1>
																<h1 className={`font-manga text-md text-yellow-600 -translate-y-1`}>
																	{finalScores[2]?.totalPoints || 0}{' '}
																	<span className={`text-sm`}>PTS</span>
																</h1>
															</div>
														</div>
														<div className='bg-yellow-600 rounded-t-md flex w-full h-[35%] justify-center items-end pb-2'>
															<FaMedal
																size={32}
																className={`text-dark`}
															/>
														</div>
													</div>
												</div>
											</div>
										)}
										<div className={`h-fit`}>
											<List
												height={finalScores.length * 80}
												width={width} // Use full width provided by AutoSizer
												itemCount={finalScores.length}
												itemSize={80}
												itemData={{ players: finalScores }}>
												{PlayerListRow}
											</List>
										</div>
									</div>
								)}
							</AutoSizer>
						</div>
					)}

					{hostUserToken === userToken ? (
						<div
							className={`z-10 grid grid-cols-2 gap-2 sm:gap-0 sm:flex sm:space-x-2 justify-center w-full h-fit text-2xl border-2 border-dark rounded-md`}>
							{hostUserToken === userToken && (
								<>
									<div
										onClick={() => {
											handleStartNewGame();
										}}
										className='col-span-2 p-1 md:p-2 w-full text-nowrap items-center flex justify-center rounded-md bg-dark outline outline-green-300 cursor-pointer sm:hover:outline-white sm:active:scale-95 outline-2'>
										<div
											className={`text-xl sm:text-2xl px-1 leading-none w-full h-fit justify-center items-center flex flex-col`}>
											<h1
												data-text={`(QUICK START)`}
												className={`font-manga text-sm text-white `}>
												(QUICK START)
											</h1>
											<h1
												data-text={`NEW GAME`}
												className={`font-manga text-white `}>
												NEW GAME
											</h1>
										</div>
									</div>
									<div
										onClick={() => {
											handleReturnToLobby();
										}}
										className='p-1 md:p-2 text-nowrap w-full items-center flex justify-center rounded-md bg-dark outline outline-yellow-300 cursor-pointer sm:hover:outline-white sm:active:scale-95 outline-2'>
										<div
											className={`text-xl sm:text-2xl px-1 leading-none w-full h-fit justify-center items-center flex flex-col`}>
											<h1
												data-text={`(BRINGS PARTY)`}
												className={`font-manga text-sm text-white `}>
												(BRINGS PARTY)
											</h1>
											<h1
												data-text={`TO LOBBY`}
												className={`font-manga text-white `}>
												TO LOBBY
											</h1>
										</div>
									</div>
								</>
							)}
							<div
								onClick={() => {
									handleExitParty();
								}}
								className='p-1 md:p-2 text-nowrap w-full items-center flex justify-center rounded-md bg-dark outline outline-red-300 cursor-pointer sm:hover:outline-white sm:active:scale-95 outline-2'>
								<div
									className={`text-xl sm:text-2xl px-1 leading-none w-full h-fit justify-center items-center flex flex-col`}>
									<h1
										data-text={`(REASSIGN HOST)`}
										className={`font-manga text-sm text-white `}>
										(REASSIGN HOST)
									</h1>
									<h1
										data-text={`EXIT PARTY`}
										className={`font-manga text-white `}>
										EXIT PARTY
									</h1>
								</div>
							</div>
						</div>
					) : (
						<div className={`flex flex-col`}>
							<h1
								data-text={`EXIT PARTY`}
								className={`font-manga text-white py-1 `}>
								WAITING FOR HOST ACTION...
							</h1>
							<div
								onClick={() => {
									handleExitParty();
								}}
								className='z-10 p-1 text-nowrap w-full items-center flex justify-center rounded-md bg-dark outline outline-red-300 cursor-pointer sm:hover:outline-white sm:active:scale-95 outline-2'>
								<div
									className={`p-2 text-2xl leading-none w-full h-fit justify-center items-center flex flex-col`}>
									<h1
										data-text={`EXIT PARTY`}
										className={`font-manga text-white `}>
										EXIT PARTY
									</h1>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			{showHostActionAlert && (
				<HostActionAlert
					header={hostActionHeader}
					subtext={hostActionSubtext}
				/>
			)}
		</>
	);
};

export default GameResultsComponent;
