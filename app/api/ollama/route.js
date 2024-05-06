import ollama from 'ollama';

export async function POST(req) {
	try {
		console.log('API Route Hit');
		const { prompt } = await req.json();
		console.log('Prompt:', prompt);

		const systemMessage = {
			role: 'system',
			content: `Your task is to provide a single, concise search term for YouTube Shorts that is catchy, popular, and funny. Do not include explanations, introductions, or multiple terms.`,
		};

		const userMessage = {
			role: 'user',
			content: `Generate a concise search term for the prompt: "${prompt}" . ONLY PRINT ONE STRING OF SEARCH TERMS.`,
		};

		// Make a request to Ollama using the chat method
		const response = await ollama.chat({
			model: 'llama2',
			messages: [systemMessage, userMessage],
			keep_alive: 90, // keep model connected for 90s
		});

		// Extract the message content from the response
		console.log('Ollama Response:', response);
		const message = response.message.content;

		return new Response(JSON.stringify({ message }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error with Ollama:', error);
		return new Response(JSON.stringify({ error: 'Failed to generate message' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
