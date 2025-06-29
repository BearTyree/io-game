class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'Game' });
	}
	preload() {
		preload.call(this);
	}
	create() {
		create.call(this);
	}
	update(time, delta) {
		update.call(this, time, delta);
	}
}

window.Game = GameScene;

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var scoreText;
var cursorTarget;
var cameraTarget = { x: 0, y: 0 };
var cameraRecoil = { x: 0, y: 0 };
var enemies;
var blackSquare;
var click = 'up';
var shootTimer = 0;
var fireRate = 10;
var canDoubleJump = true;
var firstJumpInput = true;

function preload() {
	this.load.image('sky', 'assets/sky.png');
}

function spawnEnemy(scene) {
	const minX = 50,
		maxX = scene.scale.width - 50;
	const minY = 100,
		maxY = scene.scale.height - 50;
	const x = Phaser.Math.Between(minX, maxX);
	const y = Phaser.Math.Between(minY, maxY);
	let enemy = scene.add.rectangle(x, y, 32, 32, 0xff0000);
	scene.physics.add.existing(enemy);
	enemy.body.setCollideWorldBounds(true);
	enemy.body.setImmovable(true);
	enemy.health = 3;
	enemy.maxHealth = 3;
	enemy.healthBar = scene.add.graphics();
	enemy.healthBar.setDepth(1002);
	scene.enemies.add(enemy);
	return enemy;
}

function create() {
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

	platforms = this.physics.add.staticGroup();

	const platformData = [
		{ x: 400, y: 568, width: 1280, height: 32, scale: 2 },
		{ x: 600, y: 400, width: 64, height: 32 },
		{ x: 50, y: 250, width: 64, height: 32 },
		{ x: 750, y: 220, width: 64, height: 32 },
	];

	platformData.forEach((data, i) => {
		const width = (data.width || 64) * (data.scale || 1);
		const height = (data.height || 32) * (data.scale || 1);
		const rect = this.add.rectangle(data.x, data.y, width, height, 0x888888);
		this.physics.add.existing(rect, true);
		platforms.add(rect);
	});

	player = this.add.rectangle(100, 450, 32, 48, 0x000000);
	this.physics.add.existing(player);
	// player.body.setCollideWorldBounds(true);

	cursors = this.input.keyboard.createCursorKeys();
	wasd = this.input.keyboard.addKeys({
		up: Phaser.Input.Keyboard.KeyCodes.W,
		left: Phaser.Input.Keyboard.KeyCodes.A,
		down: Phaser.Input.Keyboard.KeyCodes.S,
		right: Phaser.Input.Keyboard.KeyCodes.D,
	});

	this.enemies = this.physics.add.group();
	for (let i = 0; i < 5; i++) {
		spawnEnemy(this);
	}

	this.physics.add.collider(player, platforms);
	this.physics.add.collider(this.enemies, platforms);
	this.physics.add.collider(this.enemies, player);
	this.physics.add.collider(this.enemies, this.enemies);

	this.input.on('pointerdown', (pointer) => {
		click = 'down';
	});

	this.input.on('pointerup', (pointer) => {
		click = 'up';
	});

	cursorTarget = this.add.graphics();
	cursorTarget.lineStyle(2, 0xff0000, 1);
	cursorTarget.strokeCircle(0, 0, 10);
	cursorTarget.setDepth(1000);

	blackSquare = this.add.rectangle(0, 0, 10, 10, 0x000000);
	blackSquare.setOrigin(0.5);
	blackSquare.setDepth(1001);

	cameraTarget.x = player.x;
	cameraTarget.y = player.y;
}

function update(time, delta) {
	var left = cursors.left.isDown || wasd.left.isDown;
	var right = cursors.right.isDown || wasd.right.isDown;
	var up = cursors.up.isDown || wasd.up.isDown;

	if (left) {
		player.body.setVelocityX(-160);
	} else if (right) {
		player.body.setVelocityX(160);
	} else {
		player.body.setVelocityX(0);
	}
	if (up && (player.body.touching.down || canDoubleJump) && firstJumpInput) {
		firstJumpInput = false;
		if (!player.body.touching.down) {
			canDoubleJump = false;
		}
		player.body.setVelocityY(-330);
	}

	if (!up) {
		firstJumpInput = true;
	}

	if (player.body.touching.down) {
		canDoubleJump = true;
	}

	var pointer = this.input.activePointer;
	var pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
	cursorTarget.x = pointerWorld.x;
	cursorTarget.y = pointerWorld.y;

	const dx = pointerWorld.x - player.x;
	const dy = pointerWorld.y - player.y;
	const length = Math.sqrt(dx * dx + dy * dy);
	const radius = 30; // match shootRay
	const offsetX = (dx / length) * radius;
	const offsetY = (dy / length) * radius;
	blackSquare.x = player.x + offsetX;
	blackSquare.y = player.y + offsetY;

	blackSquare.rotation = Math.atan2(dy, dx);

	if (shootTimer == 0) {
		if (click == 'down') {
			shootRay.call(this, pointer);
		}
	} else {
		shootTimer -= delta;
		if (shootTimer < 0) {
			shootTimer = 0;
		}
	}

	var lerp = 0.1;
	var targetX = Phaser.Math.Interpolation.Linear([player.x, pointerWorld.x + cameraRecoil.x], 0.2);
	var targetY = Phaser.Math.Interpolation.Linear([player.y, pointerWorld.y + cameraRecoil.y], 0.2);
	cameraTarget.x += (targetX - cameraTarget.x) * lerp;
	cameraTarget.y += (targetY - cameraTarget.y) * lerp;
	this.cameras.main.centerOn(cameraTarget.x, cameraTarget.y);

	this.enemies.getChildren().forEach((enemy) => {
		if (!enemy.active) return;
		// Draw health bar above enemy
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

function showEnemyKilledText(scene, x, y) {
	const text = scene.add.text(x, y - 40, 'Enemy Killed', {
		font: '20px Arial',
		fill: '#ff4444',
		stroke: '#000',
		strokeThickness: 3,
		align: 'center',
	});
	text.setOrigin(0.5);
	text.setDepth(2000);
	scene.tweens.add({
		targets: text,
		y: y - 80,
		alpha: 0,
		duration: 800,
		ease: 'Cubic.easeOut',
		onComplete: () => text.destroy(),
	});
}

function shootRay(pointer) {
	this.game.socket.send(JSON.stringify({ event: 'hi' }));
	if (!player.active) return;
	shootTimer = 1000 / fireRate;
	const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
	const dx = pointerWorld.x - player.x;
	const dy = pointerWorld.y - player.y;
	const length = Math.sqrt(dx * dx + dy * dy);
	const radius = 30;

	const offsetX = (dx / length) * radius;
	const offsetY = (dy / length) * radius;
	const start = new Phaser.Geom.Point(player.x + offsetX, player.y + offsetY);
	const scale = 100000 / length;
	const end = new Phaser.Geom.Point(player.x + dx * scale, player.y + dy * scale);
	let hitEnemy = null;
	let minDist = Infinity;
	let hitPoint = end;
	const ray = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);

	this.enemies.getChildren().forEach((enemy) => {
		if (!enemy.active) return;
		const rect = new Phaser.Geom.Rectangle(enemy.x - 16, enemy.y - 16, 32, 32);
		const intersectPoint = getLineRectIntersection(ray, rect);
		if (intersectPoint) {
			const dist = Phaser.Math.Distance.Between(start.x, start.y, intersectPoint.x, intersectPoint.y);
			if (dist < minDist) {
				minDist = dist;
				hitEnemy = enemy;
				hitPoint = intersectPoint;
			}
		}
	});

	platforms.getChildren().forEach((platform) => {
		const platRect = new Phaser.Geom.Rectangle(
			platform.x - platform.width / 2,
			platform.y - platform.height / 2,
			platform.width,
			platform.height
		);
		const platIntersect = getLineRectIntersection(ray, platRect);
		if (platIntersect) {
			const dist = Phaser.Math.Distance.Between(start.x, start.y, platIntersect.x, platIntersect.y);
			if (dist < minDist) {
				minDist = dist;
				hitEnemy = null; // Platform blocks the shot
				hitPoint = platIntersect;
			}
		}
	});

	if (hitEnemy) {
		hitEnemy.health -= 1;
		if (hitEnemy.health <= 0) {
			hitEnemy.healthBar.destroy();
			showEnemyKilledText(this, hitEnemy.x, hitEnemy.y);
			hitEnemy.destroy();
		}
	}

	let shotAngle = Math.atan2(dy, dx);
	const graphics = this.add.graphics();
	graphics.lineStyle(3, 0xffff00, 1);
	graphics.beginPath();
	graphics.moveTo(start.x, start.y);
	graphics.lineTo(hitPoint.x, hitPoint.y);
	graphics.strokePath();
	graphics.fillStyle(0xffff00, 1);
	graphics.fillCircle(player.x + Math.cos(shotAngle) * 70, player.y + Math.sin(shotAngle) * 70, 20);
	graphics.fillCircle(hitPoint.x, hitPoint.y, 20);

	let recoilAngle = shotAngle + Math.PI;
	let recoilDistance = 300;
	let recoilX = player.x + Math.cos(recoilAngle) * recoilDistance;
	let recoilY = player.y + Math.sin(recoilAngle) * recoilDistance;

	cameraRecoil.x += recoilX - player.x;
	cameraRecoil.y += recoilY - player.y;
	this.time.delayedCall(1000 / (fireRate * 10), () => {
		graphics.destroy();
	});
	this.time.delayedCall(1000 / (fireRate * 2), () => {
		cameraRecoil.x -= recoilX - player.x;
		cameraRecoil.y -= recoilY - player.y;
	});
}

function getLineRectIntersection(line, rect) {
	const points = [];
	const rectLines = [
		new Phaser.Geom.Line(rect.x, rect.y, rect.x + rect.width, rect.y), // top
		new Phaser.Geom.Line(rect.x, rect.y, rect.x, rect.y + rect.height), // left
		new Phaser.Geom.Line(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height), // right
		new Phaser.Geom.Line(rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height), // bottom
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

function resize(gameSize, baseSize, displaySize, resolution) {
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
