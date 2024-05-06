import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import getYouTubeId from 'get-youtube-id';
import AutoSizer from 'react-virtualized-auto-sizer';

const VideoEmbed = ({ url, handleVideoEnd }) => {
	const [videoId, setVideoId] = useState('');
	const [ended, setEnded] = useState(false);
	const [skipTimer, setSkipTimer] = useState(5);

	useEffect(() => {
		if (url) {
			const id = getYouTubeId(url);
			if (videoId === id || !id) {
				setEnded(true);
				handleOnEnd();
				return;
			}

			setVideoId(id);
			setEnded(false);
		}
	}, [url]);

	useEffect(() => {
		let interval;

		// Create the interval if skipTimer is set and videoId is not available
		if (skipTimer && !videoId) {
			interval = setInterval(() => {
				// Decrease skipTimer by 1 every second until it reaches 0
				if (skipTimer > 0) {
					setSkipTimer((prevSkipTimer) => prevSkipTimer - 1);
				} else {
					// Reset skipTimer to 0 and clear the interval when it reaches 0
					setSkipTimer(0);
					clearInterval(interval);
				}
			}, 1000);
		}

		if (skipTimer === 3) {
			handleOnEnd(); // Give up after 3 attempts
		}

		// Clean up function to clear the interval when the component unmounts
		return () => clearInterval(interval);
	}, [skipTimer, videoId, skipTimer]);

	// useEffect(() => {
	// 	if ((retryTimer === 0 && !ended) || (error && retryCount < 3)) {
	// 		if (retryCount < 3) {
	// 			setVideoId(getYouTubeId(url)); // Retry fetching the video
	// 			setRetryCount((prevCount) => prevCount + 1);
	// 			setRetryTimer(5); // Reset retry timer
	// 			setError(false); // Reset error state
	// 		}
	// 	}
	// }, [retryTimer]);

	const handleOnEnd = () => {
		if (handleVideoEnd) {
			handleVideoEnd();
		}
	};

	return (
		<div
			style={{ flexGrow: 1, minHeight: 0 }}
			className='h-full w-full select-none'>
			{/* {error && (
				<div className={`w-full h-full flex flex-col justify-center items-center`}>
					<h1 className={`text-3xl font-manga text-red-300`}>
						{`ERROR FETCHING VIDEO. ${
							retryCount < 3 ? `TRYING AGAIN IN ${retryTimer}x...` : 'TAILED AFTER 3 ATTEMPTS.'
						}`}
					</h1>
					{retryCount < 3 && (
						<h2 className={`text-xl font-manga text-red-300`}>{retryCount + 1} / 3 ATTEMPTS</h2>
					)}
				</div>
			)} */}
			{!videoId && (
				<div className={`w-full h-full flex flex-col justify-center items-center`}>
					<h1
						data-text={`
						NO VIDEO ID. SKIPPING IN ${skipTimer}s
					`}
						className={`text-3xl font-manga text-red-300`}>
						NO VIDEO ID. SKIPPING IN {skipTimer}s
					</h1>
				</div>
			)}
			{videoId && (
				<AutoSizer>
					{({ height, width }) => (
						<div
							style={{ height, width }}
							className={`flex bg-dark rounded-t-md outline outline-2 outline-darkAccent `}>
							<YouTube
								videoId={videoId}
								opts={{
									height: height,
									width: width,
									playerVars: {
										autoplay: 1,
									},
								}}
								onEnd={() => {
									setEnded(true);
									handleOnEnd();
								}}
								// onError={() => {
								// 	setError(true);
								// }}
							/>
						</div>
					)}
				</AutoSizer>
			)}
		</div>
	);
};

export default VideoEmbed;
