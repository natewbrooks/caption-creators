import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa6';
import { IoDice } from 'react-icons/io5';
import ConfirmationModal from './modules/ConfirmationModal';
import { useSocket } from '@/app/contexts/socketContext';

const PromptComponent = ({ players, currentRound, gameData, setGameData, lobbyId }) => {
	const [keyword, setKeyword] = useState('');
	const [showConfirmKeyword, setShowConfirmKeyword] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

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

	const handleSubmit = () => {
		setShowConfirmKeyword(false);
		setSubmitted(true);
		if (socket) {
			socket.emit('game_action', {
				lobbyId: lobbyId,
				userToken: userToken,
				isFinished: true,
				key: 'prompt',
				data: { prompt: keyword },
			});
		} else {
			console.error('Socket not available or not connected.');
		}
	};

	return (
		<>
			{showConfirmKeyword && (
				<ConfirmationModal
					onConfirm={() => {
						handleSubmit();
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
				{submitted === false ? (
					<>
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
						data-text='Waiting for others to finish...'
						className={`w-fit font-sunny text-3xl md:text-4xl text-yellow-300`}>
						Waiting for others to finish...
					</h1>
				</div>
			)}
		</>
	);
};

export default PromptComponent;
