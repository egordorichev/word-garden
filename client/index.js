var client = new Colyseus.Client('ws://localhost:2567');
var draw = () => {};
var players = new Map();
var playerArray = [];
var room;
var localPlayer;
var cx = 0;
var cy = 0;

client.joinOrCreate('room').then(r => {
	room = r;
	console.log(room.sessionId, "joined", room.name);

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.state.players.onAdd = function(player, sessionId) {
		console.log("Player added", sessionId);

		var local = sessionId == room.sessionId;
		var player = local ? new LocalPlayer(sessionId, room) : new Player(sessionId, room);

		if (local) {
			localPlayer = player;
			cx = player.x;
			cy = player.y;
		}

		players.set(sessionId, player);
		playerArray.push(player);
	}

	room.state.players.onRemove = function(player, sessionId) {
		console.log("Player left", sessionId);

		playerArray.splice(playerArray.indexOf(players.get(sessionId)), 1);
		players.delete(sessionId);
	}

	room.onMessage("data", data => {
		room.data = data;
	});

	room.onMessage("add_data", message => {
		if (!room.data) {
			room.data = [];
		}

		room.data.push(message);
	});

	setupDraw();
}).catch(e => {
	console.log(e);
});

var canvas
var assets = {}

function setup() {
	canvas = createCanvas(window.innerWidth, window.innerHeight);

	let context = canvas.elt.getContext('2d');
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;

	assets["player"] = loadImage("assets/player.png");
}

window.onresize = () => {
	resizeCanvas(window.innerWidth, window.innerHeight);
}

function update() {
	if (room == undefined) {
		return;
	}

	deltaTime /= 1000;

	playerArray.forEach((p) => {
		p.update(deltaTime);
	});

	playerArray.sort((a, b) => a.y > b.y ? 1 : -1);
}

function keyPressed() {
	if (keyCode == 32 && room && !room.inputBlocked) {
		setModalEnabled(true);
	}
}

function setupDraw() {
	draw = () => {
		update();

		translate(width * 0.5, height * 0.5)

		background(0);
		scale(4);

		if (localPlayer) {
			var dx = localPlayer.x - cx;
			var dy = localPlayer.y - cy;
			var d = Math.sqrt(dx * dx + dy * dy);

			if (d > 32) {
				cx = dx;
				cy = dy;
			} else if (d > 1) {
				var s = deltaTime * 5;
			
				cx += (dx) * s;
				cy += (dy) * s;
			}

			translate(-cx - 4, -cy - 4);
		}

		if (room.data) {
			stroke(0);
			strokeWeight(4);

			room.data.forEach((d) => {
				fill(255);
				textSize(4);
				textAlign(CENTER, BOTTOM);
				text(d[3], d[0] - 32, d[1] - 2, 64);
				fill(200);
				text(d[2], d[0] - 32, d[1] - 8, 64);
			});

			noStroke();
		}
	
		playerArray.forEach((p) => {
			p.render();
		});
	}
}

var input = document.getElementById("chat");
var button = document.getElementById("send");

input.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    button.click();
  }
});

button.addEventListener("click", () => {
	if (room.inputBlocked) {
		return;
	}

	if (room != undefined && input.value.length > 0 && input.value.length <= 256) {
		room.send("chat", input.value);
	}

	input.value = "";
});

function setModalEnabled(enabled) {
	room.inputBlocked = enabled;

	var o = document.getElementById("overlay");
	var c = canvas.elt;

	if (enabled) {
		o.classList.remove("hidden");
		c.classList.add("blurred");
	} else {
		o.classList.add("hidden");
		c.classList.remove("blurred");
	}
}

var messsageArea = document.getElementById("message");
var leaveMessage = document.getElementById("leave");
var cancel = document.getElementById("cancel");

function trim() {
	if (messsageArea.value.length > 256) {
		messsageArea.value = messsageArea.value.substring(0, 256);
	}
}

messsageArea.addEventListener("input", trim);
messsageArea.addEventListener("paste", trim);
messsageArea.addEventListener("change", trim);

leaveMessage.addEventListener("click", () => {
	if (!room.inputBlocked) {
		return;
	}

	if (room != undefined && messsageArea.value.length > 0 && messsageArea.value.length <= 256) {
		room.send("message", messsageArea.value);
	}

	messsageArea.value = "";
	setModalEnabled(false);
});

cancel.addEventListener("click", () => {
	if (!room.inputBlocked) {
		return;
	}


	messsageArea.value = "";
	setModalEnabled(false);
});