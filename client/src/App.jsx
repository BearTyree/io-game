import Phaser from 'phaser';
import Game from './Game';
import { useRef } from 'react';

function App() {
	const phaserRef = useRef();
	return (
		<>
			<Game ref={phaserRef} />
		</>
	);
}

export default App;
