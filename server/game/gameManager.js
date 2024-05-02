const gameModeConfig = require('./gameModes.json');
const Game = require('./sequence/game');

class GameManager {
	constructor(lobbyId, io, players, gameMode = 'Standard') {
		this.lobbyId = lobbyId;
		this.io = io;
		this.players = players;
		this.videos = {};

		this.game = null;
		this.currentPhase = '';
		this.currentRoundIndex = 0;
		this.currentPhaseIndex = 0;
		this.usersFinishedCurrentPhase = [];

		this.gameMode = gameMode;
		this.gameModeConfig = this.initGameConfig(gameMode);
		this.gameData = {
			gameMode: gameMode,
			lobbyId: lobbyId,
			timeElapsed: 0,
			winner: null,
			rounds: [],
		};
	}

	initGameConfig(gameMode) {
		const mode = gameModeConfig.gameModes.find((mode) => mode.name === gameMode);
		if (!mode) {
			console.error(`ERROR - Game mode '${gameMode}' not found`);
			throw new Error(`Game mode '${gameMode}' not found`);
		}

		return mode;
	}

	initGameData() {
		if (!this.gameModeConfig) {
			console.error('No rounds configuration found');
			return;
		}

		this.gameModeConfig.rounds.forEach((roundConfig, roundIndex) => {
			const phaseData = roundConfig.phases.map((phaseConfig) => {
				return {
					name: phaseConfig.name,
					key: phaseConfig.key,
					duration: phaseConfig.duration,
					options: phaseConfig.options || {},
					data: this.players.map((player) => ({
						userToken: player.userToken,
						results: {},
					})),
				};
			});

			const roundData = {
				round: roundIndex + 1,
				videoAssignments: this.players.map((player) => ({
					userToken: player.userToken,
					video: null,
				})),
				phases: phaseData,
			};

			this.gameData.rounds.push(roundData);
		});
	}

	startNewGame() {
		this.initGameData();
		this.notifyPlayers('navigate', { path: `/game/${this.lobbyId}` });
		this.notifyPlayers('game_start', { gameData: this.gameData });

		this.game = new Game(
			this.gameData,
			this.gameModeConfig,
			this.players,
			this.notifyPlayers.bind(this),
			this.updateCurrentRoundIndex.bind(this),
			this.updateCurrentPhaseIndex.bind(this)
		);
		this.game.start();
	}

	handlePlayerAction(key, userToken, isFinished, data) {
		let roundData = this.gameData.rounds[this.currentRoundIndex];
		let phaseData = this.gameData.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex];
		const playerData = phaseData.data.find((player) => player.userToken === userToken); // Find current phase data of the player provided
		this.currentPhase = key;

		// If the phase changes restart users finished
		if (!playerData) {
			console.error('Player not found for userToken:', userToken);
			return;
		}

		if (isFinished && !this.usersFinishedCurrentPhase.includes(userToken)) {
			// Add player to finished if not in already
			this.usersFinishedCurrentPhase.push(userToken);
		} else if (!isFinished && this.usersFinishedCurrentPhase.includes(userToken)) {
			// If user was finished and isnt anymore (voting) then unfinish them
			let utIndex = this.usersFinishedCurrentPhase.indexOf(userToken);
			if (utIndex > -1) {
				this.usersFinishedCurrentPhase.splice(utIndex, 1);
			}
		}

		switch (key) {
			case 'prompt':
				console.log(userToken + ' USER KEYWORD: ' + data.prompt);
				const generatedVideo = this.fetchYouTubeVideo(data.prompt);
				playerData.results.prompt = data.prompt;
				playerData.results.generatedVideo = generatedVideo;
				// base the assignment off the gameMode config
				// async fetch youtube video with keyword - give 1 of random array for testing
				//
				let unassignedPlayers = roundData.videoAssignments.filter((v) => v.video === null);
				if (unassignedPlayers.length > 0) {
					// Randomly pick one unassigned player to assign a video
					let randomIndex = Math.floor(Math.random() * unassignedPlayers.length);
					let selectedPlayer = unassignedPlayers[randomIndex];
					selectedPlayer.video = generatedVideo;
				}
				console.log('VIDEO ASSIGNMENTS: ' + JSON.stringify(roundData.videoAssignments));
				break;
			case 'caption':
				console.log(userToken + ' USER CAPTIONED: ' + data.caption);
				playerData.results.caption = data.caption;
				break;
			case 'vote':
				console.log(userToken + ' USER VOTED: ' + data.vote);
				playerData.results.vote = data.vote;
				break;
		}

		// If all players are FINISHED at the same time
		if (this.usersFinishedCurrentPhase.length === this.players.length) {
			console.log('ALL PLAYERS FINISHED PHASE');
			this.game.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex].stopPhase();
			this.usersFinishedCurrentPhase = [];
		}

		this.notifyPlayers('game_data_updated', {
			gameData: this.gameData,
			userToken: userToken,
			isFinished: isFinished,
			currentRoundIndex: this.currentRoundIndex,
			currentPhaseIndex: this.currentPhaseIndex,
			usersFinished: this.usersFinishedCurrentPhase,
		});
		console.log('currentPhaseData: ' + JSON.stringify(phaseData));
	}

	fetchYouTubeVideo(keyword) {
		if (keyword === '') {
			keyword = this.getAIKeyword();
		}
		const videos = [
			'https://www.youtube.com/embed/x6iwZSURP44',
			'https://www.youtube.com/embed/NsMKvVdEPkw',
			'https://www.youtube.com/embed/dFg8Nu2X5Mo',
			'https://www.youtube.com/embed/0tyNraIglgc',
			'https://www.youtube.com/embed/9L7Y681bKz8',
		];

		return videos[Math.floor(Math.random() * videos.length)];
	}

	async getAIKeyword() {
		try {
			const response = await fetch(`/api/chatGPT/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (response.ok) {
				return data.message;
			} else {
				throw new Error('Failed to fetch random keyword: ' + data.error);
			}
		} catch (error) {
			console.error('Error fetching random keyword:', error.message);
		}
	}

	notifyPlayers(event, data) {
		this.io.to(this.lobbyId).emit('notify_players', { event, data });
	}

	updateCurrentRoundIndex(index) {
		this.currentRoundIndex = index;
		console.log(`Updated currentRoundIndex to ${index}`);
	}

	updateCurrentPhaseIndex(index) {
		this.currentPhaseIndex = index;
		console.log(`Updated currentPhaseIndex to ${index}`);
	}
}

module.exports = GameManager;
