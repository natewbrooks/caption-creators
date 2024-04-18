import { getSocket } from '@/server/socketManager';
import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

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
		<>
			<div
				className={`flex justify-center items-center aspect-video w-full h-full sm:h-[25vh] md:h-[30vh] lg:h-[40vh] xl:h-[50vh] bg-white rounded-md p-2`}>
				<h1
					data-text='VIDEO PLACEHOLDER'
					className={`font-sunny text-4xl text-dark`}>
					VIDEO PLACEHOLDER
				</h1>
			</div>

			{captionedThisRound ? (
				<div className='relative top-4 w-full flex justify-center mt-2'>
					<h1
						data-text='Waiting for others to caption...'
						className={`w-fit font-sunny text-4xl text-yellow-300`}>
						Waiting for others to caption...
					</h1>
				</div>
			) : (
				<div>
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
						className='outline-none font-manga text-white text-xl text-center bg-darkAccent w-full h-[4rem] px-2 rounded-md placeholder:text-white/50'
					/>
					<div className={`w-full flex justify-center items-center mt-4`}>
						<div
							onClick={() => handleCaptionSubmit(currentCaption)}
							className='bg-dark p-2 rounded-md w-fit font-sunny text-2xl text-green-300 cursor-pointer outline outline-2 outline-green-300 sm:hover:outline-white sm:active:scale-95'>
							SUBMIT CAPTION
						</div>
					</div>
				</div>
			)}

			<div className='bg-dark/80 py-4 absolute bottom-0 left-0 flex justify-evenly w-full h-fit -z-[1] font-manga text-xl'>
				{players.map((player) => (
					<div
						key={player.userToken}
						className='flex flex-col justify-center items-center'>
						<div className={`flex space-x-2 items-center`}>
							<FaUserCircle
								size={18}
								className={`-translate-y-[0.15rem]`}
							/>
							<h1 className='font-manga text-2xl'>{player.name}</h1>
						</div>
						<div className='flex'>
							{roundData[currentRound]?.find(
								(p) => p.userToken === player.userToken && p.caption
							) && (
								<div className={`relative flex items-center space-x-1`}>
									<h1 className='font-sunny text-md text-green-300'>READY</h1>
									<FaCheck
										size={12}
										className='absolute -right-4 text-green-300'
									/>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</>
	);
};

export default CaptionVideoComponent;
