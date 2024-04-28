import { getSocket } from '@/server/socketManager';
import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa6';
import { IoDice } from 'react-icons/io5';
import ConfirmationModal from './modules/ConfirmationModal';

const KeywordPromptComponent = ({
	players,
	currentRound,
	roundData,
	setRoundData,
	lobbyId,
	userToken,
}) => {
	const [keyword, setKeyword] = useState('');
	const [showConfirmKeyword, setShowConfirmKeyword] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// useEffect(() => {
	// 	const socketInstance = getSocket();

	// 	socketInstance.on('notify_players', ({ event, data }) => {
	// 		if (!data || !data.userToken) return;
	// 		const wasMyAction = data.userToken === userToken;

	// 		setRoundData((prev) => {
	// 			const newRoundData = { ...prev };
	// 			const playerEntries = newRoundData[1] || [];

	// 			const playerIndex = playerEntries.findIndex((p) => p.userToken === data.userToken);
	// 			if (playerIndex !== -1) {
	// 				if (event === 'prompt') {
	// 					playerEntries[playerIndex].caption = data.caption;
	// 					if (wasMyAction) setCaptionedThisRound(true);
	// 				}
	// 			}

	// 			return newRoundData;
	// 		});
	// 	});

	// 	socketInstance.on('round_change', (round) => {
	// 		setCaptionedThisRound(false);
	// 		setKeyword('');
	// 	});

	// 	return () => {
	// 		socketInstance.off('notify_players');
	// 		socketInstance.off('round_change');
	// 	};
	// }, [lobbyId]);

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

	const toggleRoll = () => {
		setIsRolling(true);
		// Reset animation by removing the class after the animation duration
		setTimeout(() => {
			setIsRolling(false);
		}, 1000); // Duration of the animation
	};

	return (
		<>
			{showConfirmKeyword && (
				<ConfirmationModal
					onConfirm={() => {
						setShowConfirmKeyword(false);
					}}
					onCancel={() => {
						setShowConfirmKeyword(false);
					}}
					confirmText='CONFIRM'
					cancelText='CANCEL'
					message='You will not be able to change it after this point.'
					title='CONFIRM KEYWORD / PHRASE'
				/>
			)}

			<div
				className={`flex flex-col w-full max-w-[600px] justify-center items-center h-fit border-2 border-darkAccent rounded-md bg-dark p-2`}>
				<div className='font-manga text-xl md:text-2xl text-yellow-300 w-full text-start'>
					ENTER SHORT KEYWORD / PHRASE:
				</div>
				<input
					type='text'
					value={keyword}
					maxLength={30}
					onChange={(e) => setKeyword(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
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
								isGenerating ? '' : 'group cursor-pointer md:hover:underline underline-offset-4 '
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
							keyword.length < 25 ? '' : keyword.length < 30 ? 'text-yellow-300' : 'text-red-300'
						}`}>
						{keyword.length}/30
					</div>
				</div>
				<div
					onClick={() => {
						if (keyword !== '') {
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
			</div>
		</>
	);
};

export default KeywordPromptComponent;
