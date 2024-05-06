import { FaCheck, FaHourglass } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { IoDice } from 'react-icons/io5';
import ConfirmationModal from '../modules/ConfirmationModal';
import { useSocket } from '@/app/contexts/socketContext';
import ActionAlertModal from '../modules/ActionAlertModal';

const PromptComponent = ({
	players,
	gameData,
	setGameData,
	lobbyId,
	gamePhaseTimer,
	setTimeLeftAtSubmit,
}) => {
	const [keyword, setKeyword] = useState('');
	const [showConfirmKeyword, setShowConfirmKeyword] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isFetchingVideo, setIsFetchingVideo] = useState(false);

	const { socket, userToken } = useSocket();

	const generateRandomKeyword = async () => {
		setIsGenerating(true);
		try {
			const response = await fetch(`/api/chatGPT/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (response.ok) {
				setKeyword(data.message);
			} else {
				throw new Error('Failed to fetch random keyword: ' + data.error);
			}
		} catch (error) {
			console.error('Error fetching random keyword:', error.message);
		}
		setIsGenerating(false);
	};

	// Let the server know you are actively fetching video and then get the video
	const fetchVideoForKeyword = async (keyword) => {
		setIsFetchingVideo(true); // Set fetching video state
		socket.emit('player_fetching_video', { lobbyId, userToken, prompt }); // Emit signal to server

		try {
			// Emit a socket signal to let the server know
			socket.emit('player_fetching_video', { lobbyId, userToken, prompt: keyword });

			// Call the server-side API to fetch the video
			const response = await fetch('/api/youtube', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: keyword }),
			});

			// Parse the JSON response
			if (response.ok) {
				const data = await response.json();
				setIsFetchingVideo(false); // Reset fetching video state
				return data.videoURL;
			} else {
				setIsFetchingVideo(false);
				throw new Error('Failed to fetch video');
			}
		} catch (error) {
			console.error('Error fetching video:', error);
			setIsFetchingVideo(false);
			return null;
		}
	};

	const handleSubmit = async () => {
		const videoURL = await fetchVideoForKeyword(keyword);
		setShowConfirmKeyword(false);
		setSubmitted(true);

		if (socket) {
			socket.emit('game_action', {
				lobbyId: lobbyId,
				userToken: userToken,
				isFinished: true,
				key: 'prompt',
				data: { prompt: keyword, videoURL: videoURL || '' },
			});
			setTimeLeftAtSubmit(gamePhaseTimer);
			console.log('TIME LEFT: ' + gamePhaseTimer);
		} else {
			console.error('Socket not available or not connected.');
		}
	};

	return (
		<>
			{showConfirmKeyword && (
				<ConfirmationModal
					onConfirm={() => {
						if (keyword.length > 0) {
							handleSubmit();
						}
					}}
					onCancel={() => {
						setShowConfirmKeyword(false);
					}}
					confirmText='CONFIRM'
					cancelText='CANCEL'
					message='You will not be able to change it after this point.'
					title='CONFIRM KEYWORD'
				/>
			)}

			{isFetchingVideo && (
				<ActionAlertModal
					header={`FETCHING A VIDEO`}
					subtext={`"${keyword.toUpperCase()}"`}
					bgColorClass={`bg-yellow-300`}
					Icon={FaHourglass}
				/>
			)}

			<div
				className={`flex flex-col w-full max-w-[600px] justify-center items-center h-fit border-2 border-darkAccent rounded-md bg-dark p-2`}>
				{submitted === false ? (
					<>
						<div className='font-manga text-xl md:text-2xl text-yellow-300 w-full text-start'>
							ENTER VIDEO KEYWORDS:
						</div>
						<input
							type='text'
							value={keyword}
							maxLength={24}
							onChange={(e) => setKeyword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && keyword.length > 0) {
									setShowConfirmKeyword(true);
								}
							}}
							placeholder='Enter keyword or phrase'
							className='outline-none font-manga text-white text-3xl text-center rounded-md bg-darkAccent w-full h-[4rem] px-2 placeholder:text-white/50'
						/>
						<div className={`flex flex-row w-full justify-between items-center mt-2 `}>
							<div
								onClick={() => {
									if (!isGenerating) {
										generateRandomKeyword();
									}
								}}
								className={`flex select-none space-x-2 items-center w-full text-start font-manga text-2xl whitespace-nowrap `}>
								<span className={`text-white/40`}>or</span>
								<div
									className={` flex space-x-2 select-none items-center justify-end ${
										isGenerating
											? ''
											: 'group cursor-pointer md:hover:underline underline-offset-4 '
									}`}>
									<span className={`text-green-300 `}>
										{isGenerating ? 'GENERATING...' : 'GENERATE RANDOM'}{' '}
									</span>
									<IoDice
										size={20}
										className={`select-none ${isGenerating ? 'animate-spin' : ''} `}
									/>
								</div>
							</div>
							<div
								className={`w-full text-end font-manga text-xl ${
									keyword.length < 25
										? ''
										: keyword.length < 30
										? 'text-yellow-300'
										: 'text-red-300'
								}`}>
								{keyword.length}/24
							</div>
						</div>

						<div
							onClick={() => {
								if (keyword.length > 0) {
									setShowConfirmKeyword(true);
								}
							}}
							className={`mt-4 bg-dark p-2 md:p-4 w-full text-center font-sunny text-3xl xl:text-4xl outline outline-2 ${
								keyword !== ''
									? 'outline-green-300 cursor-pointer sm:hover:outline-white sm:active:scale-95'
									: 'outline-red-300'
							} rounded-md text-white `}>
							SUBMIT
						</div>
					</>
				) : (
					<>
						<div className='font-manga text-xl md:text-2xl text-yellow-300 w-full text-start'>
							YOUR SUBMITTED KEYWORD / PHRASE:
						</div>
						<div
							placeholder='Enter keyword or phrase'
							className='outline-none items-center flex justify-center font-manga text-white text-3xl text-center rounded-md bg-darkAccent w-full h-[4rem] px-2 placeholder:text-white/50'>
							{keyword}
						</div>
						<div
							className={`w-full flex items-center justify-end text-end font-manga text-xl mt-2 ${
								keyword.length < 25 ? '' : keyword.length < 30 ? 'text-yellow-300' : 'text-red-300'
							}`}>
							<div className={`text-green-300 mr-1 pb-1`}>
								<FaCheck size={14} />
							</div>{' '}
							{keyword.length}/30
						</div>
					</>
				)}
			</div>
			{submitted && (
				<div className='full h-full w-full flex items-end justify-center'>
					<h1
						data-text='WAITING FOR OTHERS TO FINISH...
'
						className={`w-fit font-sunny text-2xl text-yellow-300`}>
						WAITING FOR OTHERS TO FINISH...
					</h1>
				</div>
			)}
		</>
	);
};

export default PromptComponent;
