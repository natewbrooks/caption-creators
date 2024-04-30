const gameModeConfig = require('./gameModes.json');
const Game = require('./sequence/game');

class GameManager {
	constructor(lobbyId, io, players, gameMode = 'Standard') {
		this.lobbyId = lobbyId;
		this.io = io;
		this.players = players;
		this.videos = {};

		this.game = null;
		this.currentRoundIndex = 0;
		this.currentPhaseIndex = 0;

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
					key: phaseConfig.key,
					duration: phaseConfig.duration,
					data: this.players.map((player) => ({
						userToken: player.userToken,
						results: {},
					})),
				};
			});

			const gameData = {
				round: roundIndex + 1,
				videoAssignments: this.players.map((player) => ({
					userToken: player.userToken,
					video: null,
				})),
				phases: phaseData,
			};

			this.gameData.rounds.push(gameData);
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
		let currentPhase = this.gameData.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex];
		const playerData = currentPhase.data.find((player) => player.userToken === userToken); // Find current phase data of the player provided

		if (!playerData) {
			console.error('Player not found for userToken:', userToken);
			return;
		}

		switch (key) {
			case 'prompt':
				console.log(userToken + ' USER KEYWORD: ' + data.prompt);
				playerData.results.prompt = data.prompt;
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

		this.notifyPlayers('data_updated', {
			gameData: this.gameData,
			userToken: userToken,
			isFinished: isFinished,
			currentRoundIndex: this.currentRoundIndex,
			currentPhaseIndex: this.currentPhaseIndex,
		});
		console.log('currentPhaseData: ' + JSON.stringify(currentPhase));
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
