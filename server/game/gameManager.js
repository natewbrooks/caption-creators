const gameModeConfig = require('./gameModes.json');
const Game = require('./sequence/game');

// import { updateLeaderboardScore } from '../../app/api/leaderboard/route';

class GameManager {
	constructor({
		lobbyId,
		io,
		players,
		hostUserToken,
		gameMode = 'Standard',
		updateLeaderboardScore,
	}) {
		this.lobbyId = lobbyId;
		this.io = io;
		this.players = players;
		this.videos = {};
		this.playersFetchingVideo = [];

		this.updateLeaderboardScore = updateLeaderboardScore;

		this.game = null;
		this.gameActive = false;
		this.currentPhaseKey = '';
		this.currentRoundIndex = 0;
		this.currentPhaseIndex = 0;
		this.usersFinishedCurrentPhase = [];
		this.transitionPhaseKeys = ['transition', 'intro', 'outro'];

		this.gameMode = gameMode;
		this.gameModeConfig = this.initGameConfig(gameMode);
		this.gameData = {
			gameMode: gameMode,
			lobbyId: lobbyId,
			hostUserToken: hostUserToken,
			timeElapsed: 0,
			finalScores: {},
			rounds: [],
		};

		this.roundData = {};
		this.phaseData = {};
	}

	resetGameData() {
		this.gameData = {
			gameMode: this.gameMode,
			lobbyId: this.lobbyId,
			hostUserToken: this.hostUserToken,
			timeElapsed: 0,
			finalScores: {},
			rounds: [],
		};

		this.roundData = {};
		this.phaseData = {};
		this.currentPhaseKey = '';
		this.currentRoundIndex = 0;
		this.currentPhaseIndex = 0;
	}

	initGameConfig(gameMode) {
		const mode = gameModeConfig.gameModes.find((mode) => mode.name === gameMode);
		if (!mode) {
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
			const phaseData = roundConfig.phases.map((phaseConfig) => ({
				name: phaseConfig.name,
				key: phaseConfig.key,
				duration: phaseConfig.duration,
				options: phaseConfig.options,
				userData: this.players.map((player) => ({
					userToken: player.userToken,
					results: {},
				})),
			}));

			const roundData = {
				round: roundIndex + 1,
				multiplier: roundConfig.multiplier,
				scores: {
					winner: null,
				},
				videoAssignments: this.players.map((player) => ({
					userToken: player.userToken,
					prompterUserToken: null,
					prompt: '',
					video: null,
				})),
				phases: phaseData,
			};

			this.gameData.rounds.push(roundData);
		});

		this.updateRoundAndPhaseData();
	}

	updateRoundAndPhaseData() {
		this.roundData = this.gameData.rounds[this.currentRoundIndex];
		this.phaseData = this.roundData.phases[this.currentPhaseIndex];

		this.notifyPlayers('game_data_update', {
			gameData: this.gameData,
			roundData: this.roundData,
			phaseData: this.phaseData,
			roundIndex: this.currentRoundIndex,
			phaseIndex: this.currentPhaseIndex,
		});
	}

	startNewGame() {
		if (this.game !== null) {
			this.resetGameData();
		}
		console.log('NEW GAME STARTED');

		this.initGameData();
		this.notifyPlayers('game_start', {
			hostUserToken: this.gameData.hostUserToken,
			gameData: this.gameData,
			roundData: this.roundData,
			phaseData: this.phaseData,
		});

		this.game = new Game(
			this.gameData,
			this.gameModeConfig,
			this.players,
			this.notifyPlayers.bind(this),
			this.updateCurrentRoundIndex.bind(this),
			this.updateCurrentPhaseIndex.bind(this),
			this.calculateFinalScores.bind(this)
		);

		this.gameActive = true;
		this.game.start();
	}

	calculatePoints() {
		this.updateRoundAndPhaseData();
		const roundData = this.roundData;
		if (!roundData || !roundData.scores) {
			console.error('Invalid roundData or missing scores:', roundData);
			return;
		}

		const votesToPts = 100; // Conversion rate: 1 vote = 100 points
		const multiplier = roundData.multiplier;

		this.players.forEach((player) => {
			const userToken = player.userToken;

			roundData.scores[userToken] = {
				pts: {
					total: 0,
					selfVote: 0,
					vote: 0,
					voteBeforeMultiplier: 0,
				},
				bonuses: {
					total: 0,
					majority: { received: false, pts: 0 },
					diversity: { received: false, pts: 0 },
					consistency: { received: false, pts: 0 },
					winner: { received: false, pts: 0 },
					pityParty: { received: false, pts: 0 },
					selfless: { received: false, pts: 0 },
				},
				votesReceived: 0, // Initialize votes received counter
				selfVotesReceived: 0,
			};

			let bonus = 0;

			// Base points for votes received (excluding self-votes)
			const votePhase = roundData.phases.find((phase) => phase.key === 'vote');
			if (!votePhase || !votePhase.userData) {
				console.error('Invalid vote phase data:', votePhase);
				return;
			}

			console.log('VOTE PHASE: ' + JSON.stringify(votePhase.userData));

			// Count votes for player excluding self votes
			// Count votes for player excluding self votes
			let votesForPlayer = 0;
			let selfVotesForPlayer = 0;

			votePhase.userData.forEach((user, index) => {
				const userVoteData = user.results.vote;
				// Now you can use userVoteData to access the vote information for each user
				console.log('User Vote Data:', userVoteData);
				// Count votes excluding self votes
				Object.entries(userVoteData).forEach(([voteRecipientToken, voteValue]) => {
					if (user.userToken === userToken) {
						if (voteRecipientToken === userToken) {
							selfVotesForPlayer += voteValue;
						}
					} else {
						if (voteRecipientToken === userToken) {
							votesForPlayer += voteValue;
						}
					}
				});
			});
			// Update scores with vote information
			roundData.scores[userToken].votesReceived = votesForPlayer;
			roundData.scores[userToken].selfVotesReceived = selfVotesForPlayer;
			roundData.scores[userToken].pts.voteBeforeMultiplier = votesForPlayer * votesToPts;
			roundData.scores[userToken].pts.vote = votesForPlayer * multiplier * votesToPts;
			roundData.scores[userToken].pts.selfVote = selfVotesForPlayer * multiplier * (votesToPts / 2);

			// Calculate selfless bonus
			if (selfVotesForPlayer === 0) {
				roundData.scores[userToken].bonuses.selfless = { received: true, pts: 25 };
				bonus += 25;
			}

			console.log('VOTES RECEIVED #: ' + JSON.stringify(votesForPlayer));
			console.log('SELF VOTES RECEIVED #: ' + JSON.stringify(selfVotesForPlayer));

			// Calculate majority bonus
			if (votesForPlayer > this.players.length / 2) {
				roundData.scores[userToken].bonuses.majority = { received: true, pts: 100 };
				bonus += 100;
			}

			// Calculate diversity bonus
			const uniqueVoters = [...new Set(votePhase.userData.map((voteUser) => voteUser.userToken))];
			if (uniqueVoters.length === this.players.length - 1) {
				roundData.scores[userToken].bonuses.diversity = { received: true, pts: 100 };
				bonus += 100;
			}

			// Calculate pity party bonus
			if (votesForPlayer === 0) {
				roundData.scores[userToken].bonuses.pityParty = { received: true, pts: 10 };
				bonus += 10;
			}

			roundData.scores[userToken].bonuses.total = bonus;
			roundData.scores[userToken].pts.total =
				votesForPlayer * votesToPts * multiplier +
				bonus +
				selfVotesForPlayer * multiplier * (votesToPts * 0.5);
		});

		if (roundData && roundData.scores) {
			// Determine the highest score
			const highestScore = Math.max(
				...Object.values(roundData.scores).map((score) =>
					score && score.pts ? score.pts.total : 0
				)
			);

			// Determine the winner and assign the winner bonus
			let winnerToken = null;

			Object.keys(roundData.scores).forEach((userToken) => {
				if (!roundData.scores[userToken] || !roundData.scores[userToken].bonuses) return;

				let newBonus = 0;
				// Ensure score object and initialize bonuses if it doesn't exist
				const score = roundData.scores[userToken];
				if (!score) return;

				if (!score.bonuses) {
					score.bonuses = {};
				}

				// Assign the winner bonus
				if (score.pts && score.pts.total === highestScore) {
					winnerToken = userToken;
					score.bonuses.winner = { received: true, pts: 200 };
					newBonus += 200;
					roundData.scores[winnerToken].bonuses.total += newBonus;
					roundData.scores[winnerToken].pts.total += newBonus;
				} else {
					score.bonuses.winner = { received: false, pts: 0 };
				}
			});

			// Update the round's winner
			roundData.scores.winner = winnerToken;
		}

		// Calculate consistency bonus
		Object.keys(roundData.scores).forEach((userToken) => {
			if (!roundData.scores[userToken] || !roundData.scores[userToken].bonuses) return;
			let newBonus = 0;

			let winsInARow = 0;
			for (let index = this.currentPhaseIndex; index > 0; index--) {
				const previousRoundData = this.gameData.rounds[index];
				if (previousRoundData?.scores.winner === userToken) {
					winsInARow++;
				} else {
					break; // Exit loop if the winning streak is broken
				}
			}

			if (winsInARow > 1) {
				roundData.scores[userToken].bonuses.consistency = {
					received: true,
					pts: 50 * winsInARow,
				};
				newBonus += 50 * winsInARow;
			} else {
				roundData.scores[userToken].bonuses.consistency = { received: false, pts: 0 };
			}

			// Update total bonuses and points
			roundData.scores[userToken].bonuses.total += newBonus;
			roundData.scores[userToken].pts.total += newBonus;
		});

		this.updateRoundAndPhaseData();
		console.log('GAME ROUND SCORE DATA: ' + JSON.stringify(roundData.scores));
		this.notifyPlayers('score_data_update', {
			roundScoreData: roundData.scores,
		});
	}

	async calculateFinalScores() {
		this.updateRoundAndPhaseData();
		if (!this.gameData || !this.gameData.finalScores) {
			console.error('Invalid gameData or missing final scores:', this.gameData);
			return;
		}

		// Initialize final scores for each player
		this.gameData.finalScores = {
			winner: null,
		};

		this.players.forEach((player) => {
			this.gameData.finalScores[player.userToken] = {
				pts: {
					total: 0,
				},
			};
		});

		let winningPlayer = null;
		let winningPlayerScore = 0;

		// Aggregate scores from all rounds
		this.gameData.rounds.forEach((round) => {
			Object.keys(round.scores).forEach((userToken) => {
				if (this.gameData.finalScores[userToken]) {
					const points = round.scores[userToken].pts.total;

					// Update the total points
					this.gameData.finalScores[userToken].pts.total += points;

					if (points > winningPlayerScore) {
						winningPlayer = userToken;
						winningPlayerScore = points;
					}

					// add score to leaderboard database if they have an account
					const player = this.players.find((player) => player.userToken === userToken);
					const email = player?.email || null;

					if (email) {
						this.updateLeaderboardScore(email, points)
							.then((success) => {
								if (success) {
									console.log(`Score updated for player with email ${email}`);
								} else {
									console.error(`Failed to update score for ${email}`);
								}
							})
							.catch((error) => {
								console.error(`Error updating score for ${email}:`, error);
							});
					}
				}
			});
		});

		this.gameActive = false;
		this.gameData.finalScores.winner = winningPlayer;
		console.log('FINAL SCORES:', JSON.stringify(this.gameData.finalScores));
		this.updateRoundAndPhaseData();
	}

	handlePlayerAction(key, userToken, isFinished, data) {
		this.updateRoundAndPhaseData();
		if (!this.phaseData) {
			console.error('gameManager ERROR - No phase data found in handlePlayerAction()');
			return;
		}

		const playerData = this.phaseData.userData?.find((player) => player.userToken === userToken); // Find current phase data of the player provided
		// If the phase changes restart users finished
		if (!playerData) {
			console.error('Action denied! Player not found for userToken:', userToken);
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

		this.currentPhaseKey = key;
		switch (key) {
			case 'prompt':
				console.log(userToken + ' USER KEYWORD: ' + data.prompt);
				let generatedVideo = data.videoURL;
				if (!generatedVideo) {
					// TODO: If there was not a video provided by the client then have the server try
					generatedVideo = this.fetchYouTubeVideo(data.prompt);
				}

				playerData.results.prompt = data.prompt;
				playerData.results.generatedVideo = generatedVideo;
				// TODO: base the video assignment off the gameMode config
				let unassignedPlayers = this.roundData.videoAssignments.filter((v) => v.video === null);
				if (unassignedPlayers.length > 0) {
					// Randomly pick one unassigned player to assign a video
					let randomIndex = Math.floor(Math.random() * unassignedPlayers.length);
					let selectedPlayer = unassignedPlayers[randomIndex];
					selectedPlayer.prompterUserToken = userToken;
					selectedPlayer.prompt = data.prompt;
					selectedPlayer.video = generatedVideo;
				}
				console.log('VIDEO ASSIGNMENTS: ' + JSON.stringify(this.roundData.videoAssignments));
				break;
			case 'caption':
				console.log(userToken + ' USER CAPTIONED: ' + data.caption);
				playerData.results.caption = data.caption;
				break;
			case 'preview':
				console.log(userToken + ' USER FINISHED PREVIEWING VIDEOS');
				// If stopwatch time is > than players.length * 60 (max yt short length), end phase
				if (data?.time > this.players.length * 60) {
					this.game.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex].stopPhase();
				}
				break;
			case 'vote':
				console.log(userToken + ' USER VOTED: ' + JSON.stringify(data.vote));
				playerData.results.vote = data.vote;
				console.log('RESULTS FOM VOTE ACTION: ' + playerData.results);
				break;
		}

		this.updateRoundAndPhaseData();
		this.notifyPlayers('player_action_response', {
			userToken: userToken,
			isFinished: isFinished,
			usersFinished: [...this.usersFinishedCurrentPhase],
		});

		// If all players are FINISHED at the same time, checks if the phase hasn't changed too
		if (
			this.usersFinishedCurrentPhase.length === this.players.length &&
			(this.currentPhaseKey === key || this.players.length === 1)
		) {
			// If all players are finished its a transition, intro, or outro phase then we want to not wipe usersFinished
			console.log('ALL PLAYERS FINISHED PHASE');
			this.game.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex].stopPhase();
			this.updateRoundAndPhaseData();
		}

		console.log('currentPhaseData: ' + JSON.stringify(this.phaseData));
	}

	fetchYouTubeVideo(keyword) {
		// if (keyword === '') {
		// 	keyword = this.getAIKeyword();
		// }

		const shortURLS = [
			'https://www.youtube.com/shorts/x6iwZSURP44',
			'https://www.youtube.com/shorts/z7-5tzA1XUM',
			'https://www.youtube.com/shorts/UFbUVxN5sPo',
			'https://www.youtube.com/shorts/NrjRIepLaWs',
			'https://www.youtube.com/shorts/PF_eNg2DRHU',
			'https://www.youtube.com/shorts/u6e_YSVby3E',
			'https://www.youtube.com/shorts/oDx2t4UsaxU',
		];
		const selected = shortURLS[Math.floor(Math.random() * shortURLS.length)];
		console.log('SELECTED VIDEO: ' + selected);

		return selected;
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
		console.log(`Updated roundIndex to ${index}`);
		this.updateRoundAndPhaseData();
	}

	updateCurrentPhaseIndex(index) {
		this.currentPhaseIndex = index;
		this.updateRoundAndPhaseData();
		this.currentPhaseKey = this.phaseData.key;

		if (
			this.gameData.usersFetchingVideos?.length !== 0 &&
			this.roundData?.phases[index - 1]?.key === 'prompt'
		) {
			console.log('THERES STILL SOMEONE SEARCHING FOR A VIDEO');
		}

		// If its a transition phase key then don't reset usersFinishedCurrentPhaseArray so those phases can utilize its data
		console.log('NEW PHASE NAME: ' + this.currentPhaseKey);
		if (!this.transitionPhaseKeys.includes(this.currentPhaseKey)) {
			console.log('RESETTING USERS FINISHED: ' + this.currentPhaseKey);
			this.usersFinishedCurrentPhase = [];
		} else if (this.currentPhaseKey === 'outro') {
			this.calculatePoints(this.roundData);
		}

		this.updateRoundAndPhaseData();
		this.notifyPlayers('users_finished', {
			usersFinished: [...this.usersFinishedCurrentPhase],
		});
	}
}

module.exports = GameManager;
