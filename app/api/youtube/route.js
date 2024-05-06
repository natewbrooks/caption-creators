import { google } from 'googleapis';
import NodeCache from 'node-cache';
import https from 'https';

// Memory cache with a TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

const agent = new https.Agent({
	keepAlive: true,
	maxSockets: 50,
	maxFreeSockets: 10,
	keepAliveMsecs: 300000, // 5 minutes keep-alive
});

async function searchForShortVideo(prompt) {
	const youtube = google.youtube({
		version: 'v3',
		auth: 'AIzaSyBOHrzZElMNSrPGJEFYsvViQofMKqyc-48',
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

	const videoIds = response.data.items.map((item) => item.id.videoId).join(',');
	const detailsResponse = await youtube.videos.list({
		id: videoIds,
		part: 'contentDetails,snippet',
	});

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

	const randomIndex = Math.floor(Math.random() * filteredItems.length);
	const selectedVideo = filteredItems[randomIndex];
	return {
		videoURL: `https://www.youtube.com/watch?v=${selectedVideo.id}`,
		title: selectedVideo.snippet.title,
	};
}

export async function POST(req) {
	try {
		const { prompt } = await req.json();
		const cachedVideo = cache.get(prompt);

		if (cachedVideo) {
			console.log('Returning cached result for prompt:', prompt);
			return new Response(JSON.stringify(cachedVideo), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const result = await searchForShortVideo(prompt);
		cache.set(prompt, result);

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
