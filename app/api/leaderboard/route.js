import { query } from '../../../server/database';

export async function GET(req) {
	try {
		const results = await query(`SELECT username, score FROM users ORDER BY score DESC LIMIT 1000`);
		return new Response(
			JSON.stringify({
				success: true,
				data: results,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Database error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Database error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
