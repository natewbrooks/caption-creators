import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req) {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				{
					role: 'system',
					content:
						'You are a helpful assistant who creates short, entertaining keyword or keyphrase prompts to search for a fun or interesting video. You may only use keyword or prompts with a maximum 30 characters long.',
				},
			],
		});

		const message = completion.choices[0].message.content.trim();
		console.log('MSG: ' + message);

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
