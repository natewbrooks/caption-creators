const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // No hyphens or underscores (default has them)
const nanoid = customAlphabet(alphabet, 7);

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const lobbies = {}; // Maps lobby IDs to lobby details

app.prepare().then(() => {
	const server = createServer((req, res) => handle(req, res));

	const io = new Server(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});

	io.on('connection', (socket) => {
		console.log('User connected');

		socket.on('create_lobby', ({ hostUserToken }) => createLobby(socket, hostUserToken, io));
		socket.on('join_lobby', (data) => joinLobby(socket, data, io));
		socket.on('update_player_name', (data) =>
			updatePlayerName(data.lobbyId, data.userToken, data.playerName, io)
		);
		socket.on('fetch_lobby_details', (data) => fetchLobbyDetails(socket, data, io));
		socket.on('leave_lobby', () => leaveLobby(socket, io));
		socket.on('disconnect', () => leaveLobby(socket, io));
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

// Creates a new lobby with a unique ID and adds the host as the first member.
function createLobby(socket, hostUserToken, io) {
	/* Generate unique lobby ID with 7 digits (no underscores or hyphens),
	"~11 days or 266K IDs needed, in order to have a 1% probability of at least one collision." (https://zelark.github.io/nano-id-cc/) */
	const lobbyId = nanoid();

	lobbies[lobbyId] = {
		hostUserToken: hostUserToken, // Store the host's user token.
		members: [{ id: socket.id, name: 'Host', isHost: true, userToken: hostUserToken }],
	};
	socket.join(lobbyId); // Add the host's socket to the lobby room.
	updateLobby(lobbyId, io); // Update all clients with the new lobby details.
	socket.emit('lobby_created', { lobbyId, hostUserToken }); // Notify the host that the lobby has been created.
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
			if (lobby.members.length === 0) {
				delete lobbies[lobbyId]; // Delete the lobby if it's empty.
			} else {
				// Check if the disconnected player was the host
				if (disconnectedMember.isHost) {
					// Select a random member to be the new host
					const newHostIndex = Math.floor(Math.random() * lobby.members.length);
					lobby.members[newHostIndex].isHost = true;
					lobby.hostUserToken = lobby.members[newHostIndex].userToken;
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
