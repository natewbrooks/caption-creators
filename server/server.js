const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { customAlphabet } = require('nanoid');
const { join } = require('path');
const fs = require('fs');
const path = require('path');
const GameManager = require('./game/gameManager');

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 4);

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const lobbies = {}; // Maps lobby IDs to lobby details
const disconnectQueue = []; // Add users to this list before disconnecting them so they have time to restore their session.
const activeGames = {}; // Maps lobby IDs to active GameManager instances

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
		socket.on('return_to_lobby', (data) => bringPartyToLobby(socket, data, io));
		socket.on('update_player_name', (data) =>
			updatePlayerName(data.lobbyId, data.userToken, data.socket, data.playerName, io)
		);
		socket.on('fetch_lobby_details', (data) => fetchLobbyDetails(socket, data, io));
		socket.on('user_fetching_video', (data) => userFetchingVideo(data));
		socket.on('avatar_selected', (data) => avatarSelected(socket, data, io));
		socket.on('leave_lobby', () => leaveLobby(socket, io));
		socket.on('leave_game', () => leaveGame(socket, io));

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
				let game = activeGames[findLobbyId(disconnectingUser)];
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
						if (game) {
							leaveGame(socket, io);
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
		socket.on('start_game', ({ lobbyId, userToken }) => {
			const lobby = lobbies[lobbyId];
			if (lobby && lobby.hostUserToken === userToken) {
				if (!activeGames[lobbyId]) {
					// Send players to game page
					io.to(lobbyId).emit('navigate_to_game', {
						path: `/game/${lobbyId}`,
					});
				} else {
					// If there is a winner (meaning the game is over) allow restart
					if (!activeGames[lobbyId].gameActive) {
						activeGames[lobbyId].startNewGame();
						activeGames[lobbyId].hostUserToken = userToken;
					} else {
						// If the user was participating in the game, reconnect them
						if (
							activeGames[lobbyId].roundData[0]?.userData.find(
								(user) => user.userToken === userToken
							)
						) {
							io.lobbyId.to(lobbyId).emit('navigate_to_game', {
								path: `/game/${lobbyId}`,
							});

							updateLobby(lobbyId, io);
						}
					}
				}
			} else {
				io.to(lobbyId).emit('start_game_error', 'Only the host can start the game.');
			}
		});

		socket.on('game_page_loaded', ({ lobbyId, userToken }) => {
			const lobby = lobbies[lobbyId];
			const game = activeGames[lobbyId];
			// If lobby exists and game doesn't already exist
			if (lobby && !game) {
				const user = lobby.members.find((member) => member.userToken === userToken);
				io.to(lobbyId).emit('users_loaded_game_page', lobby.gamePageLoaded);

				// Send signal to /lobby/${lobbyId} to move pages if a player missed the first signal
				io.to(lobbyId).emit('navigate_to_game', {
					path: `/game/${lobbyId}`,
				});

				if (!user || lobby.gamePageLoaded.includes(userToken)) {
					io.to(lobbyId).emit(
						'game_page_loaded_error',
						'Provided user is not in lobby: ' + lobbyId
					);
					return;
				}

				lobby.gamePageLoaded.push(userToken);
				// If all players have loaded the game page
				if (lobby.gamePageLoaded.length === lobby.members.length) {
					// Start a countdown before initializing the game
					// let countdown = 3;
					// const countdownInterval = setInterval(() => {
					// 	io.to(lobbyId).emit('game_start_countdown', countdown);
					// 	countdown--;
					// 	if (countdown < 0) {
					// 		clearInterval(countdownInterval);
					const gameManager = new GameManager({
						lobbyId: lobbyId,
						io: io,
						players: lobby.members,
						hostUserToken: lobby.hostUserToken,
						gameMode: 'Dev',
						updateLeaderboardScore: updateLeaderboardScore,
					});
					activeGames[lobbyId] = gameManager;
					gameManager.startNewGame();
					// 	}
					// }, 1000);
				}
			} else {
				socket.emit('game_page_loaded_error', 'Lobby does not exist');
				return;
			}
		});

		// Generalized socket connection with standardized data format to delegate to lobbyID's active GameManager
		socket.on('game_action', ({ lobbyId, key, userToken, isFinished, data }) => {
			const gameManager = activeGames[lobbyId];
			if (gameManager) {
				try {
					console.log('GAME ACTION DATA BB (SERVER): ' + JSON.stringify(data));
					gameManager.handlePlayerAction(key, userToken, isFinished, data);
				} catch (error) {
					console.error('Error handling action:', error);
					socket.emit('error', { message: 'Error processing action' });
				}
			} else {
				socket.emit('error', { message: 'Game session not found.' });
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
function createLobby(socket, { hostUserToken, playerName, email }, io) {
	/* Generate unique lobby ID with 4 digits (no underscores or hyphens), 62! possible combinations */
	let lobbyId = nanoid();
	// If the lobbyId is already in use create a new one until it isn't already used
	while (lobbies[lobbyId]) {
		lobbyId = nanoid();
	}

	getRandomAvatars(12, (err, range) => {
		if (err) {
			socket.emit('error', 'Failed to initialize avatar range.');
			return;
		}

		lobbies[lobbyId] = {
			hostUserToken: hostUserToken, // Store the host's user token.
			gamePageLoaded: [], // Store array of players who have successfully loaded game page
			members: [
				{
					id: socket.id,
					name: playerName,
					email: email,
					isHost: true,
					userToken: hostUserToken,
					avatar: null,
				},
			],
			avatars: range,
			takenAvatars: {},
		};
		console.log(lobbies[lobbyId].avatars);
		socket.join(lobbyId); // Add the host's socket to the lobby room.
		updateLobby(lobbyId, io); // Update all clients with the new lobby details.
		socket.emit('lobby_created', { lobbyId, hostUserToken }); // Notify the host that the lobby has been created.
		console.log('Created new lobby: ' + lobbyId);
	});
}

// Allows a player to join an existing lobby if it exists and they are not already a member.
function joinLobby(socket, { lobbyId, playerName, userToken, email }, io) {
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

	if (activeGames[lobbyId]) {
		socket.emit('error_joining', 'This lobby is already in a game! You cannot join at this time.');
		return;
	}

	if (lobby.members.length >= 9) {
		socket.emit('error_joining', 'Lobby is full.'); // Inform the player if the lobby is full.
		return;
	}

	// Add the new player to the lobby members list.
	addLobbyMember(socket, {
		id: socket.id,
		lobbyId: lobbyId,
		name: playerName,
		userToken: userToken,
		email: email,
		avatar: lobby.avatar,
	});

	socket.join(lobbyId); // Add the player's socket to the lobby room.
	updateLobby(lobbyId, io); // Update all clients with the new lobby details.
	socket.emit('lobby_joined', { lobbyId }); // Notify the player that they have joined the lobby.
	console.log('User connected to lobby: ' + lobbyId);
}

function addLobbyMember(socket, { lobbyId, name, userToken, email, avatar }) {
	const lobby = lobbies[lobbyId];
	try {
		lobby.members.push({
			id: socket.id,
			name: name,
			isHost: userToken === lobby.hostUserToken,
			userToken: userToken,
			email: email || null,
			avatar: avatar || null,
		});
	} catch (error) {
		socket.emit('lobby_error', {
			message: `Error adding user ${userToken} to lobby:  ${error},`,
		});
	}
}

function bringPartyToLobby(socket, { lobbyId, userToken }, io) {
	const lobby = lobbies[lobbyId];
	if (lobby) {
		const isRequestByHost = lobby.hostUserToken === userToken;
		if (!isRequestByHost) return;

		if (activeGames[lobbyId]) {
			io.to(lobbyId).emit('navigate_to_lobby', {
				path: `/lobby/${lobbyId}`,
			});

			lobby.gamePageLoaded = [];
			delete activeGames[lobbyId];
		}
	}
	return null; // Return null if the lobby is not found
}

// Sends updated lobby details to all clients in the lobby.
function updateLobby(lobbyId, io) {
	const lobby = lobbies[lobbyId];
	const game = activeGames[lobbyId];
	if (!lobby) return; // Do nothing if the lobby doesn't exist.
	io.to(lobbyId).emit('update_lobby', {
		members: lobby.members,
		hostUserToken: lobby.hostUserToken,
		takenAvatars: lobby.takenAvatars,
	});

	if (!game) return;
	game.gameData.hostUserToken = lobby.hostUserToken;

	console.log('lobby ' + lobbyId + ' taken: ' + JSON.stringify(lobby.takenAvatars));
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

			// Free up disconnected users avatar
			Object.entries(lobby.takenAvatars).forEach(([key, value]) => {
				if (value === disconnectedMember.userToken) {
					delete lobby.takenAvatars[key];
				}
			});

			// To remove disconnected user from players who have game rendered (so other players don't have the waiting to load screen)
			const gamePageLoadedMemberIndex = lobby.gamePageLoaded.findIndex((user) => {
				user.userToken === disconnectedMember.userToken;
			});
			if (gamePageLoadedMemberIndex !== -1) {
				lobby.gamePageLoaded.splice(gamePageLoadedMemberIndex, 1);
			}

			if (lobby.members.length === 0) {
				console.log(`Lobby ${lobbyId} is now empty and will be deleted.`);
				delete lobbies[lobbyId]; // Delete the lobby if it's empty.
				if (activeGames[lobbyId]) {
					console.log(`Game ${lobbyId} is deleted.`);
					delete activeGames[lobbyId];
				}
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
		}
	});
}

// Fetches and sends the details of a specific lobby to a requesting client.
function fetchLobbyDetails(socket, { lobbyId }, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) {
		socket.emit('error_fetching_lobby_details', 'Lobby does not exist.');
		return;
	}

	socket.emit('lobby_details', {
		members: lobby.members,
		hostUserToken: lobby.hostUserToken,
		avatars: lobby.avatars,
		takenAvatars: lobby.takenAvatars,
	});
}

function getRandomAvatars(count, callback) {
	const avatarDirectory = path.join(__dirname, '..', 'public', 'avatars');

	fs.readdir(avatarDirectory, (err, files) => {
		if (err) {
			console.error('Error accessing avatar directory:', err);
			callback(err);
			return;
		}

		// filter only .png files
		const pngFiles = files.filter((file) => file.endsWith('.png'));

		const totalAvatars = pngFiles.length;
		if (totalAvatars < count) {
			console.error('Not enough avatars to select from.');
			callback(new Error('Not enough avatars to select from.'));
			return;
		}

		// accounts for client /public/ path
		const publicFilePath = pngFiles.map((file) => `/avatars/${file}`);

		// shuffle and pick `count` avatars
		const shuffledFiles = publicFilePath.sort(() => 0.5 - Math.random());
		const selectedAvatars = shuffledFiles.slice(0, count);

		callback(null, selectedAvatars);
	});
}

// Fetches and sends the details of a specific lobby to a requesting client.
function avatarSelected(socket, { lobbyId, userToken, avatarSrc }, io) {
	const lobby = lobbies[lobbyId];
	if (!lobby) {
		socket.emit('error', 'Lobby not found.');
		return;
	}

	// Update taken avatars in the server-side state
	const takenAvatars = lobby.takenAvatars || {};
	// Remove previous avatar selection
	for (const key in takenAvatars) {
		if (takenAvatars[key] === userToken) {
			delete takenAvatars[key];
		}
	}

	// Assign the new avatar
	takenAvatars[avatarSrc] = userToken;
	lobby.takenAvatars = takenAvatars;
	lobby.members.find((player) => player.userToken === userToken).avatar = avatarSrc;

	updateLobby(lobbyId, io);

	socket.emit('avatar_selection_response', {
		success: true,
		message: 'Avatar selected successfully.',
	});
}

// Updates the name of a player in a lobby.
function updatePlayerName(lobbyId, userToken, socket, playerName, io) {
	const lobby = lobbies[lobbyId];
	const member = findPlayerInLobby(lobbyId, userToken);

	const nameExists = lobby.members.some(
		(member) =>
			member.name.toLowerCase() === playerName.toLowerCase() && member.userToken !== userToken
	);

	if (nameExists) {
		if (socket) {
			socket.emit('update_name_error', 'Name is already taken by another player.');
		}
		return;
	}
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

async function fetchYouTubeVideo(prompt) {
	return fetch('http://localhost:3000/api/youtube', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ prompt }),
	})
		.then((response) => response.json())
		.then((data) => data.success)
		.catch((error) => {
			console.error('Error fetching youtube video:', error);
			return false;
		});
}

function userFetchingVideo({ lobbyId, userToken, prompt }) {
	const lobby = lobbies[lobbyId];
	const game = activeGames[lobbyId];
	if (game && !game.playersFetchingVideos.includes(userToken)) {
		console.log('USER ', userToken, ' IS FETCHING VIDEO!');
		game.playersFetchingVideos.push(userToken);
	}
}

async function updateLeaderboardScore(email, points) {
	const fetch = (await import('node-fetch')).default;

	return fetch('http://localhost:3000/api/leaderboard', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, score: points }),
	})
		.then((response) => response.json())
		.then((data) => data.success)
		.catch((error) => {
			console.error('Error updating leaderboard score:', error);
			return false;
		});
}
