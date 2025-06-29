class Menu extends Phaser.Scene {
	constructor() {
		super({ key: 'Menu' });
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

		const startButton = this.add
			.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', {
				fontSize: '32px',
				color: '#00ff00',
				backgroundColor: '#222',
				padding: { x: 20, y: 10 },
				fontFamily: 'Arial',
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		startButton.on('pointerdown', () => {
			this.game.socket.send(JSON.stringify({ event: 'start' }));
		});
	}

	onSocketMessage(event, data) {
		switch (event) {
			case 'start': {
				const { startPosition, enemies, id, health } = data;

				// Remove name input when starting game
				if (this.nameInput) {
					document.body.removeChild(this.nameInput);
					this.nameInput = null;
				}

				this.scene.start('Game', { x: startPosition.x, y: startPosition.y, enemies, id, health });
			}
		}
	}
}

window.Menu = Menu;
