import mysql from 'mysql2/promise';

const pool = mysql.createPool({
	host: 'localhost',
	user: 'leaderboard_user',
	password: 'pass@123',
	database: 'leaderboard',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
});

export const query = async (query, parameters) => {
	try {
		const [results, fields] = await pool.query(query, parameters);
		return results;
	} catch (error) {
		throw error;
	}
};
