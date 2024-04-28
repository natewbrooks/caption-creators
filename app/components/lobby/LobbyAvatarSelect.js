import React from 'react';
import Image from 'next/image';
import AutoSizer from 'react-virtualized-auto-sizer';

function LobbyAvatarSelect({ avatars, takenAvatars, userToken, players, handleAvatarSelect }) {
	return (
		<div>
			<h1
				data-text='SELECT AVATAR'
				className='mt-4 mb-2 font-manga text-xl md:text-3xl text-yellow-300 cursor-pointer w-full text-end'>
				SELECT AVATAR:
			</h1>
			<div
				className={`max-h-[240px] sm:max-h-[260px] xl:max-h-[300px] 2xl:max-h-[400px] overflow-auto pb-4 grid grid-cols-3 md:grid-cols-4 gap-6 bg-none rounded-md`}>
				{avatars.map((src, index) => {
					const isTaken = takenAvatars[src];
					const isMine = takenAvatars[src] === userToken;
					return (
						<div
							key={index}
							className='relative flex justify-center items-center'>
							{isTaken && isMine ? (
								<div
									className={`absolute -bottom-[9px] bg-dark px-2 pt-1 rounded-md z-10 text-green-300 text-[1.25rem] leading-none font-manga`}>
									YOU
								</div>
							) : (
								<div
									className={`absolute -bottom-[9px] bg-dark px-2 pt-1 rounded-md z-10 text-red-300 text-[1.25rem] leading-none font-manga`}>
									{players.find((player) => player.userToken === takenAvatars[src])?.name || ''}
								</div>
							)}

							<div className='relative w-[72px] h-[72px] md:w-[84px] md:h-[84px]'>
								<Image
									src={src}
									onClick={() => {
										if (!isTaken) {
											handleAvatarSelect(src);
										}
									}}
									layout='responsive'
									width={100} // These width and height serve as aspect ratio
									height={100}
									className={`rounded-full outline-darkAccent outline-2 ${
										isTaken
											? 'opacity-40 select-none'
											: 'hover:outline-white active:scale-95 cursor-pointer'
									}`}
									alt={`${isTaken ? 'Taken' : ''} Avatar ${index + 1}`}
									unoptimized
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default LobbyAvatarSelect;
