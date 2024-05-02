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
							title={`TITLE OF VIDEO`}
							frameBorder='0'
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
							referrerPolicy='strict-origin-when-cross-origin'
							allowFullScreen></iframe>
					</div>
				)}
			</AutoSizer>
		</div>
	);
};

export default VideoEmbed;
