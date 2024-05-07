import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Request to get a keyword prompt from chatGPT 3.5 via OpenAI API
export async function POST(req) {
	try {
		const completion = await openai.chat.completions.create({
			messages: [
				{
					// Feed the system a motive during init
					role: 'system',
					content:
						'Generate a short keyword or keyphrase prompt for searching videos on any topic. Keep it creative and fun, ensuring it does not exceed 30 characters. Do not use the previous responses to generate content, generate a unique topic each time.',
				},
			],
			model: 'gpt-3.5-turbo',
			max_tokens: 20,
		});

		// Pick the first message, remove double quotes and trim whitespacea
		const message = completion.choices[0].message.content.replace(/"/g, '').trim();

		if (message.length > 30) {
			return new Response(JSON.stringify({ error: 'Generated message is too long' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ message }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error with OpenAI Chat Completions:', error);
		return new Response(JSON.stringify({ error: 'Failed to generate message' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
