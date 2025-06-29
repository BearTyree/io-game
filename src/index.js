import { DurableObject } from 'cloudflare:workers';

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/**
 * Env provides a mechanism to reference bindings declared in wrangler.jsonc within JavaScript
 *
 * @typedef {Object} Env
 * @property {DurableObjectNamespace} MY_DURABLE_OBJECT - The Durable Object namespace binding
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
	constructor(state, env) {
		super(state, env);
		this.env = env;
		this.state = state;
		this.storage = state.storage;
		this.sessions = new Map();
		this.state.getWebSockets().forEach((webSocket) => {
			let meta = webSocket.deserializeAttachment();
			this.sessions.set(webSocket, { ...meta });
		});
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
				const startPosition = { x: Math.random() * -2000 * Math.sign(Math.random() - 0.5) + 1000, y: -100 * Math.random() };
				let session = this.sessions.get(ws) || {};
				session.position = startPosition;
				session.health = 20;

				this.sessions.set(ws, session);
				ws.serializeAttachment(session);

				const join = { id: session.id, position: startPosition };
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
				ws.send(JSON.stringify({ event: 'start', data: { startPosition, enemies, id: session.id, health: session.health } }));
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

				for (const [otherWs, session] of this.sessions.entries()) {
					if (session.id === id) {
						session.health = (session.health || 0) - 1;
						this.sessions.set(otherWs, session);
						otherWs.serializeAttachment(session);
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
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		let path = url.pathname.split('/');
		path.splice(0, 1);

		switch (path[0]) {
			case 'ws': {
				const id = env.MY_DURABLE_OBJECT.idFromName('foo');
				const stub = env.MY_DURABLE_OBJECT.get(id);
				return stub.fetch(request);
			}
			default:
				return new Response('Hello from the api', { status: 200 });
		}
	},
};
