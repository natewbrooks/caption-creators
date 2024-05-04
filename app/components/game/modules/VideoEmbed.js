import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import getYouTubeId from 'get-youtube-id';
import AutoSizer from 'react-virtualized-auto-sizer';

const VideoEmbed = ({ url, handleVideoEnd }) => {
	const [videoId, setVideoId] = useState('');
	const [ended, setEnded] = useState(false);

	useEffect(() => {
		if (url) {
			const id = getYouTubeId(url);
			if (id) {
				setVideoId(id);
			}
		}
	}, [url]);

	return (
		<div
			style={{ flexGrow: 1, minHeight: 0 }}
			className='h-full w-full select-none'>
			{ended && <div className={`bg-green-300 p-4 rounded-md text-dark`}>ended!!</div>}
			{videoId ? (
				<AutoSizer>
					{({ height, width }) => (
						<YouTube
							videoId={videoId}
							opts={{
								height: height,
								width: width,
								playerVars: {
									autoplay: 1,
								},
							}}
							onPlay={() => setEnded(false)}
							onEnd={() => setEnded(true)}
						/>
					)}
				</AutoSizer>
			) : (
				<>
					<div className={`w-full h-full flex justify-center items-center`}>NO VIDEO ID</div>
				</>
			)}
		</div>
	);
};

export default VideoEmbed;
