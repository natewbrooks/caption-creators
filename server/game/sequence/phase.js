class Phase {
	constructor(gameData, phaseConfig, notifyPlayers, endPhase) {
		this.name = phaseConfig.name;
		this.duration = phaseConfig.duration;
		this.key = phaseConfig.key;

		this.endPhase = endPhase;
		this.phaseTimer = null;
		this.timeElapsed = 0;

		this.notifyPlayers = notifyPlayers;
		this.gameData = gameData;
	}

	start() {
		this.notifyPlayers('phase_start', {
			key: this.key,
			gameData: this.gameData,
			duration: this.duration,
		});
		this.timeElapsed = 0;
		this.startPhaseTimer();
	}

	startPhaseTimer() {
		if (this.phaseTimer !== null) {
			clearInterval(this.phaseTimer);
		}
		this.phaseTimer = setInterval(() => {
			this.timeElapsed++;
			if (this.timeElapsed >= this.duration) {
				this.stopPhaseTimer();
				this.endPhase(this.key);
			} else {
				this.notifyPlayers('phase_countdown', {
					key: this.key,
					time: this.duration - this.timeElapsed,
				});
			}
		}, 1000);
	}

	stopPhaseTimer() {
		if (this.phaseTimer) {
			clearInterval(this.phaseTimer);
			this.phaseTimer = null;
		}
	}
}

module.exports = Phase;
