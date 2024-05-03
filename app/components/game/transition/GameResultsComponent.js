import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

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
	const { socket, userToken } = useSocket();
	const finalScores = gameData.finalScores || [];

	return (
		<>
			<div className={`relative flex flex-col w-full h-full justify-center items-center `}>
				<div
					className={`bg-dark rounded-md p-1  border-2 border-darkAccent justify-between flex h-full w-full flex-col items-center `}>
					<div className={`w-full h-full flex justify-center items-center`}>
						<h1
							data-text={'GAME END'}
							className={`font-manga z-10 text-purple-300 text-2xl`}>
							GAME END
						</h1>
					</div>

					<div
						className={`flex flex-col w-full h-fit p-4 text-xl bg-darkAccent border-2 border-dark rounded-md`}>
						<h2 className={`font-manga text-yellow-300 text-3xl mb-4`}>Final Scores</h2>
						{finalScores.length === 0 ? (
							<p className={`text-yellow-300`}>No scores available.</p>
						) : (
							<ul>
								{finalScores.map((score, index) => {
									const player = players.find((p) => p.userToken === score.userToken);
									return (
										<li
											key={index}
											className={`flex justify-between mb-2 text-yellow-300`}>
											<span>{player ? player.name : score.userToken}</span>
											<span>{score.totalPoints} Points</span>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{hostUserToken === userToken ? (
						<div
							className={`flex flex-col justify-center w-full h-fit py-4 text-3xl bg-darkAccent border-2 border-dark rounded-md`}>
							<h1
								data-text={`START NEW GAME`}
								className={`font-manga text-yellow-300 `}>
								START NEW GAME
							</h1>
							<h1
								data-text={`BRING PARTY TO LOBBY`}
								className={`font-manga text-yellow-300 `}>
								BRING PARTY TO LOBBY
							</h1>
							<h1
								data-text={`EXIT PARTY (REASSIGN HOST)`}
								className={`font-manga text-yellow-300 `}>
								EXIT PARTY (REASSIGN HOST)
							</h1>
						</div>
					) : (
						<div
							className={`flex flex-col justify-center w-full h-fit py-4 text-3xl bg-darkAccent border-2 border-dark rounded-md`}>
							<h1
								data-text={`EXIT PARTY`}
								className={`font-manga text-yellow-300 `}>
								EXIT PARTY
							</h1>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default GameResultsComponent;
