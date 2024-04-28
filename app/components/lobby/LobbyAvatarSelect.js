import React from 'react';
import Image from 'next/image';
import AutoSizer from 'react-virtualized-auto-sizer';

function LobbyAvatarSelect({ avatars, takenAvatars, userToken, players, handleAvatarSelect }) {
	return (
		<div className={`h-full w-full flex-grow`}>
			{' '}
			<h1
				data-text='SELECT AVATAR'
				className='mt-2 font-manga text-xl xl:text-3xl text-yellow-300 cursor-pointer w-full text-end'>
				SELECT AVATAR:
			</h1>
			<div style={{ height: 'calc(100% - 64px)' }}>
				{' '}
				{/* Adjust this value to account for the header */}
				<AutoSizer>
					{({ height, width }) => {
						console.log('AutoSizer height:', height, 'width:', width); // Add this line for debugging
						return (
							<div
								style={{ height, width }}
								className='overflow-auto p-2 md:p-4 grid grid-cols-3 sm:grid-cols-4 gap-2 xs:gap-3 lg:gap-6 bg-none rounded-md'>
								{avatars.map((src, index) => {
									const isTaken = takenAvatars[src];
									const isMine = takenAvatars[src] === userToken;
									return (
										<div
											key={index}
											className='relative flex justify-center items-center'>
											{isTaken && isMine ? (
												<div
													className={`absolute  -bottom-[9px] bg-dark px-2 pt-1 rounded-md z-10 text-green-300 text-[1.25rem] leading-none font-manga`}>
													YOU
												</div>
											) : (
												<div
													className={`absolute -bottom-[9px] bg-dark px-2 pt-1 rounded-md z-10 text-red-300 text-[1.25rem] leading-none font-manga`}>
													{players.find((player) => player.userToken === takenAvatars[src])?.name ||
														''}
												</div>
											)}

											<div
												className='relative w-full'
												style={{ paddingTop: '100%' }}>
												{' '}
												{/* 1:1 Aspect Ratio */}
												<Image
													src={src}
													onClick={() => {
														if (!isTaken) {
															handleAvatarSelect(src);
														}
													}}
													layout='fill'
													objectFit='cover' // Adjust as needed
													className={`rounded-full outline outline-darkAccent outline-2 ${
														isTaken
															? 'opacity-40 select-none'
															: 'lg:hover:outline-white active:scale-95 cursor-pointer'
													}`}
													alt={`${isTaken ? 'Taken' : ''} Avatar ${index + 1}`}
													unoptimized
												/>
											</div>
										</div>
									);
								})}
							</div>
						);
					}}
				</AutoSizer>
			</div>
		</div>
	);
}

export default LobbyAvatarSelect;
