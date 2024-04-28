import { getSocket } from '@/server/socketManager';
import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa6';

const CaptionVideoComponent = ({
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

	useEffect(() => {
		console.log('Round data updated:', JSON.stringify(roundData));
	}, [roundData]);

	return (
		<div className={`flex xl:flex-col items-center w-[80%] xl:w-[50%] h-full`}>
			<div
				className={`flex justify-center items-center aspect-[2/3] xl:h-fit w-full bg-white rounded-t-md`}>
				<h1
					data-text='VIDEO PLACEHOLDER'
					className={`font-sunny text-4xl text-dark`}>
					VIDEO PLACEHOLDER
				</h1>
			</div>

			{captionedThisRound ? (
				<div className='relative top-4 w-full flex justify-center'>
					<h1
						data-text='Waiting for others to caption...'
						className={`w-fit font-sunny text-4xl text-yellow-300`}>
						Waiting for others to caption...
					</h1>
				</div>
			) : (
				<div className={`flex w-full justify-between`}>
					<input
						type='text'
						value={currentCaption}
						maxLength={64}
						onChange={(e) => setCurrentCaption(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleCaptionSubmit(currentCaption);
							}
						}}
						placeholder='Enter caption...'
						className='outline-none font-manga text-white text-3xl text-center bg-darkAccent w-full h-[4rem] px-2 placeholder:text-white/50'
					/>
					<div
						onClick={() => handleCaptionSubmit(currentCaption)}
						className='bg-green-300 p-2 w-fit h-full flex items-center font-sunny text-3xl sm:hover:outline outline-2 cursor-pointer sm:hover:outline-white sm:active:scale-95'>
						<FaArrowRight
							size={24}
							className={`text-dark`}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default CaptionVideoComponent;
