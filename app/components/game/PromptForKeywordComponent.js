import { getSocket } from '@/server/socketManager';
import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa6';
import { IoDice } from 'react-icons/io5';

const PromptForKeywordComponent = ({
	players,
	currentRound,
	captionedThisRound,
	setCaptionedThisRound,
	roundData,
	setRoundData,
	lobbyId,
	userToken,
	handleCaptionSubmit,
}) => {
	const [currentCaption, setCurrentCaption] = useState('');

	useEffect(() => {
		const socketInstance = getSocket();

		socketInstance.on('notify_players', ({ event, data }) => {
			if (!data || !data.userToken) return;
			const wasMyAction = data.userToken === userToken;

			setRoundData((prev) => {
				const newRoundData = { ...prev };
				const playerEntries = newRoundData[1] || [];

				const playerIndex = playerEntries.findIndex((p) => p.userToken === data.userToken);
				if (playerIndex !== -1) {
					if (event === 'caption_submitted') {
						playerEntries[playerIndex].caption = data.caption;
						if (wasMyAction) setCaptionedThisRound(true);
					}
				}

				return newRoundData;
			});
		});

		socketInstance.on('round_change', (round) => {
			setCaptionedThisRound(false);
			setCurrentCaption('');
		});

		return () => {
			socketInstance.off('notify_players');
			socketInstance.off('round_change');
		};
	}, [lobbyId]);

	const generateRandomKeyword = async () => {
		try {
			const response = await fetch(`/api/chatGPT/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (response.ok) {
				setCurrentCaption(data.message);
			} else {
				throw new Error('Failed to fetch random keyword: ' + data.error);
			}
		} catch (error) {
			console.error('Error fetching random keyword:', error.message);
		}
	};

	return (
		<div
			className={`flex flex-col w-full max-w-[600px] justify-center items-center h-fit outline outline-2 outline-darkAccent rounded-md bg-dark p-2`}>
			<div className='font-manga text-xl md:text-2xl text-yellow-300 w-full text-start'>
				ENTER SHORT KEYWORD / PHRASE:
			</div>
			<input
				type='text'
				value={currentCaption}
				maxLength={30}
				onChange={(e) => setCurrentCaption(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						handleCaptionSubmit(currentCaption);
					}
				}}
				placeholder='Enter keyword or phrase'
				className='outline-none font-manga text-white text-3xl text-center rounded-md bg-darkAccent w-full h-[4rem] px-2 placeholder:text-white/50'
			/>
			<div className={`flex flex-row w-full justify-between items-center mt-2 `}>
				<div
					onClick={() => generateRandomKeyword()}
					className={`flex select-none space-x-2 items-center w-full text-start font-manga text-2xl whitespace-nowrap `}>
					<span className={`text-white/40`}>or</span>
					<div
						className={`group flex space-x-2 select-none items-center justify-end cursor-pointer md:hover:underline underline-offset-4 `}>
						<span className={`text-green-300 group-active:scale-95`}>GENERATE RANDOM</span>
						<IoDice
							size={20}
							className={`-translate-y-1 select-none group-active:rotate-[270deg] group-active:scale-[95%] scale-[110%] transition-all duration-500`}
						/>
					</div>
				</div>
				<div
					className={`w-full text-end font-manga text-xl ${
						currentCaption.length < 25
							? ''
							: currentCaption.length < 30
							? 'text-yellow-300'
							: 'text-red-300'
					}`}>
					{currentCaption.length}/30
				</div>
			</div>
			<div
				className={`mt-4 bg-dark p-2 md:p-4 w-full text-center font-sunny text-4xl xl:text-5xl outline outline-2 ${
					currentCaption !== ''
						? 'outline-green-300 cursor-pointer sm:hover:outline-white sm:active:scale-95'
						: 'outline-red-300'
				} rounded-md text-white `}>
				SUBMIT CAPTION
			</div>
		</div>
	);
};

export default PromptForKeywordComponent;
