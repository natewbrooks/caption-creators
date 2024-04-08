const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { customAlphabet } = require('nanoid');
const { join } = require('path');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // No hyphens or underscores (default has them)
const nanoid = customAlphabet(alphabet, 4);

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const lobbies = {}; // Maps lobby IDs to lobby details
const disconnectQueue = []; // Add users to this list before disconnecting them so they have time to restore their session.
const activeGames = {};

const GameManager = require('./gameManager');

app.prepare().then(() => {
	const server = createServer((req, res) => handle(req, res));

	const io = new Server(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});

	io.on('connection', (socket) => {
		console.log('New user connected to server');

		socket.on('create_lobby', (data) => createLobby(socket, data, io));
		socket.on('join_lobby', (data) => joinLobby(socket, data, io));
		socket.on('update_player_name', (data) =>
			updatePlayerName(data.lobbyId, data.userToken, data.playerName, io)
		);
		socket.on('fetch_lobby_details', (data) => fetchLobbyDetails(socket, data, io));
		socket.on('leave_lobby', () => leaveLobby(socket, io));

		socket.on('reload', (userToken) => {
			// On reload add the player to disconnect queue to make them eligible for disconnect
			disconnectQueue.push(userToken);
		});

		socket.on('disconnect', () => {
			// Get the disconnecting user's userToken before the socketId changes
			const disconnectingUser = findUserToken(socket.id);
			// If there was a page reload, the disconnecting user would have been added to the disconnect queue.
			if (disconnectingUser && disconnectQueue.includes(disconnectingUser)) {
				console.log('Start timeout for session');
				// Emit to all clients in the lobby that the disconnect timer has started for this user
				let lobbyId = findLobbyId(disconnectingUser);
				if (lobbyId) {
					io.to(lobbyId).emit('disconnectTimerStarted', {
						userToken: disconnectingUser,
						duration: 10,
					});
				}

				setTimeout(() => {
					// If the user has reconnected before the timeout finishes, then it won't trigger a disconnect
					if (!disconnectQueue.includes(disconnectingUser)) {
						console.log(disconnectingUser + ' user session restored!');
					} else {
						leaveLobby(socket, io);
						if (lobbyId) {
							io.to(lobbyId).emit('disconnectTimerEnded', disconnectingUser);
						}
					}
				}, 10000); // Adjust the timeout duration as needed
			} else {
				// If the player closes the tab, then we want to immediately disconnect
				leaveLobby(socket, io);
			}
		});

		// If the connected player is in the disconnect queue, remove them from the queue because they have restored their session.
		socket.on('restore_session', (userToken) => {
			if (disconnectQueue.includes(userToken)) {
				disconnectQueue.splice(disconnectQueue.indexOf(userToken), 1);

				const lobbyId = findLobbyId(userToken);
				if (lobbyId) {
					// Update the user's socket ID in the lobby to handle the new connection
					updateUserSocketId(lobbyId, userToken, socket.id, io);

					// This ensures the user's socket is subscribed to the lobby's room again
					socket.join(lobbyId);
					console.log(
						`User ${userToken} reconnected and joined lobby ${lobbyId} with new socket ID ${socket.id}`
					);
					if (lobbyId) {
						io.to(lobbyId).emit('disconnectTimerEnded', userToken);
					}

					// Send an update to all members of the lobby about the reconnection
					updateLobby(lobbyId, io);
				} else {
					console.log(`Lobby not found for userToken ${userToken}. Cannot restore session.`);
				}
			}
		});

		// RELATED TO INDIVIDUAL LOBBIES GAMEMANAGER

		// Create new GameManager object for new game and hash it with lobbyID as key
		socket.on('start_game', (lobbyId) => {
			const lobby = lobbies[lobbyId];
			if (lobby && lobby.hostUserToken === socket.userToken) {
				if (!activeGames[lobbyId]) {
					const gameManager = new GameManager(lobbyId, io);
					activeGames[lobbyId] = gameManager; // Store the game manager instance
					gameManager.start();
					console.log(`Game for lobby ${lobbyId} has started.`);
				} else {
					console.log(`Game for lobby ${lobbyId} is already active.`);
					// Optionally, notify the host that the game is already active
					socket.emit('start_game_error', 'Game is already active.');
				}
			} else {
				socket.emit('start_game_error', 'Only the host can start the game.');
			}
		});

		// Generalized socket connection with standardized data format to delegate to lobbyID's active GameManager
		socket.on('game_action', ({ lobbyId, actionType, data }) => {
			const gameManager = activeGames[lobbyId];
			if (gameManager) {
				gameManager.handleAction(socket, actionType, data);
			} else {
				// Handle case where the game manager doesn't exist, such as sending an error to the client
				socket.emit('error', 'Game session not found.');
			}
		});
	});

	server.listen(port, () => console.log(`> Ready on http://localhost:${port}`));
});

// Searches for a player in a lobby using their user token and returns the player object or null if not found.
function findPlayerInLobby(lobbyId, userToken) {
	const lobby = lobbies[lobbyId];
	if (!lobby) return null; // Return null if the lobby doesn't exist.
	const player = lobby.members.find((member) => member.userToken === userToken);
	return player || null; // Return the found player or null if not found.
}

// Searches for a corresponding userToken given a socketId
function findUserToken(socketId) {
	for (const lobbyId in lobbies) {
		const lobby = lobbies[lobbyId];
		const member = lobby.members.find((member) => member.id === socketId);
		if (member) {
			return member.userToken;
		}
	}
	return null; // Return null if the user token is not found for the provided socket ID.
}

// Searches for a lobbyId of a given userToken
function findLobbyId(userToken) {
	for (const lobbyId in lobbies) {
		const lobby = lobbies[lobbyId];
		const member = lobby.members.find((member) => member.userToken === userToken);
		if (member) {
			return lobbyId;
		}
	}
	return null; // Return null if the user token is not found in any lobby.
}

// Creates a new lobby with a unique ID and adds the host as the first member.
function createLobby(socket, { hostUserToken, playerName }, io) {
	/* Generate unique lobby ID with 4 digits (no underscores or hyphens), 62! possible combinations */
	let lobbyId = nanoid();
	// If the lobbyId is already in use create a new one until it isn't already used
	while (lobbies[lobbyId]) {
		lobbyId = nanoid();
	}

	lobbies[lobbyId] = {
		hostUserToken: hostUserToken, // Store the host's user token.
		members: [{ id: socket.id, name: playerName, isHost: true, userToken: hostUserToken }],
	};
	socket.join(lobbyId); // Add the host's socket to the lobby room.
	updateLobby(lobbyId, io); // Update all clients with the new lobby details.
	socket.emit('lobby_created', { lobbyId, hostUserToken }); // Notify the host that the lobby has been created.
	console.log('Created new lobby: ' + lobbyId);
}

// Allows a player to join an existing lobby if it exists and they are not already a member.
function joinLobby(socket, { lobbyId, playerName, userToken }, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) {
		socket.emit('error_joining', 'Lobby does not exist.'); // Inform the player if the lobby doesn't exist.
		return;
	}

	const existingPlayer = findPlayerInLobby(lobbyId, userToken);
	if (existingPlayer) {
		socket.emit('lobby_joined', { lobbyId }); // If player already in lobby, notify them.
		return;
	}

	// Add the new player to the lobby members list.
	lobby.members.push({
		id: socket.id,
		name: playerName,
		isHost: userToken === lobby.hostUserToken,
		userToken: userToken,
	});
	socket.join(lobbyId); // Add the player's socket to the lobby room.
	updateLobby(lobbyId, io); // Update all clients with the new lobby details.
	socket.emit('lobby_joined', { lobbyId }); // Notify the player that they have joined the lobby.
	console.log('User connected to lobby: ' + lobbyId);
}

// Sends updated lobby details to all clients in the lobby.
function updateLobby(lobbyId, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) return; // Do nothing if the lobby doesn't exist.
	io.to(lobbyId).emit('update_lobby', {
		members: lobby.members,
		hostUserToken: lobby.hostUserToken,
	});
}

// Handles a player leaving a lobby, including deleting the lobby if it becomes empty, and reassigning the host.
function leaveLobby(socket, io) {
	Object.keys(lobbies).forEach((lobbyId) => {
		const lobby = lobbies[lobbyId];
		const index = lobby.members.findIndex((member) => member.id === socket.id);
		if (index !== -1) {
			const disconnectedMember = lobby.members.splice(index, 1)[0]; // Remove the player from the lobby.
			console.log(
				(disconnectedMember.isHost ? 'Host' : 'User') + ' disconnected from lobby: ' + lobbyId
			);

			if (lobby.members.length === 0) {
				delete lobbies[lobbyId]; // Delete the lobby if it's empty.
			} else {
				// Check if the disconnected player was the host
				if (disconnectedMember.isHost) {
					// Select a random member to be the new host
					const newHostIndex = Math.floor(Math.random() * lobby.members.length);
					lobby.members[newHostIndex].isHost = true;
					lobby.hostUserToken = lobby.members[newHostIndex].userToken;
					console.log('Lobby ' + lobbyId + ' has a new host: ' + lobby.hostUserToken);
				}
			}

			updateLobby(lobbyId, io); // Update all clients with the new lobby details.

			// If there are no members left in the lobby, delete the lobby
			if (lobby.members.length === 0) {
				console.log(`Lobby ${lobbyId} is now empty and will be deleted.`);
				delete lobbies[lobbyId];
			}
		}
	});
}

// Fetches and sends the details of a specific lobby to a requesting client.
function fetchLobbyDetails(socket, { lobbyId }, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) {
		socket.emit('error_fetching_lobby_details', 'Lobby does not exist.'); // Inform if the lobby doesn't exist.
		return;
	}
	socket.emit('lobby_details', {
		members: lobby.members,
		hostUserToken: lobby.hostUserToken,
	});
}

// Updates the name of a player in a lobby.
function updatePlayerName(lobbyId, userToken, playerName, io) {
	const member = findPlayerInLobby(lobbyId, userToken);
	if (member && playerName) {
		member.name = playerName; // Update the player's name.
		updateLobby(lobbyId, io); // Update all clients with the new lobby details.
	}
}

// Function to update a user's socket ID in a lobby
function updateUserSocketId(lobbyId, userToken, newSocketId, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) {
		console.log(`Lobby ${lobbyId} not found.`);
		return;
	}

	const member = lobby.members.find((member) => member.userToken === userToken);
	if (member) {
		member.id = newSocketId; // Update the member's socket ID
		updateLobby(lobbyId, io); // Reflect this change to all members of the lobby
	} else {
		console.log(`User with userToken ${userToken} not found in lobby ${lobbyId}.`);
	}
}
