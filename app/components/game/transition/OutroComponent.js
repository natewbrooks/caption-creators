import { useState, useEffect } from 'react';
import BonusesScroll from '../modules/BonusesScroll';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Image from 'next/image';
import { FaUserCircle } from 'react-icons/fa';

const PlayerListRow = ({ index, style, data }) => {
	const { roundMultiplier, players, roundScoreData } = data;
	const userToken = Object.keys(roundScoreData)[index];
	const scoreData = roundScoreData[userToken];
	const player = players.find((p) => p.userToken === userToken) || { name: 'Unknown' };

	const totalPoints = scoreData.pointsEarned;
	const votePoints = scoreData.votePointsEarned || 0;
	const bonusPoints = scoreData.bonusPointsEarned || 0;

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
					<h2 className='text-4xl text-white font-manga'>{player.name}</h2>
				</div>
				<div className='hidden md:flex w-fit h-full space-x-4 justify-center items-center text-center'>
					<div className='flex flex-col justify-center items-center space-y-1'>
						<div className='font-manga text-yellow-300 text-md w-full text-center'>VOTE POINTS</div>
						<h1
							data-text={`${votePoints}`}
							className='text-3xl font-manga text-white-300'>
							{votePoints}
						</h1>
					</div>

					<div className='flex flex-col justify-center items-center px-2 space-y-1'>
						<div className='font-manga text-yellow-300 text-md w-full text-center'>BONUSES</div>
						<h1
							data-text={`${bonusPoints}`}
							className='text-3xl font-manga text-white-300'>
							{bonusPoints}
						</h1>
					</div>
					<h1
						data-text={`Total Points`}
						className='text-3xl font-manga text-yellow-300'>
						= {totalPoints}
						<span className='font-manga text-lg'>{` `}PTS</span>
					</h1>
				</div>

				<div className='md:hidden flex flex-col w-fit h-full justify-center items-center text-center'>
					<h1
						data-text={`Total Points`}
						className='text-4xl font-manga text-end w-full text-yellow-300'>
						{totalPoints}
						<span className='font-manga text-lg'>PTS</span>
					</h1>
				</div>
			</div>
			<div className='w-full flex border-t-2 border-darkAccent'>
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

	useEffect(() => {
		setHasRoundScoreData(Object.keys(roundScoreData).length > 0);
	}, [roundScoreData]);

	return (
		<div className='relative flex flex-col w-full h-full justify-between items-center space-y-4'>
			<div className='bg-dark rounded-md p-2 space-y-2 border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center'>
				<div className={`flex flex-col py-2 md:pt-4 w-full h-fit justify-center items-center`}>
					<h1
						data-text={`ROUND ${roundIndex + 1} RECAP`}
						className={`font-sunny z-10 text-yellow-300 text-5xl md:text-6xl`}>
						ROUND {roundIndex + 1} SCORE RECAP
					</h1>
					<div className={`flex space-x-2 w-fit h-fit justify-center items-center`}>
						<div className='p-1 bg-purple-300 aspect-square rounded-full w-[2.5rem] h-fit flex justify-center items-center flex-col'>
							<h1
								data-text={`${roundMultiplier}x`}
								className='font-sunny z-10 text-yellow-300 text-2xl'>
								{roundMultiplier}x
							</h1>
						</div>
						<h1
							data-text={`SCORE MULTIPLIER`}
							className={`font-sunny text-3xl leading-none text-white `}>
							ROUND MULTIPLIER
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
									itemCount={Object.keys(roundScoreData).length}
									itemSize={120} // Adjust item height as necessary
									itemData={{
										roundMultiplier,
										players,
										roundScoreData,
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
