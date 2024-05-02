const Round = require('./round');

class Game {
	constructor(
		gameData,
		gameModeConfig,
		players,
		notifyPlayers,
		updateRoundIndex,
		updatePhaseIndex
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
					this.endRound.bind(this)
				)
			);
		}
	}

	start() {
		this.startGameTimer();
		this.initRounds();
		this.rounds[this.currentRoundIndex].start();
	}

	startGameTimer() {
		this.gameTimer = setInterval(() => {
			this.gameData.timeElapsed += 1;
		}, 1000);
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
		this.stopGameTimer();
		this.notifyPlayers('game_end', {
			message: 'GAME FOR LOBBY ' + this.gameData.lobbyId + ' ENDED',
		});
	}

	calculateScores() {
		return {};
	}
}

module.exports = Game;
