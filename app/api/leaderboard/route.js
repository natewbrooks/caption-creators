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

	// const { email, score } = await req.body;
	// console.log(JSON.stringify(req.body));
	// console.log('REQ: ' + JSON.stringify(req.json()));

	// console.log('EMAIL: ', email, ' SCORE: ', score);
	// if (!email || score == null) {
	// 	return new Response(
	// 		JSON.stringify({
	// 			success: false,
	// 			error: 'Missing email or score',
	// 		}),
	// 		{
	// 			status: 400,
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 			},
	// 		}
	// 	);
	// }

	// try {
	// 	const results = await query(
	// 		`
	//         UPDATE users
	//         SET score = score + ?
	//         WHERE email = ?
	//     `,
	// 		[score, email]
	// 	);

	// 	// Check if the update was successful
	// 	if (results.affectedRows > 0) {
	// 		return new Response(
	// 			JSON.stringify({
	// 				success: true,
	// 				message: 'Score updated successfully',
	// 			}),
	// 			{
	// 				status: 200,
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 				},
	// 			}
	// 		);
	// 	} else {
	// 		return new Response(
	// 			JSON.stringify({
	// 				success: false,
	// 				error: 'User not found',
	// 			}),
	// 			{
	// 				status: 404,
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 				},
	// 			}
	// 		);
	// 	}
	// } catch (error) {
	// 	console.error('Database error:', error);
	// 	return new Response(
	// 		JSON.stringify({
	// 			success: false,
	// 			error: 'Database error',
	// 		}),
	// 		{
	// 			status: 500,
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 			},
	// 		}
	// 	);
	// }
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
