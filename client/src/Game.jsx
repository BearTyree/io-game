import { forwardRef, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { useEffect } from 'react';

const PhaserGame = forwardRef(function PhaserGame(ref) {
	const game = useRef();

	useLayoutEffect(() => {
		if (game.current === undefined) {
			game.current = StartGame('game-container');

			if (ref !== null) {
				ref.current = { game: game.current, scene: null };
			}
		}

		return () => {
			if (game.current) {
				game.current.destroy(true);
				game.current = undefined;
			}
		};
	}, [ref]);

	useEffect(() => {
		EventBus.on('current-scene-ready', (currentScene) => {
			ref.current.scene = currentScene;
		});

		return () => {
			EventBus.removeListener('current-scene-ready');
		};
	}, [ref]);

	return <div id="game-container"></div>;
});

export default PhaserGame;
