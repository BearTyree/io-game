import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';

const config = {
	type: Phaser.AUTO,
	width: 1024,
	height: 768,
	parent: 'game-container',
	backgroundColor: '#028af8',
	scene: [Boot, Preloader, Game],
};

const StartGame = (parent) => {
	return new Phaser.Game({ ...config, parent });
};

export default StartGame;
