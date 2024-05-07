import React from 'react';
import LobbyAvatarSelect from './LobbyAvatarSelect';

function LobbyInfoSelectModal({
	avatars,
	takenAvatars,
	userToken,
	players,
	playerName,
	setPlayerName,
	handlePlayerNameSubmit,
	handleAvatarSelect,
	setShowEntryPrompt,
	currentAvatar,
	currentUser,
	hostUserToken,
	error,
}) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (currentAvatar) {
					setShowEntryPrompt(false);
					handlePlayerNameSubmit();
				}
			}}
			className='flex flex-col items-center justify-between bg-dark outline outline-2 outline-darkAccent p-2 rounded-md w-full h-full'>
			<div className={`w-full`}>
				<div className='font-manga text-xl xl:text-3xl text-yellow-300 w-full text-start'>
					ENTER GAME NAME:
				</div>
				<input
					placeholder={
						currentUser?.displayName ||
						playerName ||
						(hostUserToken === userToken ? 'HOST' : 'ANONYMOUS')
					}
					className='font-manga w-full text-4xl md:text-5xl leading-none text-center bg-darkAccent rounded-md outline-none text-white cursor-pointer'
					maxLength={12}
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
				/>
			</div>

			<div className='flex justify-end xs:justify-between font-manga text-md md:text-xl text-white/20 w-full text-center pt-1'>
				<div className={`hidden sm:flex w-full space-x-1`}>
					<span>* YOU CAN CHANGE YOUR NAME IN THE LOBBY</span>
				</div>
				<span
					className={`flex text-nowrap ${
						playerName.length < 5
							? 'text-white'
							: playerName.length <= 8
							? 'text-yellow-300'
							: 'text-red-300'
					} manga w-fit h-fit`}>
					{playerName.length}/12
				</span>
			</div>
			<LobbyAvatarSelect
				avatars={avatars}
				takenAvatars={takenAvatars}
				userToken={userToken}
				players={players}
				handleAvatarSelect={handleAvatarSelect}
			/>
			{error && (
				<div className='bg-dark py-1 px-2 outline outline-2 outline-darkAccent rounded-md text-red-300 text-lg md:text-xl mt-4 font-manga'>
					ERROR: {error}
				</div>
			)}
			<button
				type='submit'
				className={`bg-dark z-20 p-2 md:p-4 w-full text-center font-sunny text-3xl xl:text-4xl ${
					currentAvatar
						? 'outline-green-300 sm:hover:outline-white sm:active:scale-95 cursor-pointer'
						: 'outline-red-300'
				} outline outline-2 rounded-md text-white outline-darkAccent `}>
				ENTER LOBBY
			</button>
		</form>
	);
}

export default LobbyInfoSelectModal;
