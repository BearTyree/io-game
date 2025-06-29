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

		// Create name input
		this.nameInput = document.createElement('input');
		this.nameInput.type = 'text';
		this.nameInput.placeholder = 'Enter your name';
		this.nameInput.style.position = 'absolute';
		this.nameInput.style.left = `${this.game.canvas.offsetLeft + this.scale.width / 2 - 100}px`;
		this.nameInput.style.top = `${this.game.canvas.offsetTop + this.scale.height / 2 - 60}px`;
		this.nameInput.style.width = '200px';
		this.nameInput.style.fontSize = '20px';
		this.nameInput.style.textAlign = 'center';
		document.body.appendChild(this.nameInput);

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
			const username = this.nameInput.value || 'Player';
			this.game.socket.send(JSON.stringify({ event: 'start', data: { username } }));
		});
	}

	onSocketMessage(event, data) {
		switch (event) {
			case 'start': {
				const { startPosition, enemies } = data;

				// Remove name input when starting game
				if (this.nameInput) {
					document.body.removeChild(this.nameInput);
					this.nameInput = null;
				}

				this.scene.start('Game', { x: startPosition.x, y: startPosition.y, enemies });
			}
		}
	}
}

window.Menu = Menu;
