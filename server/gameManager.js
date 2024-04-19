class GameManager {
	constructor(lobbyId, io, players, totalRounds = 3) {
		this.lobbyId = lobbyId;
		this.io = io;
		this.players = players;
		this.videos = this.loadVideos();
		this.currentVideoIndex = 0;
		this.rounds = {};
		this.currentRound = 1;
		this.totalRounds = totalRounds;
		this.initRounds();
	}

	initRounds() {
		this.rounds[this.currentRound] = this.players.map((player) => ({
			userToken: player.userToken,
			email: player.email,
			caption: '',
			voted: false,
		}));
	}

	start() {
		this.notifyPlayers('game_started', {
			lobbyId: this.lobbyId,
			video: this.videos[this.currentVideoIndex],
			round: this.currentRound,
		});
	}

	loadVideos() {
		return []; // Placeholder: Implement actual video loading logic here
	}

	handleAction(actionType, data) {
		switch (actionType) {
			case 'submit_caption':
				console.log('user ' + data.userToken + ' submitted caption: ' + data.caption);
				this.submitCaption(data.userToken, data.videoId, data.caption);
				break;
			case 'vote_caption':
				this.voteCaption(data.userToken, data.captionId);
				break;
			default:
				console.error(`Unhandled action type: ${actionType}`);
			// socket.emit('action_error', { message: 'Unhandled action type' });
		}
	}

	submitCaption(userToken, videoId, caption) {
		let roundData = this.rounds[this.currentRound];
		let playerData = roundData.find((p) => p.userToken === userToken);
		if (playerData && !playerData.caption) {
			playerData.caption = caption;
			this.notifyPlayers('caption_submitted', {
				userToken: userToken,
				videoId: videoId,
				caption: caption,
			});

			if (roundData.every((p) => p.caption !== '')) {
				this.startVoting(); // All players have submitted captions, start voting
			}
		}
	}

	startVoting() {
		this.notifyPlayers('voting_started', {
			round: this.currentRound,
			captions: this.rounds[this.currentRound].map((p) => ({
				userToken: p.userToken,
				caption: p.caption,
			})),
		});
	}

	voteCaption(playerId, captionId) {
		let roundData = this.rounds[this.currentRound];
		let playerData = roundData.find((p) => p.userToken === playerId);
		if (playerData && !playerData.voted) {
			playerData.voted = true;
			this.notifyPlayers('vote_submitted', { playerId, captionId });

			if (roundData.every((p) => p.voted)) {
				this.changeRound(); // Check if it's time to change the round
			}
		}
	}

	changeRound() {
		if (this.currentRound === this.totalRounds) {
			this.endGame();
		} else {
			this.currentRound++;
			this.initRounds(); // Reinitialize the round data for the new round
			this.notifyPlayers('round_change', this.currentRound);
			this.start(); // Start the new round
		}
	}

	// This is how the game communicates to all players in it
	notifyPlayers(event, data) {
		this.io.to(this.lobbyId).emit('notify_players', { event, data });
	}

	endGame() {
		this.notifyPlayers('game_ended', { scores: this.calculateScores() });
		console.log(`Game in lobby ${this.lobbyId} ended.`);
	}

	calculateScores() {
		// Implement score calculation logic
		return {};
	}
}

module.exports = GameManager; // Exporting GameManager class
