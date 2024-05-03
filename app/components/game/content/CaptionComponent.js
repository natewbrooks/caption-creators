import { FaCheck } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa6';
import AutoSizer from 'react-virtualized-auto-sizer';
import ConfirmationModal from '../modules/ConfirmationModal';
import VideoEmbed from '../modules/VideoEmbed';
import { useSocket } from '@/app/contexts/socketContext';

const CaptionComponent = ({
	players,
	roundIndex,
	phaseIndex,
	captionedThisRound,
	setCaptionedThisRound,
	gameData,
	roundData,
	phaseData,
	gamePhaseTimer,
	setTimeLeftAtSubmit,
	lobbyId,
	currentVideoDisplayed,
	setCurrentVideoDisplayed,
}) => {
	const [currentCaption, setCurrentCaption] = useState('');
	const [showConfirmCaption, setShowConfirmCaption] = useState(false);
	const [confirmedCaption, setConfirmedCaption] = useState(false);

	const { socket, userToken } = useSocket();

	useEffect(() => {
		if (gameData.rounds && gameData.rounds[roundIndex - 1]) {
			const videoAssignment = gameData.rounds[roundIndex - 1].videoAssignments.find(
				(assignment) => assignment.userToken === userToken // corrected to use userToken
			);
			if (videoAssignment && videoAssignment.video) {
				setCurrentVideoDisplayed(videoAssignment.video);
			}
		}

		socket.on('phase_end', ({}) => {});

		return () => {
			socket.off('phase_end');
		};
	}, [roundIndex, gameData, userToken]);

	const handleCaptionSubmit = () => {
		if (socket) {
			socket.emit('game_action', {
				lobbyId: lobbyId,
				userToken: userToken,
				isFinished: true,
				key: 'caption',
				data: { caption: currentCaption },
			});
			setConfirmedCaption(true);
			setShowConfirmCaption(false);
			setTimeLeftAtSubmit(gamePhaseTimer);
			console.log('TIME LEFT: ' + gamePhaseTimer);
		} else {
			console.error('Socket not available');
		}
	};

	return (
		<>
			{showConfirmCaption && (
				<ConfirmationModal
					onConfirm={() => {
						if (currentCaption.length > 0) {
							handleCaptionSubmit();
						}
					}}
					onCancel={() => {
						setShowConfirmCaption(false);
					}}
					confirmText='CONFIRM'
					cancelText='CANCEL'
					message='You will not be able to change it after this point.'
					title='CONFIRM CAPTION'
				/>
			)}
			<div className={`relative flex flex-col w-full h-full justify-between `}>
				<VideoEmbed embedURL={currentVideoDisplayed} />

				{confirmedCaption ? (
					<div className='relative top-1 w-full flex justify-center'>
						<h1
							data-text='Waiting for others to caption...'
							className={`w-fit font-sunny text-3xl md:text-4xl text-yellow-300`}>
							Waiting for others to caption...
						</h1>
					</div>
				) : (
					<div className={`flex z-20 bg-dark h-fit w-full`}>
						<input
							type='text'
							value={currentCaption}
							maxLength={64}
							onChange={(e) => setCurrentCaption(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && currentCaption.length > 0) {
									setShowConfirmCaption(true);
								}
							}}
							placeholder='Enter caption for this video...'
							className='border-l-2 border-y-2 border-dark focus:outline-none  font-manga text-white text-3xl text-center bg-darkAccent w-full p-2 md:p-3 placeholder:text-white/50'
						/>
						<div
							onClick={() => {
								if (currentCaption.length > 0) {
									setShowConfirmCaption(true);
								}
							}}
							className={`bg-dark-300 rounded-l-md ${
								currentCaption !== ''
									? 'border-green-300 sm:hover:border-white sm:active:scale-95'
									: 'border-red-300 text-white-300'
							} p-2 w-fit h-full flex items-center font-sunny text-3xl border-y-2 border-x-2 cursor-pointer `}>
							<FaArrowRight
								size={24}
								className={``}
							/>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default CaptionComponent;
