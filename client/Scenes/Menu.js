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

		// Create an HTML input for the player name
		this.nameInput = document.createElement('input');
		this.nameInput.type = 'text';
		this.nameInput.placeholder = 'Enter your name';
		this.nameInput.style.position = 'absolute';
		this.nameInput.style.width = '200px';
		this.nameInput.style.fontSize = '24px';

		// Append to the Phaser canvas parent (container)
		const parent = this.game.canvas.parentNode;
		parent.appendChild(this.nameInput);

		// Position input relative to the canvas
		this.nameInput.style.left = `${this.scale.width / 2 - 100}px`;
		this.nameInput.style.top = `${this.scale.height / 2 - 70}px`; // Move input higher to avoid overlap

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
