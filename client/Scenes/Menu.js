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
			this.scene.start('Game');
		});
	}
}

window.Menu = Menu;
