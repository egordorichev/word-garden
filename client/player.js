class Player {
	constructor(id, room) {
		this.id = id;
		this.room = room;
		this.time = Math.random(10);

		console.log(id, room);
	}

	update(dt) {
		this.time += dt;
	}

	render() {
		var p = this.room.state.players[this.id];
		image(assets["player"], p.x, p.y, 8, 8, Math.floor(this.time * 10 % 6) * 8, 0, 8, 8);
	}
}

class LocalPlayer extends Player {
	constructor(id, room) {
		super(id, room);
	}

	update(dt) {
		super.update(dt);

		var dx = 0;
		var dy = 0;

		if (keyIsDown(UP_ARROW)) {
			dy = -1;
		}

		if (keyIsDown(DOWN_ARROW)) {
			dy += 1;
		}

		if (keyIsDown(LEFT_ARROW)) {
			dx = -1;
		}

		if (keyIsDown(RIGHT_ARROW)) {
			dx += 1;
		}

		if (dx != 0 || dy != 0) {
			var s = deltaTime * 50;

			this.room.send("move", { 
				x: dx * s,
				y: dy * s
			});
		}
	}
}