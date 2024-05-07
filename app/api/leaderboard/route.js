import { query } from '../../../server/database';

// Query the users database to get the highest 1000 scores in descending order
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

// Request to update a users score (after game end)
export async function PUT(req) {
	try {
		const { email, score } = await req.json();

		if (!email || score == null) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Missing email or score',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}

		const results = await query(
			`
	        UPDATE users
	        SET score = score + ?
	        WHERE email = ?
	    `,
			[score, email]
		);

		// Check if the update was successful
		if (results.affectedRows > 0) {
			return new Response(
				JSON.stringify({
					success: true,
					message: 'Score updated successfully',
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}

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

// Convienent export function (used in server)
export async function updateLeaderboardScore(email, scoreToAdd) {
	if (!email || scoreToAdd == null) {
		throw new Error('Missing email or score');
	}

	try {
		// Try to update the user's score
		const results = await query(`UPDATE users SET score = score + ? WHERE email = ?`, [
			scoreToAdd,
			email,
		]);

		// If successfulluy updated score of user
		if (results.affectedRows > 0) {
			return { success: true, message: 'Score updated successfully' };
		} else {
			return { success: false, error: 'User not found' };
		}
	} catch (error) {
		console.error('Database error:', error);
		return { success: false, error: 'Database error' };
	}
}
