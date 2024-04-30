const Phase = require('./phase');

class Round {
	constructor(gameData, roundConfig, notifyPlayers, roundIndex, updatePhaseIndex, endRound) {
		this.gameData = gameData;
		this.roundConfig = roundConfig;
		this.notifyPlayers = notifyPlayers;

		this.endRound = endRound;
		this.roundIndex = roundIndex;
		this.updatePhaseIndex = updatePhaseIndex;

		this.phases = [];
		this.currentPhaseIndex = 0;
	}

	initPhases() {
		for (let index = 0; index < this.roundConfig.phases.length; index++) {
			const phaseConfig = this.roundConfig.phases[index];
			this.phases.push(
				new Phase(this.gameData, phaseConfig, this.notifyPlayers, this.endPhase.bind(this))
			);
		}
	}

	start() {
		this.notifyPlayers('round_start', {
			round: this.roundIndex + 1,
			gameData: this.gameData,
			message: 'ROUND ' + (this.roundIndex + 1) + ' STARTED',
		});
		console.log('ROUND ' + (this.roundIndex + 1) + ' STARTED');
		console.log(JSON.stringify(this.gameData));

		this.initPhases();
		this.phases[this.currentPhaseIndex].start();
	}

	endPhase(key) {
		this.notifyPlayers('phase_end', {
			key: key,
		});
		this.notifyPlayers('phase_end', { key: this.key });

		this.currentPhaseIndex++;
		this.updatePhaseIndex(this.currentPhaseIndex);

		if (this.currentPhaseIndex < this.phases.length) {
			this.phases[this.currentPhaseIndex].start();
		} else {
			this.endRound();
		}
	}
}

module.exports = Round;
