const gameModeConfig = require('./gameModes.json');
const Game = require('./sequence/game');

class GameManager {
	constructor({ lobbyId, io, players, hostUserToken, gameMode = 'Standard' }) {
		this.lobbyId = lobbyId;
		this.io = io;
		this.players = players;
		this.videos = {};

		this.game = null;
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
			winner: null,
			finalScores: [],
			rounds: [],
		};

		this.roundData = {};
		this.phaseData = {};
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
				scores: {},
				videoAssignments: this.players.map((player) => ({
					userToken: player.userToken,
					prompterUserToken: null,
					prompt: '',
					video: null,
					videoDuration: 0,
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
		this.game.start();
	}

	calculatePoints() {
		this.updateRoundAndPhaseData();
		const roundData = this.roundData;
		if (!roundData || !roundData.scores) {
			console.error('Invalid roundData or missing scores:', roundData);
			return;
		}

		this.scores = this.scores;

		const votesToPts = 100; // Conversion rate: 1 vote = 100 points
		const multiplier = roundData.multiplier;

		this.players.forEach((player) => {
			const userToken = player.userToken;

			roundData.scores[userToken] = {
				pointsEarned: 0,
				votePointsEarned: 0,
				votesReceived: 0,
				bonusPointsEarned: 0,
				majorityBonus: { received: false, ptsReceived: 0 },
				diversityBonus: { received: false, ptsReceived: 0 },
				consistencyBonus: { received: false, ptsReceived: 0 },
				winnerBonus: { received: false, ptsReceived: 0 },
				pityPartyBonus: { received: false, ptsReceived: 0 },
				selflessBonus: { received: false, ptsReceived: 0 },
			};

			// Base points for votes received (excluding self-votes)
			const votePhase = roundData.phases.find((phase) => phase.key === 'vote');
			if (!votePhase || !votePhase.userData) {
				console.error('Invalid vote phase data:', votePhase);
				return;
			}

			const votesReceivedData = votePhase.userData.filter(
				(userVote) => userVote.results.vote && userVote.userToken !== userToken // excluding self-votes
			);
			console.log('VOTES RECIEVED DATA (GAMEMANAGER)' + JSON.stringify(votePhase));
			const votesReceived = votesReceivedData.length;
			roundData.scores[userToken].votesReceived = votesReceived;
			const votePoints = votesReceived * votesToPts;
			roundData.scores[userToken].votePointsEarned = votePoints;

			// Bonuses
			let bonusPoints = 0;

			// Majority Bonus
			if (votesReceived > this.players.length / 2) {
				roundData.scores[userToken].majorityBonus = { received: true, ptsReceived: 100 };
				bonusPoints += 100;
			}

			// Diversity Bonus
			const uniqueVoters = [...new Set(votesReceivedData.map((vote) => vote.userToken))];
			const mostUniqueVoters = Math.max(
				...Object.values(roundData.scores).map((score) => score.votesReceived)
			);
			if (uniqueVoters.length === mostUniqueVoters) {
				roundData.scores[userToken].diversityBonus = { received: true, ptsReceived: 100 };
				bonusPoints += 100;
			}

			// Consistency Bonus
			const previousRoundData = this.gameData.rounds[this.currentRoundIndex - 1];
			if (previousRoundData && previousRoundData.scores && previousRoundData.scores[userToken]) {
				const previousPoints = previousRoundData.scores[userToken].pointsEarned;
				if (previousPoints && previousPoints >= votePoints) {
					roundData.scores[userToken].consistencyBonus = { received: true, ptsReceived: 50 };
					bonusPoints += 50;
				}
			}

			// Winner Bonus
			const highestVotes = Math.max(
				...Object.values(roundData.scores).map((score) => score.votesReceived)
			);
			if (votesReceived === highestVotes) {
				roundData.scores[userToken].winnerBonus = { received: true, ptsReceived: 200 };
				bonusPoints += 200;
			}

			// Pity Party Bonus
			if (votesReceived === 0) {
				roundData.scores[userToken].pityPartyBonus = { received: true, ptsReceived: 10 };
				bonusPoints += 10;
			}

			// Selfless Bonus
			const hasSelfVotes = votePhase.userData.some(
				(vote) => vote.results.vote && vote.userToken === userToken
			);
			if (!hasSelfVotes) {
				roundData.scores[userToken].selflessBonus = { received: true, ptsReceived: 25 };
				bonusPoints += 25;
			}

			roundData.scores[userToken].bonusPointsEarned = bonusPoints;
			roundData.scores[userToken].pointsEarned = (votePoints + bonusPoints) * multiplier;
		});

		console.log('GAME ROUND SCORE DATA: ' + JSON.stringify(roundData.scores));
		this.notifyPlayers('score_data_update', {
			roundScoreData: roundData.scores,
		});
	}

	calculateFinalScores() {
		// Initialize the final scores array
		const finalScores = this.players.map((player) => ({
			userToken: player.userToken,
			totalPoints: 0,
		}));

		// Iterate through all rounds to aggregate each player's points
		this.gameData.rounds.forEach((round) => {
			Object.keys(round.scores).forEach((userToken) => {
				const playerScore = finalScores.find((score) => score.userToken === userToken);
				if (playerScore) {
					playerScore.totalPoints += round.scores[userToken].pointsEarned;
				}
			});
		});

		// Assign the aggregated scores to the gameData.finalScores array
		this.gameData.finalScores = finalScores;

		console.log('FINAL SCORES:', this.gameData.finalScores);
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

		// If all players are FINISHED at the same time, checks if the phase hasn't changed too
		if (
			this.usersFinishedCurrentPhase.length === this.players.length &&
			(this.currentPhaseKey === key || this.players.length === 1)
		) {
			// If all players are finished its a transition, intro, or outro phase then we want to not wipe usersFinished
			console.log('ALL PLAYERS FINISHED PHASE');
			this.game.rounds[this.currentRoundIndex].phases[this.currentPhaseIndex].stopPhase();
		}

		this.currentPhaseKey = key;
		switch (key) {
			case 'prompt':
				console.log(userToken + ' USER KEYWORD: ' + data.prompt);
				const generatedVideo = this.fetchYouTubeVideo(data.prompt);
				playerData.results.prompt = data.prompt;
				playerData.results.generatedVideo = generatedVideo;
				// base the assignment off the gameMode config
				// async fetch youtube video with keyword - give 1 of random array for testing
				//
				let unassignedPlayers = this.roundData.videoAssignments.filter((v) => v.video === null);
				if (unassignedPlayers.length > 0) {
					// Randomly pick one unassigned player to assign a video
					let randomIndex = Math.floor(Math.random() * unassignedPlayers.length);
					let selectedPlayer = unassignedPlayers[randomIndex];
					selectedPlayer.prompterUserToken = userToken;
					selectedPlayer.prompt = data.prompt;
					selectedPlayer.video = generatedVideo;
					selectedPlayer.videoDuration = 20; // ARBITRARY VALUE FOR NOW
				}
				console.log('VIDEO ASSIGNMENTS: ' + JSON.stringify(this.roundData.videoAssignments));
				break;
			case 'caption':
				console.log(userToken + ' USER CAPTIONED: ' + data.caption);
				playerData.results.caption = data.caption;
				break;
			case 'preview':
				console.log(userToken + ' USER FINISHED PREVIEWING VIDEOS');
				break;
			case 'vote':
				console.log(userToken + ' USER VOTED: ' + JSON.stringify(data.vote));
				playerData.results.vote = data.vote;
				break;
		}

		this.updateRoundAndPhaseData();
		this.notifyPlayers('player_action_response', {
			userToken: userToken,
			isFinished: isFinished,
			usersFinished: [...this.usersFinishedCurrentPhase],
		});

		console.log('currentPhaseData: ' + JSON.stringify(this.phaseData));
	}

	fetchYouTubeVideo(keyword) {
		// if (keyword === '') {
		// 	keyword = this.getAIKeyword();
		// }

		const shortURLS = [
			'https://www.youtube.com/shorts/x6iwZSURP44',
			'https://www.youtube.com/shorts/z7-5tzA1XUM',
			'https://www.youtube.com/watch?v=VqOu4QYQpu0',
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
