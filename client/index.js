var client = new Colyseus.Client('ws://localhost:2567');
var draw = () => {};
var players = new Map();
var playerArray = [];
var room;

client.joinOrCreate('room').then(r => {
	room = r;
	console.log(room.sessionId, "joined", room.name);

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.state.players.onAdd = function(player, sessionId) {
		console.log("Player added", sessionId);
		var player = sessionId == room.sessionId ? new LocalPlayer(sessionId, room) : new Player(sessionId, room);

		players.set(sessionId, player);
		playerArray.push(player);
	}

	room.state.players.onRemove = function(player, sessionId) {
		console.log("Player left", sessionId);

		playerArray.splice(playerArray.indexOf(players.get(sessionId)), 1);
		players.delete(sessionId);
	}

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

function setupDraw() {
	draw = () => {
		update();
		background(0, 0, 0);
		scale(4);
	
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
	if (room != undefined) {
		room.send("chat", input.value);
	}

	input.value = "";
});