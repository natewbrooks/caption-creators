const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 7);

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const server = createServer((req, res) => handle(req, res));

	const io = new Server(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});

	const lobbies = {}; // Maps lobby IDs to lobby details

	io.on('connection', (socket) => {
		console.log('User connected');

		socket.on('create_lobby', ({ hostUserToken }) => {
			const lobbyId = nanoid(); // Create a lobby ID with 7 digits (no underscores or hyphens), "~11 days or 266K IDs needed, in order to have a 1% probability of at least one collision." (https://zelark.github.io/nano-id-cc/)
			lobbies[lobbyId] = {
				hostUserToken: hostUserToken, // Store the userToken associated with the host in the lobby info
				members: [{ id: socket.id, name: 'Host', isHost: true, userToken: hostUserToken }],
			};
			socket.emit('lobby_created', { lobbyId, hostUserToken }); // Tell user client that the lobby was created
			socket.join(lobbyId); // Connect host websocket to lobby
			io.to(lobbyId).emit('update_lobby', {
				// Signal clients to rerender to properly reflect the player list
				members: lobbies[lobbyId].members,
				hostUserToken: hostUserToken,
			});
		});

		socket.on('join_lobby', ({ lobbyId, playerName, userToken }) => {
			const lobby = lobbies[lobbyId];

			if (lobby) {
				// If the player with the same userToken already exists in the lobby, do nothing (they refreshed the page)
				const existingPlayer = lobby.members.find((m) => m.userToken === userToken);
				if (existingPlayer) {
					console.log('Player already in lobby!');
					socket.emit('lobby_joined', { lobbyId });
					return;
				}

				// Otherwise, add the user to the lobby. Important to store socket id and userToken
				const isHost = userToken === lobby.hostUserToken;
				lobby.members.push({
					id: socket.id,
					name: playerName,
					isHost: isHost,
					userToken: userToken,
				});
				io.to(lobbyId).emit('update_lobby', {
					// Again update clients to reflect player list
					members: lobby.members,
					hostUserToken: lobby.hostUserToken,
				});
				socket.join(lobbyId);
				socket.emit('lobby_joined', { lobbyId }); // Send client a signal saying the lobby was successfully joined
			} else {
				socket.emit('error_joining', 'Lobby does not exist.'); // :(
			}
		});

		// When the user is changing their name
		socket.on('update_player_name', ({ lobbyId, userToken, playerName }) => {
			const lobby = lobbies[lobbyId];
			// If the lobby exists and there is a player that matches the one who wants to change their name
			if (lobby) {
				const member = lobby.members.find((m) => m.userToken === userToken);
				if (member && playerName) {
					member.name = playerName;
					io.to(lobbyId).emit('update_lobby', {
						// Tell all client to rerender player list
						members: lobby.members,
						hostUserToken: lobby.hostUserToken,
					});
				}
			}
		});

		// When the host initially joins the lobby, they need to fetch lobby info
		socket.on('fetch_lobby_details', ({ lobbyId }) => {
			const lobby = lobbies[lobbyId];
			if (lobby) {
				// Send lobby details to the client
				socket.emit('lobby_details', {
					members: lobby.members,
					hostUserToken: lobby.hostUserToken,
				});
			} else {
				socket.emit('error_fetching_lobby_details', 'Lobby does not exist.'); // :(
			}
		});

		socket.on('leave_lobby', () => {
			// When a user leaves the lobby, find and remove the disconnected user from their lobby
			for (const lobbyId in lobbies) {
				const lobby = lobbies[lobbyId];
				const index = lobby.members.findIndex((member) => member.id === socket.id);
				if (index !== -1) {
					const disconnectedMember = lobby.members.splice(index, 1)[0];

					// If the disconnected user was the host and there are still members in the lobby, select a new host
					if (disconnectedMember.isHost && lobby.members.length > 0) {
						// Select the first member in the lobby as the new host
						lobby.members[0].isHost = true;
						lobby.hostUserToken = lobby.members[0].userToken;
					}

					// Notify other members of the lobby about the updated member list
					io.to(lobbyId).emit('update_lobby', {
						members: lobby.members,
						hostUserToken: lobby.hostUserToken,
					});

					// If there are no members left in the lobby, delete the lobby
					if (lobby.members.length === 0) {
						console.log(`Lobby ${lobbyId} is now empty and will be deleted.`);
						delete lobbies[lobbyId];
					}
				}
			}
			console.log('User left the lobby');
		});

		socket.on('disconnect', () => {
			// When a user closes the tab, find and remove the disconnected user from their lobby
			for (const lobbyId in lobbies) {
				const lobby = lobbies[lobbyId];
				const index = lobby.members.findIndex((member) => member.id === socket.id);
				if (index !== -1) {
					const disconnectedMember = lobby.members.splice(index, 1)[0];

					// If the disconnected user was the host and there are still members in the lobby, select a new host
					if (disconnectedMember.isHost && lobby.members.length > 0) {
						// Select the first member in the lobby as the new host
						lobby.members[0].isHost = true;
						lobby.hostUserToken = lobby.members[0].userToken;
					}

					// Notify other members of the lobby about the updated member list
					io.to(lobbyId).emit('update_lobby', {
						members: lobby.members,
						hostUserToken: lobby.hostUserToken,
					});

					// If there are no members left in the lobby, delete the lobby
					if (lobby.members.length === 0) {
						console.log(`Lobby ${lobbyId} is now empty and will be deleted.`);
						delete lobbies[lobbyId];
					}
				}
			}
			console.log('User disconnected');
		});
	});

	server.listen(port, () => console.log(`> Ready on http://localhost:${port}`));
});
