class Phase {
	constructor(gameData, phaseConfig, notifyPlayers, phaseIndex, endPhase) {
		this.name = phaseConfig.name;
		this.duration = phaseConfig.duration;
		this.key = phaseConfig.key;
		this.phaseIndex = phaseIndex;

		this.endPhase = endPhase;
		this.phaseTimer = null;
		this.timeElapsed = 0;

		this.notifyPlayers = notifyPlayers;
		this.gameData = gameData;
	}

	start() {
		this.notifyPlayers('phase_start', {
			key: this.key,
			phaseIndex: this.phaseIndex,
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
				this.stopPhase();
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

	stopPhase() {
		this.stopPhaseTimer();

		this.endPhase(this.key);
	}
}

module.exports = Phase;
