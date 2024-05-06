const Round = require('./round');

class Game {
	constructor(
		gameData,
		gameModeConfig,
		players,
		notifyPlayers,
		updateRoundIndex,
		updatePhaseIndex,
		calculateFinalScores
	) {
		this.gameData = gameData;
		this.gameModeConfig = gameModeConfig;
		this.players = players;
		this.notifyPlayers = notifyPlayers;

		this.gameData.timeElapsed = 0;
		this.gameTimer = null;

		this.rounds = [];
		this.updateRoundIndex = updateRoundIndex;
		this.updatePhaseIndex = updatePhaseIndex;
		this.calculateFinalScores = calculateFinalScores;

		this.currentRoundIndex = 0;
	}

	initRounds() {
		for (let index = 0; index < this.gameModeConfig.rounds.length; index++) {
			const roundConfig = this.gameModeConfig.rounds[index];
			this.rounds.push(
				new Round(
					this.gameData,
					roundConfig,
					this.notifyPlayers,
					index,
					this.updatePhaseIndex,
					this.endRound.bind(this),
					this.pause.bind(this),
					this.resume.bind(this)
				)
			);
		}
	}

	start() {
		this.startGameTimer();
		this.initRounds();
		this.rounds[this.currentRoundIndex].start();
	}

	pause() {
		this.pauseGameTimer();
		if (this.currentRoundIndex < this.rounds.length) {
			this.rounds[this.currentRoundIndex].pauseTimer();
		}
		this.paused = true;
	}

	resume() {
		this.resumeGameTimer();
		if (this.currentRoundIndex < this.rounds.length) {
			this.rounds[this.currentRoundIndex].resumeTimer();
		}
		this.paused = false;
	}

	startGameTimer() {
		this.gameTimer = setInterval(() => {
			this.gameData.timeElapsed += 1;
		}, 1000);
	}

	pauseGameTimer() {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
			this.gameTimer = null;
		}
	}

	resumeGameTimer() {
		this.startGameTimer();
	}

	stopGameTimer() {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
			this.gameTimer = null;
		}
	}

	endRound() {
		this.notifyPlayers('round_end', {
			round: this.currentRoundIndex + 1,
			message: 'ROUND ' + (this.currentRoundIndex + 1) + ' ENDED',
		});
		console.log('ROUND ' + (this.currentRoundIndex + 1) + ' ENDED');

		if (this.currentRoundIndex + 1 < this.rounds.length) {
			this.rounds[this.currentRoundIndex] = null;
			this.currentRoundIndex++;
			this.updateRoundIndex(this.currentRoundIndex);
			this.updatePhaseIndex(0);
			this.rounds[this.currentRoundIndex].start();
		} else {
			this.end();
		}
	}

	end() {
		console.log('GAME ENDED FOR LOBBY ' + this.gameData.lobbyId);
		console.log('FINAL GAME DATA ' + JSON.stringify(this.gameData));
		this.calculateFinalScores();
		this.stopGameTimer();
		this.notifyPlayers('game_end', {
			message: 'GAME FOR LOBBY ' + this.gameData.lobbyId + ' ENDED',
		});
	}
}

module.exports = Game;
