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

export async function POST(req) {
	const { email, scoreToAdd } = req.body;

	if (!email || scoreToAdd == null) {
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

	try {
		// Update the user's score. Adds the provided score to the existing score
		const results = await query(
			`
            UPDATE users 
            SET score = score + ?
            WHERE email = ?
        `,
			[scoreToAdd, email]
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
		} else {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'User not found',
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
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

export async function updateLeaderboardScore(email, scoreToAdd) {
	if (!email || scoreToAdd == null) {
		throw new Error('Missing email or score');
	}

	try {
		// Update the user's score
		const results = await query(`UPDATE users SET score = score + ? WHERE email = ?`, [
			scoreToAdd,
			email,
		]);

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
