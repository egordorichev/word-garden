var canvas
var context

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

function figureOutColor(a, n) {
	return Math.floor(((a % n) + n) % n);
}

class Player {
	constructor(id, room) {
		this.id = id;
		this.room = room;
		this.time = Math.random(10);
		
		this.x = 0;
		this.y = 0;
		this.message = null;
		this.messageTimer = 0;
		this.flip = false;
		this.sx = 1;
		this.sy = 1;
		this.angle = 0;
	}

	update(dt) {
		var data = this.getData();

		this.time += dt;
		this.sx += ((this.flip ? -1 : 1) - this.sx) * dt * 10;

		var dx = data.x - this.x;
		var dy = data.y - this.y;
		var d = Math.sqrt(dx * dx + dy * dy);

		if (d > 8) {
			this.x = data.x;
			this.y = data.y;
		} else if (d > 0.1) {
			var s = dt * 25;

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
		var color = playerColors[figureOutColor(data.color, playerColors.length)];

		if (color) {
			tint(color[0], color[1], color[2]);
		} else {
			tint(255);
		}

		
		push();
		resetMatrix();
		scale(SCALE);
		
		translate(-localPlayer.x + this.x + width / SCALE / 2, -localPlayer.y + this.y + height / SCALE / 2)
	
		rotate(this.angle);
		scale(this.sx, this.sy);
		image(assets["player"], -4, -4, 8, 8, (Math.floor((this.time * 10) % anim.len) + anim.start) * 8, 0, 8, 8);
		pop();

		if (this.message) {
			textSize(4);
			textAlign(CENTER, BOTTOM);
			
			var w = textWidth(data.message)

			fill(0, 0, 0, 150);
			rect(this.x + 4 - w * 0.5, this.y - 2 - 4, w, 4)

			fill(255);
			text(data.message, this.x + 4, this.y - 2);
		} else {
			textSize(4);
			textAlign(CENTER, BOTTOM);
			
			var w = textWidth(data.name)
			
			fill(0, 0, 0, 150);
			rect(this.x + 4 - w * 0.5, this.y - 3 - 3, w, 4)

			fill(255, 255, 255, 100);
			text(data.name, this.x + 4, this.y - 2);
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

		this.sy += (1 - this.sy) * dt * 10;
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
				this.flip = true;
			}

			if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
				dx += 1;
				this.flip = false;
			}
		}

		this.angle += (dx * 0.3 - this.angle) * dt * 10;
		var data = this.getData();

		if (data.dx != dx || data.dy != dy) {
			this.room.send("keys", [ dx, dy ]);
		}

		if (dx != 0 || dy != 0) {
			var s = deltaTime * 60;

			if (data.state != "run") {
				data.state = "run";
				this.sy = 2;
				this.room.send("state", "run");
			}

			this.timer += dt;

			if (this.timer >= 2) {
				this.timer = 0;
				room.send("fetch");
			}
		} else {
			if (data.state != "idle") {
				data.state = "idle";
				this.sy = 0.3;
				this.room.send("state", "idle");
			}
		}
	}
}