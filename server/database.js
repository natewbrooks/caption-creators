import mysql from 'mysql2';

const pool = mysql.createPool({
	host: 'localhost',
	user: 'user',
	password: 'password',
	database: 'leaderboard',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export const query = async (query, parameters) => {
	return new Promise((resolve, reject) => {
		pool.query(query, parameters, (error, results) => {
			if (error) return reject(error);
			resolve(results);
		});
	});
};
