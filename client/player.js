const playerAnimations = {
	idle: {
		len: 6,
		start: 0
	},

	run: {
		len: 5,
		start: 6
	}
}

const playerColors = [
	[ 126, 37, 83 ],
	[ 0, 135, 81 ],
	[ 29, 43, 83 ],
	[ 255, 255, 255 ],
	[ 194, 195, 199 ],
	[ 255, 0, 77 ],
	[ 255, 163, 0 ],
	[ 255, 236, 39 ],
	[ 0, 228, 54 ],
	[ 131, 118, 156 ],
	[ 255, 119, 168 ] 
]

class Player {
	constructor(id, room) {
		this.id = id;
		this.room = room;
		this.time = Math.random(10);
		
		this.x = 0;
		this.y = 0;
		this.message = null;
		this.messageTimer = 0;
	}

	update(dt) {
		var data = this.getData();

		this.time += dt;

		var dx = data.x - this.x;
		var dy = data.y - this.y;
		var d = Math.sqrt(dx * dx + dy * dy);

		if (d > 8) {
			this.x = data.x;
			this.y = data.y;
		} else if (d > 0.1) {
			var s = dt * 20;

			this.x += dx * s;
			this.y += dy * s;
		}

		if (data.message != this.message) {
			this.message = data.message;
			this.messageTimer = 3;
		}

		if (this.message) {
			this.messageTimer -= dt;

			if (this.messageTimer <= 0) {
				this.message = null;
				data.message = null;
			}
		}
	}

	getData() {
		return this.room.state.players[this.id];
	}

	render() {
		var data = this.getData();
		var anim = playerAnimations[data.currentState];
		var color = playerColors[data.color];

		if (color) {
			tint(color[0], color[1], color[2]);
		} else {
			tint(255);
		}

		image(assets["player"], this.x, this.y, 8, 8, (Math.floor((this.time * 10) % anim.len) + anim.start) * 8, 0, 8, 8);

		if (this.message) {
			fill(255);
			textSize(6);
			textAlign(CENTER, BOTTOM);
			text(data.message, this.x + 4 - 16, this.y - 2, 32);
		}
	}
}

class LocalPlayer extends Player {
	constructor(id, room) {
		super(id, room);
		this.timer = -1;
	}

	update(dt) {
		if (this.timer == -1) {
			room.send("fetch");
			this.timer = 0;
		}

		super.update(dt);

		var dx = 0;
		var dy = 0;

		if (!this.room.inputBlocked) {
			if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
				dy = -1;
			}

			if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
				dy += 1;
			}

			if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
				dx = -1;
			}

			if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
				dx += 1;
			}
		}

		var data = this.getData();

		if (dx != 0 || dy != 0) {
			var s = deltaTime * 60;

			this.room.send("move", { 
				x: dx * s,
				y: dy * s
			});

			if (data.state != "run") {
				this.room.send("state", "run");
			}

			this.timer += dt;

			if (this.timer >= 2) {
				this.timer = 0;
				room.send("fetch");
			}
		} else {
			if (data.state != "idle") {
				this.room.send("state", "idle");
			}
		}

		if (data.color == -1) {
			this.room.send("setup", {
				color: Math.floor(Math.random() * playerColors.length)
			});
		}
	}
}