import { google } from 'googleapis';
import https from 'https';

const agent = new https.Agent({
	keepAlive: true,
	maxSockets: 50,
	maxFreeSockets: 10,
	keepAliveMsecs: 300000, // 5 minutes keep-alive
});

// Helper function
// Attempts to find a YouTube Short (<= 60s)
async function searchForShortVideo(prompt) {
	const youtube = google.youtube({
		version: 'v3',
		auth: process.env.YOUTUBE_API_KEY,
		http: {
			agent,
		},
	});

	// Search for videos using the prompt
	const response = await youtube.search.list({
		q: prompt,
		part: 'snippet',
		maxResults: 10,
		type: 'video',
		videoDuration: 'short',
		videoEmbeddable: 'true',
		videoSyndicated: 'true',
	});

	if (!response.data.items || response.data.items.length === 0) {
		throw new Error('No videos found for the prompt');
	}

	// List of video the video id's returned based off the search
	const videoIds = response.data.items.map((item) => item.id.videoId).join(',');
	const detailsResponse = await youtube.videos.list({
		id: videoIds,
		part: 'contentDetails,snippet',
	});

	// Get rid of the items that are > 60s
	const filteredItems = detailsResponse.data.items.filter((item) => {
		const duration = item.contentDetails.duration;
		const match = duration.match(/PT(?:(\d+)M)?(\d+)S/);
		const minutes = match && match[1] ? parseInt(match[1], 10) : 0;
		const seconds = match && match[2] ? parseInt(match[2], 10) : 0;
		return minutes * 60 + seconds <= 60;
	});

	if (filteredItems.length === 0) {
		console.log('No videos under 60 seconds found');
		let randomIndex = Math.floor(Math.random() * filteredItems.length);
		return filteredItems[randomIndex];
	}

	// Send a random index of the videos under 60s
	const randomIndex = Math.floor(Math.random() * filteredItems.length);
	const selectedVideo = filteredItems[randomIndex];
	return {
		videoURL: `https://www.youtube.com/watch?v=${selectedVideo.id}`,
		title: selectedVideo.snippet.title,
	};
}

// Request to fetch a YouTube video based off the provided prompt
export async function POST(req) {
	try {
		const { prompt } = await req.json();
		const result = await searchForShortVideo(prompt);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error with YouTube API:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
