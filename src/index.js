import { DurableObject } from 'cloudflare:workers';

export class GameServer extends DurableObject {
	constructor(state, env) {
		super(state, env);
		this.env = env;
		this.state = state;
		this.storage = state.storage;
		this.state.blockConcurrencyWhile(async () => {
			this.matchStartedAt = (await this.storage.get('match_started_at')) || new Date().toISOString();
			this.saveState();
		});
		this.sessions = new Map();
		this.state.getWebSockets().forEach((webSocket) => {
			let meta = webSocket.deserializeAttachment();
			this.sessions.set(webSocket, { ...meta });
		});
	}

	async saveState() {
		await this.storage.put('match_started_at', this.matchStartedAt);
	}

	async fetch() {
		let pair = new WebSocketPair();

		await this.handleSession(pair[1]);

		return new Response(null, {
			status: 101,
			webSocket: pair[0],
			headers: {
				Upgrade: 'websocket',
				Connection: 'Upgrade',
			},
		});
	}

	async handleSession(ws) {
		this.state.acceptWebSocket(ws);
		this.sessions.set(ws, { id: crypto.randomUUID() });
	}

	async webSocketClose(ws) {
		this.sessions.delete(ws);
	}

	async webSocketError(ws, error) {
		this.sessions.delete(ws);
		console.log(error);
	}

	async webSocketMessage(ws, message, env) {
		const { event, data } = JSON.parse(message);

		switch (event) {
			case 'start': {
				const { username } = data;
				const startPosition = { x: Math.random() * -2000 * Math.sign(Math.random() - 0.5) + 1000, y: -100 * Math.random() };
				let session = this.sessions.get(ws) || {};
				session.position = startPosition;
				if (!session.kills) {
					session.kills = 0;
				}

				session.health = 20;
				session.username = username;

				this.sessions.set(ws, session);
				ws.serializeAttachment(session);

				const join = { id: session.id, position: startPosition, kills: session.kills, username: session.username };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_join', data: join }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});

				const enemies = Array.from(this.sessions.entries())
					.map((entry) => entry[1])
					.filter((enemy) => enemy.position && enemy.id != session.id);
				ws.send(
					JSON.stringify({
						event: 'start',
						data: {
							matchStartedAt: this.matchStartedAt,
							startPosition,
							enemies,
							id: session.id,
							health: session.health,
							kills: session.kills,
						},
					})
				);
				break;
			}
			case 'keydown': {
				const { key } = data;
				let session = this.sessions.get(ws) || {};

				session[key] = true;

				this.sessions.set(ws, session);
				ws.serializeAttachment(session);

				const update = { id: session.id, key };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_keydown', data: update }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});
				break;
			}
			case 'keyup': {
				const { key } = data;
				let session = this.sessions.get(ws) || {};

				session[key] = false;

				this.sessions.set(ws, session);
				ws.serializeAttachment(session);

				const update = { id: session.id, key };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_keyup', data: update }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});
				break;
			}
			case 'position': {
				const { position } = data;
				let session = this.sessions.get(ws) || {};

				session.position.x = position.x;
				session.position.y = position.y;

				this.sessions.set(ws, session);
				ws.serializeAttachment(session);

				const update = { id: session.id, position };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_position', data: update }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});
				break;
			}
			case 'shoot': {
				const { start, hitPoint } = data;
				let session = this.sessions.get(ws) || {};

				const update = { id: session.id, start, hitPoint };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_shoot', data: update }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});
				break;
			}
			case 'hit': {
				const { id } = data;
				const shooterSession = this.sessions.get(ws);

				for (const [otherWs, session] of this.sessions.entries()) {
					if (session.id === id) {
						session.health = (session.health || 0) - 1;
						this.sessions.set(otherWs, session);
						otherWs.serializeAttachment(session);
						if (session.health < 1) {
							shooterSession.kills += 1;
							this.sessions.set(ws, shooterSession);
							ws.serializeAttachment(shooterSession);
							this.sessions.forEach((_, otherWs) => {
								if (otherWs !== ws) {
									try {
										otherWs.send(JSON.stringify({ event: 'enemy_kills', data: { id: shooterSession.id, kills: shooterSession.kills } }));
									} catch (error) {
										this.sessions.delete(otherWs);
									}
								}
							});
						}
						break;
					}
				}

				const update = { id };
				this.sessions.forEach((_, otherWs) => {
					if (otherWs !== ws) {
						try {
							otherWs.send(JSON.stringify({ event: 'enemy_hit', data: update }));
						} catch (error) {
							this.sessions.delete(otherWs);
						}
					}
				});

				break;
			}
			case 'chat': {
				const { message } = data;
				let session = this.sessions.get(ws) || {};

				await this.broadcastMessage('chat', { message, username: session.username });

				break;
			}
		}
	}

	async broadcastMessage(event, data) {
		this.sessions.forEach((_, ws) => {
			try {
				ws.send(JSON.stringify({ event, data }));
			} catch (error) {
				this.sessions.delete(ws);
			}
		});
	}

	async startNewMatch() {
		this.matchStartedAt = new Date().toISOString();
		this.saveState();

		this.sessions.forEach((_, ws) => {
			const startPosition = { x: Math.random() * -2000 * Math.sign(Math.random() - 0.5) + 1000, y: -100 * Math.random() };
			let session = this.sessions.get(ws) || {};
			session.position = startPosition;
			session.health = 20;

			this.sessions.set(ws, session);
			ws.serializeAttachment(session);

			const enemies = Array.from(this.sessions.entries())
				.map((entry) => entry[1])
				.filter((enemy) => enemy.position && enemy.id != session.id);

			try {
				otherWs.send(
					JSON.stringify({
						event: 'start_match',
						data: {
							matchStartedAt: this.matchStartedAt,
							startPosition,
							enemies,
							id: session.id,
							health: session.health,
							kills: session.kills,
						},
					})
				);
			} catch (error) {
				this.sessions.delete(otherWs);
			}
		});
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		let path = url.pathname.split('/');
		path.splice(0, 1);

		switch (path[0]) {
			case 'ws': {
				const id = env.SERVER.idFromName('main');
				const stub = env.SERVER.get(id);
				return stub.fetch(request);
			}
			default:
				return new Response('Hello from the api', { status: 200 });
		}
	},

	async scheduled(event, env, ctx) {
		const id = env.SERVER.idFromName('main');
		const stub = env.SERVER.get(id);
		stub.startNewMatch();
	},
};

// startNew match
// set everyone's scores to zero
// set the match start to now
// if the start of the match was more than 5 minutes ago transition to scoreboard scene
// if joined and match started within 20 seconds ago transition to scoreboard scene
// start of match is more than 20 seconds ago transition to match scene
// on a kill add points to a websocket
// send out player stats on every kill and generate the leaderboard
