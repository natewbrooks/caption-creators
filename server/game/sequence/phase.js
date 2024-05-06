class Phase {
	constructor(gameData, phaseConfig, notifyPlayers, phaseIndex, endPhase, resume, pause) {
		this.name = phaseConfig.name;
		this.duration = phaseConfig.duration;
		this.key = phaseConfig.key;
		this.phaseIndex = phaseIndex;

		this.resume = resume;
		this.pause = pause;

		this.endPhase = endPhase;
		this.phaseTimer = null;
		this.timeElapsed = 0;

		this.notifyPlayers = notifyPlayers;
		this.gameData = gameData;
		this.paused = false; // Add a paused flag
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
			if (!this.paused) {
				// Skip counting if paused
				this.timeElapsed++;
				if (this.duration === -1) {
					// Count up indefinitely if duration is -1
					this.notifyPlayers('phase_countdown', {
						key: this.key,
						time: this.timeElapsed,
					});
				} else {
					// Count down
					if (this.timeElapsed >= this.duration) {
						this.stopPhase();
					} else {
						this.notifyPlayers('phase_countdown', {
							key: this.key,
							time: this.duration - this.timeElapsed,
						});
					}
				}
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

	// Pause the timer
	pauseTimer() {
		this.paused = true;
		this.notifyPlayers('phase_paused', {
			key: this.key,
			remainingTime: this.duration === -1 ? this.timeElapsed : this.duration - this.timeElapsed,
		});
		this.pause();
	}

	// Resume the timer from the paused state
	resumeTimer() {
		if (this.paused) {
			this.paused = false;
			this.notifyPlayers('phase_resumed', {
				key: this.key,
				remainingTime: this.duration === -1 ? this.timeElapsed : this.duration - this.timeElapsed,
			});
			this.resume();
		}
	}
}

module.exports = Phase;
