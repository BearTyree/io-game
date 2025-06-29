class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'Game' });
		// State variables
		this.player = null;
		this.platforms = [];
		this.cursors = null;
		this.wasd = null;
		this.score = 0;
		this.scoreText = null;
		this.cursorTarget = null;
		this.cameraTarget = { x: 0, y: 0 };
		this.cameraRecoil = { x: 0, y: 0 };
		this.enemies = [];
		this.blackSquare = null;
		this.click = 'up';
		this.shootTimer = 0;
		this.fireRate = 10;
		this.canDoubleJump = true;
		this.firstJumpInput = true;
		this.health = 20;
		this.wasPlayerOnGround = false;
	}

	init(data) {
		this.startX = data?.x;
		this.startY = data?.y;
		this.initialEnemies = data?.enemies;
		this.id = data?.id;
		this.health = data?.health;
		this.username = data?.username;
	}

	preload() {
		this.load.image('sky', './Assets/sky.png');
	}

	create() {
		this.canDoubleJump = true;
		this.firstJumpInput = true;
		this.health = 20;
		this.wasPlayerOnGround = false;
		this.cameras.main.roundPx = true;
		this.input.manager.canvas.style.cursor = 'none';

		const width = this.scale.width;
		const height = this.scale.height;
		this.bg = this.add.image(width / 2, height / 2, 'sky');
		this.bg.setScrollFactor(0);
		this.bg.setDepth(-1000);

		const scaleX = width / this.bg.width;
		const scaleY = height / this.bg.height;
		const scale = Math.max(scaleX, scaleY);
		this.bg.setScale(scale);

		// Use Matter.js for platforms
		this.platforms = [];
		const platformData = [
			{ x: 800, y: 1300, width: 6000, height: 1000 },
			{ x: -2500, y: -1050, width: 2000, height: 8000 },
			{ x: 4070, y: -1050, width: 2000, height: 8000 },
			{ x: 800, y: 700, width: 1000, height: 32 },
			{ x: 800, y: 200, width: 800, height: 32 },
			{ x: 300, y: 500, width: 200, height: 32 },
			{ x: 1300, y: 500, width: 200, height: 32 },
			{ x: 600, y: 600, width: 100, height: 32 },
			{ x: 1000, y: 600, width: 100, height: 32 },
			{ x: 800, y: 400, width: 150, height: 32 },
			{ x: 400, y: 300, width: 120, height: 32 },
			{ x: 500, y: 300, width: 120, height: 32 },
			{ x: -230, y: 800, width: 500, height: 200 },
			{ x: -230, y: 500, width: 500, height: 50 },
			{ x: -230, y: 0, width: 500, height: 50 },
			{ x: -380, y: 180, width: 200, height: 80 },
			{ x: -600, y: 600, width: 80, height: 30 },
			{ x: -600, y: 300, width: 80, height: 30 },
			{ x: -600, y: 0, width: 80, height: 30 },
			{ x: -1000, y: 600, width: 500, height: 30 },
			{ x: -1430, y: 800, width: 500, height: 200 },
			{ x: -230, y: 300, width: 500, height: 200 },
			{ x: -1030, y: 300, width: 500, height: 200 },
			{ x: -1030, y: -200, width: 500, height: 200 },
			{ x: -1530, y: 400, width: 200, height: 30 },
			{ x: -1130, y: 0, width: 400, height: 30 },
			{ x: -1530, y: 0, width: 200, height: 30 },
			{ x: 230, y: 800, width: 500, height: 200 },
			{ x: -230, y: 500, width: 500, height: 50 },
			{ x: 630, y: 0, width: 500, height: 50 },
			{ x: 380, y: 180, width: 200, height: 80 },
			{ x: 600, y: 600, width: 80, height: 30 },
			{ x: 600, y: 300, width: 80, height: 30 },
			{ x: 600, y: 0, width: 80, height: 30 },
			{ x: 2000, y: 600, width: 500, height: 30 },
			{ x: 2430, y: 800, width: 500, height: 200 },
			// { x: 230, y: 300, width: 500, height: 200 },
			// { x: 1030, y: 300, width: 500, height: 200 },
			// { x: 1030, y: -200, width: 500, height: 200 },
			// { x: 1530, y: 400, width: 200, height: 30 },
			// { x: 1130, y: 0, width: 400, height: 30 },
			// { x: 1530, y: 0, width: 200, height: 30 },
			// { x: 1200, y: 300, width: 120, height: 32 },
			// { x: 200, y: 700, width: 80, height: 32 },
			// { x: 1400, y: 700, width: 80, height: 32 },
			// { x: 800, y: 550, width: 300, height: 120 },
		];

		platformData.forEach((data) => {
			const width = (data.width || 64) * (data.scale || 1);
			const height = (data.height || 32) * (data.scale || 1);
			const rect = this.add.rectangle(data.x, data.y, width, height, 0x888888);
			this.matter.add.gameObject(rect, { isStatic: true });
			this.platforms.push(rect);
		});

		// Player with Matter.js
		this.player = this.add.rectangle(this.startX, this.startY, 32, 48, 0x000000);
		this.matter.add.gameObject(this.player);
		this.player.setFriction(0);
		this.player.setBounce(0);
		this.player.setFixedRotation();

		this.cursors = this.input.keyboard.createCursorKeys();
		this.wasd = this.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			right: Phaser.Input.Keyboard.KeyCodes.D,
		});

		this.input.keyboard.on('keydown-W', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'up' } }));
		});

		this.input.keyboard.on('keyup-W', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'up' } }));
		});

		this.input.keyboard.on('keydown-A', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'left' } }));
		});

		this.input.keyboard.on('keyup-A', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'left' } }));
		});

		this.input.keyboard.on('keydown-D', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'right' } }));
		});

		this.input.keyboard.on('keyup-D', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'right' } }));
		});

		this.input.keyboard.on('keydown-LEFT', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'left' } }));
		});

		this.input.keyboard.on('keyup-LEFT', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'left' } }));
		});

		this.input.keyboard.on('keydown-RIGHT', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'right' } }));
		});

		this.input.keyboard.on('keyup-RIGHT', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'right' } }));
		});

		this.input.keyboard.on('keydown-UP', () => {
			this.game.socket.send(JSON.stringify({ event: 'keydown', data: { key: 'up' } }));
		});

		this.input.keyboard.on('keyup-UP', () => {
			this.game.socket.send(JSON.stringify({ event: 'keyup', data: { key: 'up' } }));
		});

		this.enemies = [];

		this.input.on('pointerdown', () => {
			this.click = 'down';
		});
		this.input.on('pointerup', () => {
			this.click = 'up';
		});

		this.cursorTarget = this.add.graphics();
		this.cursorTarget.lineStyle(2, 0xff0000, 1);
		this.cursorTarget.strokeCircle(0, 0, 10);
		this.cursorTarget.setDepth(1000);

		this.blackSquare = this.add.rectangle(0, 0, 10, 10, 0x000000);
		this.blackSquare.setOrigin(0.5);
		this.blackSquare.setDepth(1001);

		this.cameraTarget.x = this.player.x;
		this.cameraTarget.y = this.player.y;

		this.isPlayerOnGround = false;

		this.initialEnemies.forEach((enemy) => {
			this.spawnEnemy(enemy.position.x, enemy.position.y, enemy.id, enemy.health);
		});

		this.isPlayerOnGround = false;
		this.player.body.onCollideCallback = (pair) => {
			if (this.platforms.includes(pair.bodyB.gameObject) || this.platforms.includes(pair.bodyA.gameObject)) {
				if (this.player.body.velocity.y >= 0) {
					this.isPlayerOnGround = true;
				}
			}
		};
		this.player.body.onCollideEndCallback = () => {
			this.isPlayerOnGround = false;
		};

		this.time.addEvent({
			delay: 3000,
			callback: () => {
				this.game.socket.send(JSON.stringify({ event: 'position', data: { position: { x: this.player.x, y: this.player.y } } }));
			},
			callbackScope: this,
			loop: true,
		});

		this.scale.on('resize', this.resize, this);

		// Reset or recreate the health bar graphics on respawn
		if (this.uiGraphics) {
			this.uiGraphics.destroy();
		}
		this.uiGraphics = this.add.graphics();
		this.uiGraphics.setScrollFactor(0);
		this.uiGraphics.setDepth(9999);
		this.uiGraphics.fillStyle(0x000000, 1);
		this.uiGraphics.fillRect(5, 5, 510, 20);
		this.uiGraphics.setScrollFactor(0);
		this.uiGraphics.setDepth(9999);
		this.uiGraphics.fillStyle(0x00ff00, 1);
		// Draw green health bar based on current health
		const healthBarMaxWidth = 500;
		const healthBarHeight = 10;
		const healthBarX = 10;
		const healthBarY = 10;
		const healthPercent = this.health / 20;
		this.uiGraphics.fillRect(healthBarX, healthBarY, healthBarMaxWidth * healthPercent, healthBarHeight);
	}

	spawnEnemy(x, y, id, health) {
		let enemy = this.add.rectangle(x, y, 32, 48, 0xff0000);
		this.matter.add.gameObject(enemy, { isStatic: false });
		enemy.setFriction(0);
		enemy.setBounce(0);
		enemy.health = health || 20;
		enemy.maxHealth = 20;
		enemy.id = id;
		enemy.healthBar = this.add.graphics();
		enemy.healthBar.setDepth(1002);
		enemy.setFixedRotation();
		enemy.canDoubleJump = true;
		enemy.firstJumpInput = true;
		enemy.wasOnGround = false;
		enemy.body.onCollideCallback = (pair) => {
			if (this.platforms.includes(pair.bodyB.gameObject) || this.platforms.includes(pair.bodyA.gameObject)) {
				if (enemy.body.velocity.y >= 0) {
					enemy.isOnGround = true;
				}
			}
		};

		enemy.body.onCollideEndCallback = () => {
			enemy.isOnGround = false;
		};
		this.enemies.push(enemy);
		return enemy;
	}

	update(time, delta) {
		if (!this.uiGraphics) {
			this.uiGraphics = this.add.graphics();
			this.uiGraphics.setScrollFactor(0);
			this.uiGraphics.setDepth(9999);
		} else {
			this.uiGraphics.clear();
		}
		// Draw background
		this.uiGraphics.fillStyle(0x000000, 1);
		this.uiGraphics.fillRect(5, 5, 510, 20);
		// Draw green health bar based on current health
		const healthBarMaxWidth = 500;
		const healthBarHeight = 10;
		const healthBarX = 10;
		const healthBarY = 10;
		const healthPercent = this.health / 20;
		this.uiGraphics.fillStyle(0x00ff00, 1);
		this.uiGraphics.fillRect(healthBarX, healthBarY, healthBarMaxWidth * healthPercent, healthBarHeight);
		const player = this.player;
		const cursors = this.cursors;
		const wasd = this.wasd;
		let left = cursors.left.isDown || wasd.left.isDown;
		let right = cursors.right.isDown || wasd.right.isDown;
		let up = cursors.up.isDown || wasd.up.isDown;

		this.enemies.forEach((enemy) => {
			if (enemy.left) {
				enemy.setVelocityX(-5);
			} else if (enemy.right) {
				enemy.setVelocityX(5);
			} else {
				enemy.setVelocityX(0);
			}
			// Robust jump logic for enemy
			if (enemy.up && enemy.firstJumpInput) {
				if (enemy.isOnGround) {
					enemy.setVelocityY(-12);
					enemy.firstJumpInput = false;
				} else if (enemy.canDoubleJump) {
					enemy.setVelocityY(-12);
					enemy.canDoubleJump = false;
					enemy.firstJumpInput = false;
				}
			}
			if (!enemy.up) {
				enemy.firstJumpInput = true;
			}
			if (enemy.isOnGround && !enemy.wasOnGround) {
				enemy.canDoubleJump = true;
			}
			enemy.wasOnGround = enemy.isOnGround;
		});

		if (left) {
			player.setVelocityX(-5);
		} else if (right) {
			player.setVelocityX(5);
		} else {
			player.setVelocityX(0);
		}

		// Robust jump logic
		if (up && this.firstJumpInput) {
			if (this.isPlayerOnGround) {
				player.setVelocityY(-12);
				this.firstJumpInput = false;
			} else if (this.canDoubleJump) {
				player.setVelocityY(-12);
				this.canDoubleJump = false;
				this.firstJumpInput = false;
			}
		}
		if (!up) {
			this.firstJumpInput = true;
		}
		// Only reset canDoubleJump when landing (transition from air to ground)
		if (this.isPlayerOnGround && !this.wasPlayerOnGround) {
			this.canDoubleJump = true;
		}
		this.wasPlayerOnGround = this.isPlayerOnGround;

		const pointer = this.input.activePointer;
		const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
		this.cursorTarget.x = pointerWorld.x;
		this.cursorTarget.y = pointerWorld.y;

		const dx = pointerWorld.x - player.x;
		const dy = pointerWorld.y - player.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const radius = 30;
		const offsetX = (dx / length) * radius;
		const offsetY = (dy / length) * radius;
		this.blackSquare.x = player.x + offsetX;
		this.blackSquare.y = player.y + offsetY;
		this.blackSquare.rotation = Math.atan2(dy, dx);

		if (this.shootTimer == 0) {
			if (this.click == 'down') {
				this.shootRay(pointer);
			}
		} else {
			this.shootTimer -= delta;
			if (this.shootTimer < 0) {
				this.shootTimer = 0;
			}
		}

		let lerp = 0.1;
		let targetX = Phaser.Math.Interpolation.Linear([player.x, pointerWorld.x + this.cameraRecoil.x], 0.2);
		let targetY = Phaser.Math.Interpolation.Linear([player.y, pointerWorld.y + this.cameraRecoil.y], 0.2);
		this.cameraTarget.x += (targetX - this.cameraTarget.x) * lerp;
		this.cameraTarget.y += (targetY - this.cameraTarget.y) * lerp;
		this.cameras.main.centerOn(this.cameraTarget.x, this.cameraTarget.y);

		this.enemies.forEach((enemy) => {
			if (!enemy.active) return;
			const barWidth = 32;
			const barHeight = 5;
			const healthPercent = enemy.health / enemy.maxHealth;
			enemy.healthBar.clear();
			enemy.healthBar.fillStyle(0x000000, 1);
			enemy.healthBar.fillRect(enemy.x - barWidth / 2, enemy.y - 28, barWidth, barHeight);
			enemy.healthBar.fillStyle(0x00ff00, 1);
			enemy.healthBar.fillRect(enemy.x - barWidth / 2 + 1, enemy.y - 28 + 1, (barWidth - 2) * healthPercent, barHeight - 2);
		});
	}

	showEnemyKilledText(x, y) {
		const text = this.add.text(x, y - 40, 'Enemy Killed', {
			font: '20px Arial',
			fill: '#ff4444',
			stroke: '#000',
			strokeThickness: 3,
			align: 'center',
		});
		text.setOrigin(0.5);
		text.setDepth(2000);
		this.tweens.add({
			targets: text,
			y: y - 80,
			alpha: 0,
			duration: 800,
			ease: 'Cubic.easeOut',
			onComplete: () => text.destroy(),
		});
	}

	enemyShoot(start, hitPoint) {
		const graphics = this.add.graphics();
		graphics.lineStyle(3, 0xffff00, 1);
		graphics.beginPath();
		graphics.moveTo(start.x, start.y);
		graphics.lineTo(hitPoint.x, hitPoint.y);
		graphics.strokePath();
		graphics.fillStyle(0xffff00, 1);
		graphics.fillCircle(hitPoint.x, hitPoint.y, 20);
		this.time.delayedCall(1000 / (this.fireRate * 10), () => {
			graphics.destroy();
		});
	}

	shootRay(pointer) {
		if (!this.player.active) return;
		this.shootTimer = 1000 / this.fireRate;
		const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
		const dx = pointerWorld.x - this.player.x;
		const dy = pointerWorld.y - this.player.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const radius = 30;
		const offsetX = (dx / length) * radius;
		const offsetY = (dy / length) * radius;
		const start = new Phaser.Geom.Point(this.player.x + offsetX, this.player.y + offsetY);
		const scale = 100000 / length;
		const end = new Phaser.Geom.Point(this.player.x + dx * scale, this.player.y + dy * scale);
		let hitEnemy = null;
		let minDist = Infinity;
		let hitPoint = end;
		const ray = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);

		this.enemies.forEach((enemy) => {
			if (!enemy.active) return;
			const rect = new Phaser.Geom.Rectangle(enemy.x - 16, enemy.y - 16, 32, 32);
			const intersectPoint = this.getLineRectIntersection(ray, rect);
			if (intersectPoint) {
				const dist = Phaser.Math.Distance.Between(start.x, start.y, intersectPoint.x, intersectPoint.y);
				if (dist < minDist) {
					minDist = dist;
					hitEnemy = enemy;
					hitPoint = intersectPoint;
				}
			}
		});

		this.platforms.forEach((platform) => {
			const platRect = new Phaser.Geom.Rectangle(
				platform.x - platform.width / 2,
				platform.y - platform.height / 2,
				platform.width,
				platform.height
			);
			const platIntersect = this.getLineRectIntersection(ray, platRect);
			if (platIntersect) {
				const dist = Phaser.Math.Distance.Between(start.x, start.y, platIntersect.x, platIntersect.y);
				if (dist < minDist) {
					minDist = dist;
					hitEnemy = null;
					hitPoint = platIntersect;
				}
			}
		});

		if (hitEnemy) {
			hitEnemy.health -= 1;
			if (hitEnemy.health <= 0) {
				this.enemies.splice(
					this.enemies.findIndex((e) => e.id == hitEnemy.id),
					1
				);
				hitEnemy.healthBar.destroy();
				this.showEnemyKilledText(hitEnemy.x, hitEnemy.y);
				hitEnemy.destroy();
			}
			this.game.socket.send(JSON.stringify({ event: 'hit', data: { id: hitEnemy.id } }));
		}

		let shotAngle = Math.atan2(dy, dx);
		const graphics = this.add.graphics();
		graphics.lineStyle(3, 0xffff00, 1);
		graphics.beginPath();
		graphics.moveTo(start.x, start.y);
		graphics.lineTo(hitPoint.x, hitPoint.y);
		graphics.strokePath();
		graphics.fillStyle(0xffff00, 1);
		graphics.fillCircle(this.player.x + Math.cos(shotAngle) * 70, this.player.y + Math.sin(shotAngle) * 70, 20);
		graphics.fillCircle(hitPoint.x, hitPoint.y, 20);
		this.game.socket.send(JSON.stringify({ event: 'shoot', data: { start, hitPoint } }));

		let recoilAngle = shotAngle + Math.PI;
		let recoilDistance = 300;
		let recoilX = this.player.x + Math.cos(recoilAngle) * recoilDistance;
		let recoilY = this.player.y + Math.sin(recoilAngle) * recoilDistance;

		this.cameraRecoil.x += recoilX - this.player.x;
		this.cameraRecoil.y += recoilY - this.player.y;
		this.time.delayedCall(1000 / (this.fireRate * 10), () => {
			graphics.destroy();
		});
		this.time.delayedCall(1000 / (this.fireRate * 2), () => {
			this.cameraRecoil.x -= recoilX - this.player.x;
			this.cameraRecoil.y -= recoilY - this.player.y;
		});
	}

	getLineRectIntersection(line, rect) {
		const points = [];
		const rectLines = [
			new Phaser.Geom.Line(rect.x, rect.y, rect.x + rect.width, rect.y),
			new Phaser.Geom.Line(rect.x, rect.y, rect.x, rect.y + rect.height),
			new Phaser.Geom.Line(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height),
			new Phaser.Geom.Line(rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height),
		];
		for (let edge of rectLines) {
			const out = new Phaser.Geom.Point();
			if (Phaser.Geom.Intersects.LineToLine(line, edge, out)) {
				points.push({ x: out.x, y: out.y });
			}
		}
		if (points.length === 0) return null;
		points.sort((a, b) => {
			const da = Phaser.Math.Distance.Between(line.x1, line.y1, a.x, a.y);
			const db = Phaser.Math.Distance.Between(line.x1, line.y1, b.x, b.y);
			return da - db;
		});
		return points[0];
	}

	resize(gameSize, baseSize, displaySize, resolution) {
		const width = gameSize.width;
		const height = gameSize.height;
		if (this.bg) {
			this.bg.setPosition(width / 2, height / 2);
			const scaleX = width / this.bg.width;
			const scaleY = height / this.bg.height;
			const scale = Math.max(scaleX, scaleY);
			this.bg.setScale(scale);
		}
	}

	onSocketMessage(event, data) {
		switch (event) {
			case 'enemy_join': {
				const { position, id } = data;
				this.spawnEnemy(position.x, position.y, id);
				break;
			}
			case 'enemy_keydown': {
				const { id, key } = data;
				const enemy = this.enemies.find((e) => e.id === id);
				if (enemy) {
					enemy[key] = true;
				}
				break;
			}
			case 'enemy_keyup': {
				const { id, key } = data;
				const enemy = this.enemies.find((e) => e.id === id);
				if (enemy) {
					enemy[key] = false;
				}
				break;
			}
			case 'enemy_position': {
				const { id, position } = data;
				const enemy = this.enemies.find((e) => e.id === id);
				if (enemy) {
					enemy.x = position.x;
					enemy.y = position.y;
				}
				break;
			}
			case 'enemy_shoot': {
				const { id, start, hitPoint } = data;
				const enemy = this.enemies.find((e) => e.id === id);
				if (enemy) {
					this.enemyShoot(start, hitPoint);
				}
				break;
			}
			case 'enemy_hit': {
				const { id } = data;
				if (id == this.id) {
					this.health -= 1;
					if (this.health < 1) {
						this.scene.start('Menu', { username: this.username });
					}
					return;
				}
				const enemy = this.enemies.find((e) => e.id === id);
				if (enemy) {
					enemy.health -= 1;
				}
				break;
			}
		}
	}
}

window.Game = GameScene;
