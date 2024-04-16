import { query } from '../../../server/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
	switch (req.method) {
		case 'POST': // Create a new user
			const { username } = req.body;
			if (!username) {
				return res.status(400).json({ error: 'Username is required' });
			}
			try {
				const userToken = uuidv4();
				const result = await query(
					`INSERT INTO users (username, score, userToken) VALUES (?, 0, ?)`,
					[username, userToken]
				);
				res
					.status(201)
					.json({ message: 'User created successfully', id: result.insertId, userToken });
			} catch (error) {
				res.status(500).json({ error: 'Database error: ' + error.message });
			}
			break;

		case 'PUT':
			// Update an existing user
			break;
		default:
			res.setHeader('Allow', ['POST', 'PUT']);
			res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}
