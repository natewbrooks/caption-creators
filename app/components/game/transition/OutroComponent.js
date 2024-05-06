import { useState, useEffect } from 'react';
import BonusesScroll from '../modules/BonusesScroll';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Image from 'next/image';
import { FaUserCircle } from 'react-icons/fa';

const PlayerListRow = ({ index, style, data }) => {
	const { roundMultiplier, players, sortedPlayerScores } = data;
	const [userToken, scoreData] = sortedPlayerScores[index];
	const player = players.find((p) => p.userToken === userToken) || { name: 'Unknown' };

	const ptsEarned = scoreData?.pts.total || 0;
	const selfVotePts = scoreData?.pts.selfVote || 0;
	const votePts = scoreData?.pts.vote || 0;
	const bonusPts = scoreData?.bonuses.total || 0;

	return (
		<div
			className={`${
				index % 2 === 1 ? 'bg-dark' : 'bg-darkAccent'
			} p-1 px-2 rounded-md w-full overflow-hidden h-fit flex flex-col justify-between py-2 `}
			style={style}>
			<div className='flex h-full w-full justify-between'>
				<div className='w-fit h-full flex space-x-2 justify-center items-center'>
					{player.avatar ? (
						<div className={`relative`}>
							<Image
								src={player.avatar}
								className={`border-2 ${
									index % 2 === 1 ? 'border-dark' : 'border-darkAccent'
								} rounded-full `}
								alt={`Recap Avatar ${index + 1}`}
								width={48}
								height={48}
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
					<h2 className='text-4xl text-white font-manga'>{player.name}</h2>
				</div>
				<div className='hidden md:flex w-fit h-full items-center space-x-4 text-center'>
					<div className='flex flex-col justify-center items-center'>
						<div className='font-manga text-red-300 text-sm w-full text-center'>SELF VOTES</div>
						<h1 className='text-2xl font-manga text-white-300'>{selfVotePts}</h1>
					</div>
					<div className='flex flex-col justify-center items-center'>
						<div className='font-manga text-green-300 text-sm w-full text-center'>VOTES</div>
						<h1 className='text-2xl font-manga text-white-300'>{votePts}</h1>
					</div>

					<div className='flex flex-col justify-center items-center px-2 '>
						<div className='font-manga text-purple-300 text-sm w-full text-center'>BONUSES</div>
						<h1 className='text-2xl font-manga text-white-300'>{bonusPts}</h1>
					</div>
					<h1 className='text-3xl font-manga text-yellow-300'>
						= {ptsEarned}
						<span className='font-manga text-lg'>{` `}PTS</span>
					</h1>
				</div>

				<div className='md:hidden flex flex-col w-fit h-full justify-center items-center text-center'>
					<h1 className='text-4xl font-manga text-end w-full text-yellow-300'>
						{ptsEarned}
						<span className='font-manga text-lg ml-1'>PTS</span>
					</h1>
				</div>
			</div>
			<div
				className={`w-full flex border-t-2 ${
					index % 2 === 0 ? 'border-dark' : 'border-darkAccent'
				}`}>
				<BonusesScroll
					playerScoreData={scoreData}
					index={index}
				/>
			</div>
		</div>
	);
};

const OutroComponent = ({ players, roundScoreData, roundIndex, roundMultiplier }) => {
	const [hasRoundScoreData, setHasRoundScoreData] = useState(false);
	const [sortedPlayerScores, setSortedPlayerScores] = useState([]);

	useEffect(() => {
		// Create an array of player scores sorted by ptsEarned
		const sortedScores = Object.entries(roundScoreData).sort((a, b) => {
			const ptsEarnedA = a[1]?.pts?.total || 0;
			const ptsEarnedB = b[1]?.pts?.total || 0;
			return ptsEarnedB - ptsEarnedA;
		});

		setSortedPlayerScores(sortedScores);
		setHasRoundScoreData(Object.keys(roundScoreData).length > 0);
	}, [roundScoreData]);

	return (
		<div className='relative flex flex-col w-full h-full justify-between items-center space-y-4'>
			<div className='bg-dark rounded-md p-2 space-y-2 border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center'>
				<div
					className={`border-b-2 border-darkAccent flex flex-col py-2 md:pt-4 w-full h-fit justify-center items-center`}>
					<h1
						data-text={`ROUND ${roundIndex + 1} SCOREBOARD`}
						className={`font-sunny z-10 text-purple-300 text-5xl md:text-6xl`}>
						ROUND {roundIndex + 1} SCOREBOARD
					</h1>
					<div className={`flex space-x-2 w-fit h-fit justify-center items-center`}>
						<h1
							data-text={`${roundMultiplier}x`}
							className='font-manga z-10 text-green-300 text-2xl'>
							{roundMultiplier}x
						</h1>
						<h1
							data-text={`VOTE MULTIPLIER`}
							className={`font-manga text-2xl leading-none text-white `}>
							VOTE MULTIPLIER
						</h1>
					</div>
				</div>
				<div className='bg-dark p-1 rounded-md w-full h-full flex flex-col space-y-4 '>
					{hasRoundScoreData ? (
						<AutoSizer>
							{({ height, width }) => (
								<List
									width={width}
									height={height}
									itemCount={players.length}
									itemSize={120}
									itemData={{
										roundMultiplier,
										players,
										sortedPlayerScores,
									}}>
									{PlayerListRow}
								</List>
							)}
						</AutoSizer>
					) : (
						<div className='flex w-full h-full justify-center items-center'>
							<h1
								data-text='LOADING...'
								className='text-4xl font-sunny text-purple-300'>
								LOADING...
							</h1>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default OutroComponent;
