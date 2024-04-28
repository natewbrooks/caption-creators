import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

const VideoEmbed = ({ embedURL }) => {
	return (
		<div
			style={{ flexGrow: 1, minHeight: 0 }}
			className='h-full w-full'>
			<AutoSizer>
				{({ height, width }) => (
					<div
						style={{ height, width }}
						className={`flex justify-center items-center aspect-[2/3] bg-darkAccent border-2 border-t-[6px] border-dark`}>
						<iframe
							height={height}
							width={width}
							src={embedURL}
							title='Inside the mind of a Netplay Falco #shorts #smashbros #ssbm #turndownforwalt #tdfw'
							frameborder='0'
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
							referrerpolicy='strict-origin-when-cross-origin'
							allowfullscreen></iframe>
					</div>
				)}
			</AutoSizer>
		</div>
	);
};

export default VideoEmbed;
