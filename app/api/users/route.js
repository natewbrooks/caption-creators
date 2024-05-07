import { query } from '../../../server/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
	try {
		// Parse the request body
		const { username, email } = await req.json();

		// Check for missing fields
		if (!username || !email) {
			return new Response(JSON.stringify({ error: 'Username and email are required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Check if the username already exists
		const userExists = await query(`SELECT 1 FROM users WHERE username = ?`, [username]);
		if (userExists.length > 0) {
			return new Response(JSON.stringify({ error: 'ERROR: Username already in use' }), {
				status: 409,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Check if the email already exists
		const emailExists = await query(`SELECT 1 FROM users WHERE email = ?`, [email]);
		if (emailExists.length > 0) {
			return new Response(JSON.stringify({ error: 'ERROR: Email already in use' }), {
				status: 409,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Create a new user
		const userToken = uuidv4();
		const result = await query(
			`INSERT INTO users (username, email, score, userToken) VALUES (?, ?, 0, ?)`,
			[username, email, userToken]
		);

		console.log('USER CREATED SUCCESSFULLY');
		// Return success response
		return new Response(
			JSON.stringify({
				message: 'User created successfully',
				id: result.insertId,
				userToken,
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Database error:', error);
		return new Response(JSON.stringify({ error: 'Database error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export async function GET(req) {
	const { username, email } = await req.json();

	// Check for the presence of either username or email
	if (!username && !email) {
		return new Response(JSON.stringify({ error: 'Username or email is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Construct the query based on what is provided
	let queryStr = `SELECT userToken FROM users WHERE `;
	let queryParams = [];

	if (username) {
		queryStr += `username = ?`;
		queryParams.push(username);
	} else if (email) {
		queryStr += `email = ?`;
		queryParams.push(email);
	}

	// Execute the query
	const results = await query(queryStr, queryParams);

	// Check if any userToken was found
	if (results.length === 0) {
		return new Response(JSON.stringify({ error: "User doesn't exist!" }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Return the found userToken
	return new Response(
		JSON.stringify({
			message: 'UserToken retrieved successfully',
			userToken: results[0].userToken,
		}),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
}

export async function PUT(req) {
	const { currentUsername, newUsername } = await req.json(); // Assume the request includes the current username and the new desired username

	if (!newUsername) {
		return new Response(JSON.stringify({ error: 'New username is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Check if the current user exists
	const currentUser = await query(`SELECT userToken FROM users WHERE username = ?`, [
		currentUsername,
	]);
	if (currentUser.length === 0) {
		return new Response(JSON.stringify({ error: "Current user doesn't exist!" }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Check if the new username is already in use
	const usernameTaken = await query(`SELECT 1 FROM users WHERE username = ?`, [newUsername]);
	if (usernameTaken.length > 0) {
		return new Response(JSON.stringify({ error: 'New username is already in use' }), {
			status: 409,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Update the username
	try {
		await query(`UPDATE users SET username = ? WHERE username = ?`, [newUsername, currentUsername]);
		return new Response(JSON.stringify({ message: 'Username updated successfully' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Database error:', error);
		return new Response(JSON.stringify({ error: 'Database error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
