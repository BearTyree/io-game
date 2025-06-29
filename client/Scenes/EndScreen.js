class EndScreen extends Phaser.Scene {
	constructor() {
		super({ key: 'EndScreen' });
	}

	init(data) {
		this.scoreboard = data?.scoreboard;
		console.log(data);
	}
	preload() {}

	create() {
		if (!this.scoreboard || !Array.isArray(this.scoreboard)) return;

		const sorted = [...this.scoreboard].sort((a, b) => b.kills - a.kills);

		this.add.text(400, 100, 'Scoreboard', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

		sorted.forEach((entry, i) => {
			const text = `${i + 1}. ${entry.username} - ${entry.kills} kills`;
			this.add.text(400, 160 + i * 32, text, { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
		});

		this.add.text(400, 160 + sorted.length * 32, 'Starting Next Match....', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
	}

	onSocketMessage(event, data) {
		switch (event) {
			case 'start_match': {
				const { startPosition, username, enemies, id, health, kills, matchStartedAt } = data;
				this.scene.start('Game', {
					x: startPosition.x,
					y: startPosition.y,
					enemies,
					id,
					health,
					username: username,
					kills,
					matchStartedAt,
				});
				break;
			}
		}
	}
}

window.EndScreen = EndScreen;
