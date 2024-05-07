import React from 'react';
import Image from 'next/image';
import AutoSizer from 'react-virtualized-auto-sizer';

function LobbyAvatarSelect({ avatars, takenAvatars, userToken, players, handleAvatarSelect }) {
	return (
		<div className={`h-full w-full flex-grow`}>
			{' '}
			<h1
				data-text='SELECT AVATAR'
				className='mt-2 font-manga text-xl xl:text-3xl text-yellow-300 w-full text-end'>
				SELECT AVATAR:
			</h1>
			<div style={{ height: 'calc(100% - 64px)' }}>
				{' '}
				<AutoSizer>
					{({ height, width }) => {
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
													sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
													layout='fill'
													style={{ objectFit: 'cover' }}
													className={`rounded-full transform transition-colors duration-500 ease-in-out outline outline-2 ${
														isTaken
															? `opacity-40 ${
																	isMine ? 'outline-green-300' : 'outline-red-300'
															  } select-none`
															: 'lg:hover:outline-white outline-darkAccent active:scale-95 cursor-pointer'
													}`}
													alt={`${isTaken ? 'Taken' : ''} Avatar ${index + 1}`}
													priority={true}
												/>
												{isTaken && isMine ? (
													<div
														className={`absolute -bottom-[9px] flex justify-center w-full text-center text-green-300 text-[1.25rem] leading-none font-manga`}>
														<div className={`w-fit bg-dark px-2 pt-1 rounded-md z-10`}>YOU</div>
													</div>
												) : (
													<div
														className={`absolute -bottom-[9px] flex justify-center w-full text-center text-red-300 text-[1.25rem] leading-none font-manga`}>
														<div className={`w-fit bg-dark px-2 pt-1 rounded-md z-10`}>
															{players.find((player) => player.userToken === takenAvatars[src])
																?.name || ''}
														</div>
													</div>
												)}
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
