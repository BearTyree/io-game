class Menu extends Phaser.Scene {
	constructor() {
		super({ key: 'Menu' });
	}

	init(data) {
		this.username = data?.username;
	}
	preload() {}

	create() {
		this.add
			.text(this.scale.width / 2, this.scale.height / 2 - 100, 'Game', {
				fontSize: '48px',
				color: '#ffffff',
				fontFamily: 'Arial',
			})
			.setOrigin(0.5);

		this.nameInput = document.createElement('input');
		this.nameInput.type = 'text';
		this.nameInput.placeholder = 'Enter your name';
		this.nameInput.value = this.username || '';
		this.nameInput.style.position = 'absolute';
		this.nameInput.style.width = '200px';
		this.nameInput.style.fontSize = '24px';

		const parent = this.game.canvas.parentNode;
		parent.appendChild(this.nameInput);

		this.nameInput.style.left = `${this.scale.width / 2 - 100}px`;
		this.nameInput.style.top = `${this.scale.height / 2 - 70}px`;

		const startButton = this.add
			.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', {
				fontSize: '32px',
				color: '#00ff00',
				backgroundColor: '#222',
				margin: { y: 100 },
				padding: { x: 20, y: 10 },
				fontFamily: 'Arial',
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		startButton.on('pointerdown', () => {
			const playerName = this.nameInput ? this.nameInput.value : '';
			this.game.socket.send(JSON.stringify({ event: 'start', data: { username: playerName } }));
		});
	}

	onSocketMessage(event, data) {
		switch (event) {
			case 'start': {
				const { startPosition, enemies, id, health, kills, matchStartedAt } = data;
				const playerName = this.nameInput ? this.nameInput.value : '';

				if (this.nameInput) {
					document.body.removeChild(this.nameInput);
					this.nameInput = null;
				}

				if (matchStartedAt) {
					const now = new Date();
					const startedAt = new Date(matchStartedAt);
					const diffMs = now - startedAt;
					if (diffMs > 1000 * 60 * 4.666) {
						this.scene.start('EndScreen', { scoreboard: [...enemies, { username: playerName, kills }] });
						return;
					}
				}
				this.scene.start('Game', {
					x: startPosition.x,
					y: startPosition.y,
					enemies,
					id,
					health,
					username: playerName,
					kills,
					matchStartedAt,
				});
				break;
			}
		}
	}
}

window.Menu = Menu;
