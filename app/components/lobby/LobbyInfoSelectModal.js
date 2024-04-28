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
			className='flex flex-col items-center justify-between bg-dark outline outline-2 outline-darkAccent p-2 md:p-4 rounded-md w-full md:w-fit h-full md:h-fit'>
			<div className={`w-full`}>
				<div className='font-manga text-xl xxl:text-3xl text-yellow-300 w-full text-start'>
					ENTER GAME NAME:
				</div>
				<input
					placeholder={
						currentUser?.displayName ||
						playerName ||
						(hostUserToken === userToken ? 'HOST' : 'ANONYMOUS')
					}
					className='font-sunny w-full text-4xl xxl:text-5xl leading-none text-center bg-darkAccent rounded-md outline-none text-white cursor-pointer'
					maxLength={12}
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
				/>
			</div>

			<div className='hidden md:flex justify-center font-manga text-xl text-white/20 w-full text-center'>
				* YOU CAN CHANGE YOUR NAME AT ANY POINT IN THE LOBBY *
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
				className={`bg-dark p-2 md:p-4 w-full text-center font-sunny text-4xl md:text-5xl  cursor-pointer ${
					currentAvatar ? 'outline-green-300' : 'outline-red-300'
				} outline outline-2 rounded-md text-white outline-darkAccent sm:hover:outline-white sm:active:scale-95`}>
				ENTER LOBBY
			</button>
		</form>
	);
}

export default LobbyInfoSelectModal;
